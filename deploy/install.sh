current_dir=$(pwd)

INSTALL_DIR=$HOME/.kalserver
rm -rf $INSTALL_DIR
mkdir -p $INSTALL_DIR

KAL_URL="https://github.com/tanayvk/Kal/releases/latest/download/linux.zip"

temp_dir="/tmp/$(tr -dc A-Za-z0-9 </dev/urandom | head -c 13; echo)"
mkdir -p $temp_dir
cd $temp_dir

curl -# -L $KAL_URL -o kal.zip
unzip kal.zip -d $INSTALL_DIR > /dev/null

cd $INSTALL_DIR
docker compose up -d

echo "Let's setup SSL."

read -p "Enter the domain that's pointing to this server:" DOMAIN
read -p "Enter an operator email: " EMAIL

sudo docker run -it --rm --name certbot \
            -v "/etc/letsencrypt:/etc/letsencrypt" \
            -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
            -v "$INSTALL_DIR/nginx/static:/var/www/html" \
            certbot/certbot certonly -n -d $DOMAIN --webroot \
            --agree-tos --email $EMAIL -w "/var/www/html"

cp $INSTALL_DIR/nginx/nginx-ssl.conf $INSTALL_DIR/nginx/nginx.conf
sed -i "s/DOMAIN/$DOMAIN/g" $INSTALL_DIR/nginx/nginx.conf
docker compose restart nginx

echo "Let's create a user to access Kal."

read -p "Enter your username: " USER

while true; do
  read -sp "Enter your password: " PASS
  echo
  read -sp "Confirm your password: " PASS_CONFIRM
  echo
  [ "$PASS" = "$PASS_CONFIRM" ] && break
  echo "Passwords do not match. Please try again."
done

docker compose exec -T app bash -c "bun run /app/index.js init -u $USER -p $PASS"

cd $current_dir
rm -rf $temp_dir
