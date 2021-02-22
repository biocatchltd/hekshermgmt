#!/bin/sh
python -m pytest tests/unittests -s -x --cov=hekshermgmt --cov-report=xml --cov-report=term-missing