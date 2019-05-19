#!/usr/bin/env bash

export MYMONEY_SOCKET="/Applications/MAMP/tmp/mysql/mysql.sock"
export MYMONEY_DB_HOST="localhost"
export MYMONEY_DB_USER="mymoney"
export MYMONEY_DB_PASS="mymoney"
export MYMONEY_DB_NAME="mymoney"

./node_modules/jasmine/bin/jasmine.js
