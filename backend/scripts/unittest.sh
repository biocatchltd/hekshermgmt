#!/bin/sh
python -m pytest tests/unittests -s -x --cov=app --cov-report=xml --cov-report=term-missing