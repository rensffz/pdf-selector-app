#!/bin/bash
# run_all.sh

python3 public/files/script.py

if [ $? -ne 0 ]; then
  exit 1
fi
mv files.json ./public/files.json
echo "files.json created. running server..."
npm run dev
