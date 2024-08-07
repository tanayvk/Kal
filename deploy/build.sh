#!/usr/bin/env bash

current_dir=$(pwd)
temp_dir="/tmp/$(tr -dc A-Za-z0-9 </dev/urandom | head -c 13; echo)"
echo $temp_dir
output=$(realpath $1)


cd $(dirname "$0")

cd ../api

# api

bun install
bun build src/index.ts --target bun --outdir "$temp_dir/app" --define "import.meta.prod=true"
cp -r drizzle "$temp_dir/app"

# frontend

cd ../frontend
pnpm install
pnpm run build
mkdir -p "$temp_dir/nginx/static"
cp -r dist/* "$temp_dir/nginx/static"

# deploy

cd ../deploy
cp ./docker-compose.yml "$temp_dir"
cp ./nginx.conf "$temp_dir/nginx"
cp ./nginx-ssl.conf "$temp_dir/nginx"

# zip
cd $temp_dir
zip -r $output .

# go back
cd $current_dir
