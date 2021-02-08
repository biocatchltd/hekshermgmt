#!/bin/sh
python -m pytest tests -s -x --cov=app --cov-report=xml --cov-report=term-missing