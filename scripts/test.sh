#!/bin/sh

set -e

cd front
sh scripts/test.sh

cd ../back
poetry run sh scripts/test.sh