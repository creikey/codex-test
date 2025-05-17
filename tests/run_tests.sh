#!/bin/sh
set -e

# Build
make >/dev/null

# Run test1
output=$(./interpreter tests/test1.mini)
if [ "$output" = "$(cat tests/expected1.txt)" ]; then
  echo "test1: ok"
else
  echo "test1: fail (expected $(cat tests/expected1.txt), got $output)"
  exit 1
fi

echo "All tests passed."
