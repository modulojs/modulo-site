#!/bin/bash

if [[ -z "$1" ]]; then
    echo "Specify create-modulo version number as argument"
    exit 1
fi

# run my build
npm run build

# run docs build
cd docs
bash build.sh
cd ..

# Do release
bash static/scripts/release.sh $1

