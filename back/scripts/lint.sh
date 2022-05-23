#!/bin/sh

set -e
isort . --check-only
flake8 .
mypy . --show-error-codes