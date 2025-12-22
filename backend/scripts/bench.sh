#!/usr/bin/env bash
set -euo pipefail

# Simple HTTP benchmarking helper for local development
# Prefers `hey`, falls back to `wrk` if available.

USAGE() {
  cat <<EOF
Usage: $0 [-u METHOD] [-p PATH] [-c CONCURRENCY] [-n REQUESTS] [-d DURATION]

Options:
  -u METHOD        HTTP method (GET|POST). Default: GET
  -p PATH          Request path (e.g. /api/posts or /api/search?q=rust). Default: /api/posts
  -c CONCURRENCY   Concurrent clients/requests (hey/wrk concurrency). Default: 50
  -n REQUESTS      Total number of requests (hey). Default: 1000
  -d DURATION      Duration in seconds for wrk (fallback) (e.g. 10). Default: 10
  -a ADDR          Server address (host:port). Default: ${SERVER_ADDR:-127.0.0.1:8080}

Examples:
  $0 -p "/api/posts" -c 100 -n 2000
  $0 -p "/api/search?q=sqlite" -c 50 -n 1000

Note: Install `hey` (https://github.com/rakyll/hey) or `wrk` to use this script.
EOF
}

# defaults
METHOD="GET"
PATH="/api/posts"
CONC=50
NUM=1000
DURATION=10
ADDR="${SERVER_ADDR:-127.0.0.1:8080}"

while getopts "u:p:c:n:d:a:h" arg; do
  case "$arg" in
    u) METHOD="$OPTARG" ;; 
    p) PATH="$OPTARG" ;; 
    c) CONC="$OPTARG" ;; 
    n) NUM="$OPTARG" ;; 
    d) DURATION="$OPTARG" ;; 
    a) ADDR="$OPTARG" ;; 
    h) USAGE; exit 0 ;; 
    *) USAGE; exit 1 ;;
  esac
done

URL="http://${ADDR}${PATH}"

echo "Benchmarking $METHOD $URL (concurrency=$CONC, requests=$NUM, duration=${DURATION}s)"

if command -v hey >/dev/null 2>&1; then
  echo "Using: hey"
  # hey uses -m for method, -c concurrency, -n number
  if [ "$METHOD" = "GET" ]; then
    hey -c "$CONC" -n "$NUM" "$URL"
  else
    # For non-GET, we do a simple POST with empty body
    hey -m "$METHOD" -c "$CONC" -n "$NUM" -d '' "$URL"
  fi
elif command -v wrk >/dev/null 2>&1; then
  echo "Using: wrk"
  # wrk uses -t threads -c connections -d duration
  # map concurrency to connections, use 2 threads by default
  THREADS=2
  wrk -t${THREADS} -c${CONC} -d${DURATION}s "$URL"
else
  echo "Please install 'hey' or 'wrk' to run benchmarks."
  exit 2
fi
