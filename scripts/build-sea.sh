#!/bin/bash
set -e

# Generate SEA blob
node --experimental-sea-config sea-config.json

# Copy node binary
cp $(which node) dist/app

# Inject blob into binary
bunx postject dist/app NODE_SEA_BLOB dist/sea-prep.blob \
 --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2

# Copy native module alongside the binary (not needed since /native is not used)
cp node_modules/@gtkx/native-linux-x64/index.node dist/