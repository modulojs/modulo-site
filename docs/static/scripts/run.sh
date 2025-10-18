#!/bin/bash

# (Note: Use a .env-type file with MODULO_* settings set to configure)

######
# (Step 1: Configure)
# Configure JavaScript runtime (e.g. "node" and "bun" should both work)
RUNTIME="${MODULO_RUNTIME:-node}"

# Configure preferred driver (e.g. "firefox=gui" to use Playwright-Firefox)
DRIVER="${MODULO_DRIVER:-oludom}"

# Configure path to your main file to run commands on
FILE="${MODULO_INDEX:-index.html}"

# Configure timeout delay (ms) -- increase this is if its closing before saving
DELAY="${MODULO_DELAY:-9000}"

# Configure readable files
READ="*.* **/*.*"

# Configure writeable directories (must start with _ and end with /)
WRITE="_build/"

# Configure path to OluDOM JavaScript file
SCRIPT_PATH="static/scripts/node-oludom.mjs"


# Configure protocol simulation (e.g, file vs http (default), or https)
PROTO="file"
PROJECT_PATH="$(pwd)"
HOST="oludom.local"
PORT="80"


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
mkdir -p $WRITE/articles # TODO
BINARY="$(which $RUNTIME)"


######
# (Step 3: Run OluDOM)
exec $BINARY $SCRIPT_PATH "$FILE?argv=$argvGetArgs" "--$DRIVER" --proto=$PROTO --host=$HOST --port=$PORT --path=$PROJECT_PATH --delay=$DELAY $WRITE $READ
