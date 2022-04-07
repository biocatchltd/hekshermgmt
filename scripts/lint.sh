#!/bin/sh

set -e

cd front
sh scripts/lint.sh

cd ../back
poetry run sh scripts/lint.sh