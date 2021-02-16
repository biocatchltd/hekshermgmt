#!/bin/sh
python -m pytest tests/blackbox -s -x --cov=hekshermgmt --cov-report=xml --cov-report=term-missing