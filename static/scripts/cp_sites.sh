#!/bin/bash

######
# (Step 1: Copy static / dev stuff to _build)
cp -r static _build/
cp Modulo.html _build/


######
# (Step 2: Copy results to modulo-pages)
rm modulo-pages/*.*
rm -r modulo-pages/*
cp -r _build/* modulo-pages/

