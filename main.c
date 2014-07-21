#include <stdio.h>
#include "aalib.h"

static aa_context * context;
static aa_renderparams *params;
static unsigned char *bitmap;

void init() {
    context = aa_autoinit (&aa_defparams);
    if(!context) {
        printf ("Failed to initialize aalib\n");
        exit(1);
    }
    params = aa_getrenderparams ();
    params->bright = 0;
    params->contrast = 63;
    params->gamma = 1.0;
    bitmap = aa_image (context);
    aa_hidecursor (context);
}

int get_img_width() {
    return aa_imgwidth(context);
}

int get_img_height() {
    return aa_imgheight(context);
}

unsigned char * get_buffer () {
    return bitmap;
}

void set_brightness(int b) {
    params->bright = b;
}

void set_contrast(int c) {
    params->contrast = c;
}

void set_gamma(float g) {
    params->gamma = g;
}

void render() {
    aa_render(context, params, 0, 0, aa_scrwidth(context), aa_scrheight(context));
    aa_flush(context);
}




