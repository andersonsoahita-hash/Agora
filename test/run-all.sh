#!/bin/sh
# Lance toute la batterie (après `node build.js`)
set -e
cd "$(dirname "$0")/.."
node test/legacy-build.js
for t in smoke pwa update express all levels erist prep; do echo "=== $t"; node test/$t.js; done
