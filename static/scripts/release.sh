#!/bin/bash

if [[ -z "$1" ]]; then
    echo "Specify create-modulo version number as argument"
    exit 1
fi

DOWNLOADS="static/components/Downloads.html"

echo "-------------------------"
echo "RELEASING VERSION: $1"
echo "--- Updating create-modulo version number"
sed -i 's/create-modulo-version=".*"/create-modulo-version="'$1'"/'  $DOWNLOADS
echo "-------------------------"


######
# (Step 1: Copy static / dev stuff to _build)
cp -r static _build/
cp Modulo.html _build/
cp favicon.ico _build/

######
# (Step 2: Copy results to modulo-pages)
mv modulo-pages/CNAME ./
rm -r modulo-pages/*
cp -r _build/* modulo-pages/
mv ./CNAME modulo-pages/

cd modulo-pages/

git add -A
git commit -m "Release $1"
git push
