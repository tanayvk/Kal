#!/usr/bin/env bash

current_dir=$(pwd)
temp_dir="/tmp/$(date +%s%N | base64 | tr -dc 'a-zA-Z0-9' | head -c 8)"
output=$(realpath $1)


cd $(dirname "$0")

cd ../api

# api

bun build src/index.ts --target bun --outdir "$temp_dir/app"
cp -r drizzle "$temp_dir/app"

# frontend

cd ../frontend
pnpm run build
mkdir -p "$temp_dir/nginx"
cp -r dist "$temp_dir/nginx"

# deploy

cd ../deploy
cp ./docker-compose.yml "$temp_dir"
cp ./nginx.conf "$temp_dir/nginx"

# zip
cd $temp_dir
zip -r $output .

# go back
cd $current_dir
