#!/bin/bash
cd /home/rushank/backend
node --input-type=commonjs -e "require('./dist/server')" 2>&1
