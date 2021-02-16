#!/bin/sh
sh backend/scripts/test.sh
(cd frontend; npm run lint)