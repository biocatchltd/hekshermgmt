#!/bin/sh
python -m pytest tests/blackbox -s -x --cov=app --cov-report=xml --cov-report=term-missing