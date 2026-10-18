#!/bin/bash
# Starts Carousels Are Easy and opens it in your browser. Leave this window open while you use the app.
cd "$(dirname "$0")/App"
command -v node >/dev/null || { echo "Node.js is not installed. Get it from https://nodejs.org and run this again."; read; exit 1; }
(sleep 1; open http://127.0.0.1:4330) &
node server.cjs
