#!/bin/bash
set -e
[ -z $EM_DIR] && EM_DIR=~/src/emscripten
[ -z $AALib_DIR] && AALib_DIR=~/src/aalib.js

mkdir web || true
$EM_DIR/emcc \
    -Oz \
    -o web/aaWebCam.js \
    -I $AALib_DIR/src \
    main.c \
    $AALib_DIR/src/.libs/libaa.a \
    --memory-init-file 1 \
    --js-library $AALib_DIR/web/aaweb.js \
    -s ASYNCIFY=1 \
    -s EXPORTED_FUNCTIONS="['_init', '_get_img_width', '_get_img_height', '_get_buffer', '_set_brightness', '_set_contrast', '_set_gamma', '_render']" \

