#!/bin/sh
poetry run pytest tests -s -x --cov=hekshermgmt --cov-report=xml --cov-report=term-missing