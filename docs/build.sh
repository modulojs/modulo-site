#!/bin/bash


# (Step 1: Configure)
RUNTIME="node"
DRIVER="firefox"
FILE="index.html"
READ="*.* **/*.*"
WRITE="_build/"
SCRIPT_PATH="static/scripts/node-oludom.mjs"

PROTO="file" # protocol simulation
PROJECT_PATH="$(pwd)"
HOST="oludom.local"
PORT="80"


runcmd() {
######
# (Step 2: Prepare args & empty dirs)
if [[ -z "$@" ]]; then # _default if no additional args, else join with "&argv="
    argvGetArgs="_default"
else
    argvArr=( "$@" )
    argvSpaced=${argvArr[@]}
    argvGetArgs=${argvSpaced// /\&argv=}
fi
mkdir -p $WRITE
BINARY="$(which $RUNTIME)"


######
# (Step 3: Run OluDOM)
$BINARY $SCRIPT_PATH "$FILE?argv=$argvGetArgs" "--$DRIVER" --proto=$PROTO --host=$HOST --port=$PORT --path=$PROJECT_PATH $WRITE $READ
}


# Do it!
rm -fr _build/*
echo "[%===========]"
runcmd build1
echo "[%%%%========]"
runcmd build2
echo "[%%%%%%%=====]"
runcmd build3
echo "[%%%%%%%%%===]"
runcmd build4
echo "[%%%%%%%%%%%=]"
cp -r static _build/
