#!/bin/zsh
cd -- "${0:A:h}"
if ! command -v npm >/dev/null 2>&1; then
  print 'Install Node.js 22 or later, then open this launcher again.'
  read '?Press Enter to close.'
  exit 1
fi
if [[ ! -d node_modules ]]; then
  npm ci || exit 1
fi
npm run build || exit 1
print 'Open http://localhost:5173 after the server starts.'
npm start
