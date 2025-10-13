#!/bin/bash

if [[ -z "$1" ]]; then
    echo "Specify create-modulo version number as argument"
    exit 1
fi

echo "-------------------------"
echo "RELEASING VERSION: $1"
echo "--- Updating create-modulo version number"
jq '.createmodulo="'"$1"'"' package.json > /tmp/package.json
cp /tmp/package.json package.json
echo "-------------------------"

######
# (Step 1: Copy static / dev stuff to _build)
cp -r static _build/
cp Modulo.html _build/


######
# (Step 2: Copy results to modulo-pages)
rm modulo-pages/*.*
rm -r modulo-pages/*
cp -r _build/* modulo-pages/

cd modulo-pages/

git add -A
git commit -m "Release $1"
git push
