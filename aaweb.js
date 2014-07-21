var LibraryAAWeb = {
  $aaweb: {
    canvas_node: null,
    ctx: null,
    cols: 160,
    rows: 50,
    x: 0,
    y: 0,
    attr: 0,
    font: 'Source Code Pro',
    font_size: 6, 
    bg_color: '#000',
    dim_color: '#555',
    normal_color: '#aaa',
    bold_color: '#fff',

    MASK_NORMAL: 1,
    MASK_DIM: 2,
    MASK_BOLD: 4,
    MASK_BOLDFONT: 8,
    MASK_REVERSE: 16,
  },
  aaweb_init: function() {
    var font_test_node = document.getElementById('aa-font-test');
    font_test_node.style.font = aaweb.font_size + 'px "' + aaweb.font + '"';
    font_test_node.innerHTML = 'm';

    var devicePixelRatio = window.devicePixelRatio;
    aaweb.char_height = Math.max(1, font_test_node.clientHeight * devicePixelRatio);
    aaweb.char_width = Math.max(1, font_test_node.clientWidth * devicePixelRatio);

    var canvas_node = aaweb.canvas_node = document.getElementById('aa-canvas');
    canvas_node.width = aaweb.cols * aaweb.char_width;
    canvas_node.height = aaweb.rows * aaweb.char_height;
    canvas_node.style.width = canvas_node.width / devicePixelRatio + canvas_node.offsetWidth - canvas_node.clientWidth + 'px';
    canvas_node.style.height = canvas_node.height / devicePixelRatio + canvas_node.offsetHeight - canvas_node.clientHeight + 'px';

    var ctx = aaweb.ctx = canvas_node.getContext('2d');
    ctx.font = aaweb.font_size * devicePixelRatio + 'px "' + aaweb.font + '"';
    ctx.textBaseline = 'bottom';
  },
  aaweb_get_width: function() {
    return aaweb.cols;
  },
  aaweb_get_height: function() {
    return aaweb.rows;
  },
  aaweb_setattr: function(attr) {
    aaweb.attr = attr;
  },
  aaweb_print: function(p) {
    p = Pointer_stringify(p);
    var x = aaweb.x * aaweb.char_width;
    var y = aaweb.y * aaweb.char_height;
    var w = p.length * aaweb.char_width;
    var ctx = aaweb.ctx;
    var bg_style = aaweb.bg_color;
    var fg_style = aaweb.normal_color;
    var attr = aaweb.attr;
    if(attr & aaweb.MASK_DIM) 
        fg_style = aaweb.dim_color;
    if(attr & aaweb.MASK_BOLD)
        fg_style = aaweb.bold_color;
    if(attr & aaweb.MASK_REVERSE) {
        var tmp = fg_style;
        fg_style = bg_style;
        bg_style = tmp;
    }
        
    ctx.fillStyle = bg_style;
    ctx.fillRect(x, y, w, aaweb.char_height);
    ctx.fillStyle = fg_style;
    ctx.fillText(p, x, y + aaweb.char_height, w);
    aaweb.x += p.length;
  },
  aaweb_gotoxy: function(x,y) {
    aaweb.x = x;
    aaweb.y = y;
  }
};
autoAddDeps(LibraryAAWeb, '$aaweb');
mergeInto(LibraryManager.library, LibraryAAWeb);
