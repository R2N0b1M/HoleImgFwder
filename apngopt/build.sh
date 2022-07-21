#!/bin/bash

DOCKER_BUILDKIT=1 docker build . --output .
mv apngopt.js ../public/apngopt.js
mv apngopt.wasm ../public/apngopt.wasm