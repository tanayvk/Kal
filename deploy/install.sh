current_dir=$(pwd)

INSTALL_DIR=$HOME/.kalserver
rm -rf $INSTALL_DIR
mkdir -p $INSTALL_DIR

KAL_URL="https://github.com/tanayvk/Kal/releases/latest/download/linux.zip"

temp_dir="/tmp/$(date +%s%N | base64 | tr -dc 'a-zA-Z0-9' | head -c 8)"
mkdir -p $temp_dir
cd $temp_dir

curl -# -L $KAL_URL -o kal.zip
unzip kal.zip -d $INSTALL_DIR > /dev/null

cd $INSTALL_DIR
docker-compose up -d

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

docker-compose exec -T app bash -c "bun run /app/index.js init -u $USER -p $PASS"

cd $current_dir
rm -rf $temp_dir
