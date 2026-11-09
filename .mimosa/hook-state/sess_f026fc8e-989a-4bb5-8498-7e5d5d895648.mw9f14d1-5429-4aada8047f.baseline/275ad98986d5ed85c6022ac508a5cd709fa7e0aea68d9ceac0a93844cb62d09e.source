#!/bin/sh
# Playwright webServer wrapper: starts the dev server and warms every route
# the E2E suite visits, so no test hits a cold on-demand compile (which can
# remount the page mid-test). Then stays in the foreground on the server.
cd "$(dirname "$0")/.."

npm run dev &
SERVER_PID=$!

for i in $(seq 1 90); do
  if curl -sf http://localhost:3000/ -o /dev/null &&
     curl -sf http://localhost:3000/dev/validate -o /dev/null &&
     curl -sf http://localhost:3000/preview/fixture/moon-phases -o /dev/null &&
     curl -sf http://localhost:3000/preview/template/seasons -o /dev/null; then
    break
  fi
  sleep 1
done

wait $SERVER_PID
