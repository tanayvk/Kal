#!/bin/bash

current_dir=$(pwd)
INSTALL_DIR="$HOME/.kalserver"
temp_dir="/tmp/$(tr -dc A-Za-z0-9 </dev/urandom | head -c 13; echo)"
KAL_URL="https://github.com/tanayvk/Kal/releases/latest/download/linux.zip"

# Colors
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${BLUE}Installing Kal Server...${NC}"

rm -rf $INSTALL_DIR
mkdir -p $INSTALL_DIR

mkdir -p $temp_dir
cd $temp_dir

echo -e "${YELLOW}Downloading Kal Server...${NC}"
curl -# -L $KAL_URL -o kal.zip
unzip -qq kal.zip -d $INSTALL_DIR

cd $INSTALL_DIR
echo -e "${YELLOW}Starting Kal Server...${NC}"
docker compose up -d

echo -e "${GREEN}Kal Server is now running!${NC}"

while true; do
  echo -e "${BLUE}Let's set up SSL.${NC}"

  read -p "Enter the domain that's pointing to this server: " DOMAIN
  read -p "Enter an operator email: " EMAIL

  sudo docker run -it --rm --name certbot \
              -v "/etc/letsencrypt:/etc/letsencrypt" \
              -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
              -v "$INSTALL_DIR/nginx/static:/var/www/html" \
              certbot/certbot certonly -n -d $DOMAIN --webroot \
              --agree-tos --email $EMAIL -w "/var/www/html"

  if sudo [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo -e "${GREEN}SSL certificates were successfully created!${NC}"
    break
  else
    echo -e "${RED}Error: SSL certificates were not created. Please try again.${NC}"
  fi
done

cp $INSTALL_DIR/nginx/nginx-ssl.conf $INSTALL_DIR/nginx/nginx.conf
sed -i "s/DOMAIN/$DOMAIN/g" $INSTALL_DIR/nginx/nginx.conf
docker compose restart nginx

echo -e "${GREEN}SSL setup complete!${NC}"

echo -e "${BLUE}Let's create a user to access Kal.${NC}"

read -p "Enter your username: " USER

while true; do
  read -sp "Enter your password: " PASS
  echo
  read -sp "Confirm your password: " PASS_CONFIRM
  echo
  if [ "$PASS" = "$PASS_CONFIRM" ]; then
    break
  else
    echo -e "${YELLOW}Passwords do not match. Please try again.${NC}"
  fi
done

docker compose exec -T app bash -c "bun run /app/index.js init -u $USER -p $PASS"

cd $current_dir
rm -rf $temp_dir

echo -e "${GREEN}Setup complete! You can now access Kal.${NC}"
