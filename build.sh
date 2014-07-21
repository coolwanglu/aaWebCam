#!/bin/bash
set -e
[ -z $EM_DIR] && EM_DIR=~/src/emscripten

mkdir web || true
$EM_DIR/emcc \
    -Oz \
    -o web/aaWebCam.js \
    main.c \
    libaa.a \
    --memory-init-file 1 \
    --js-library aaweb.js \
    -s ASYNCIFY=1 \
    -s EXPORTED_FUNCTIONS="['_init', '_get_img_width', '_get_img_height', '_get_buffer', '_set_brightness', '_set_contrast', '_set_gamma', '_render']" \

