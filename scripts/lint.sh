#!/bin/sh

set -e

cd front
npx eslint src

cd ../back
poetry run isort . --check-only
poetry run flake8 .
poetry run mypy . --show-error-codes