var Module;
if (!Module) Module = (typeof Module !== "undefined" ? Module : null) || {};
var moduleOverrides = {};
for (var key in Module) {
 if (Module.hasOwnProperty(key)) {
  moduleOverrides[key] = Module[key];
 }
}
var ENVIRONMENT_IS_NODE = typeof process === "object" && typeof require === "function";
var ENVIRONMENT_IS_WEB = typeof window === "object";
var ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
 if (!Module["print"]) Module["print"] = function print(x) {
  process["stdout"].write(x + "\n");
 };
 if (!Module["printErr"]) Module["printErr"] = function printErr(x) {
  process["stderr"].write(x + "\n");
 };
 var nodeFS = require("fs");
 var nodePath = require("path");
 Module["read"] = function read(filename, binary) {
  filename = nodePath["normalize"](filename);
  var ret = nodeFS["readFileSync"](filename);
  if (!ret && filename != nodePath["resolve"](filename)) {
   filename = path.join(__dirname, "..", "src", filename);
   ret = nodeFS["readFileSync"](filename);
  }
  if (ret && !binary) ret = ret.toString();
  return ret;
 };
 Module["readBinary"] = function readBinary(filename) {
  return Module["read"](filename, true);
 };
 Module["load"] = function load(f) {
  globalEval(read(f));
 };
 Module["thisProgram"] = process["argv"][1];
 Module["arguments"] = process["argv"].slice(2);
 module["exports"] = Module;
} else if (ENVIRONMENT_IS_SHELL) {
 if (!Module["print"]) Module["print"] = print;
 if (typeof printErr != "undefined") Module["printErr"] = printErr;
 if (typeof read != "undefined") {
  Module["read"] = read;
 } else {
  Module["read"] = function read() {
   throw "no read() available (jsc?)";
  };
 }
 Module["readBinary"] = function readBinary(f) {
  return read(f, "binary");
 };
 if (typeof scriptArgs != "undefined") {
  Module["arguments"] = scriptArgs;
 } else if (typeof arguments != "undefined") {
  Module["arguments"] = arguments;
 }
 this["Module"] = Module;
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
 Module["read"] = function read(url) {
  var xhr = new XMLHttpRequest;
  xhr.open("GET", url, false);
  xhr.send(null);
  return xhr.responseText;
 };
 if (typeof arguments != "undefined") {
  Module["arguments"] = arguments;
 }
 if (typeof console !== "undefined") {
  if (!Module["print"]) Module["print"] = function print(x) {
   console.log(x);
  };
  if (!Module["printErr"]) Module["printErr"] = function printErr(x) {
   console.log(x);
  };
 } else {
  var TRY_USE_DUMP = false;
  if (!Module["print"]) Module["print"] = TRY_USE_DUMP && typeof dump !== "undefined" ? (function(x) {
   dump(x);
  }) : (function(x) {});
 }
 if (ENVIRONMENT_IS_WEB) {
  window["Module"] = Module;
 } else {
  Module["load"] = importScripts;
 }
} else {
 throw "Unknown runtime environment. Where are we?";
}
function globalEval(x) {
 eval.call(null, x);
}
if (!Module["load"] == "undefined" && Module["read"]) {
 Module["load"] = function load(f) {
  globalEval(Module["read"](f));
 };
}
if (!Module["print"]) {
 Module["print"] = (function() {});
}
if (!Module["printErr"]) {
 Module["printErr"] = Module["print"];
}
if (!Module["arguments"]) {
 Module["arguments"] = [];
}
Module.print = Module["print"];
Module.printErr = Module["printErr"];
Module["preRun"] = [];
Module["postRun"] = [];
for (var key in moduleOverrides) {
 if (moduleOverrides.hasOwnProperty(key)) {
  Module[key] = moduleOverrides[key];
 }
}
var Runtime = {
 setTempRet0: (function(value) {
  tempRet0 = value;
 }),
 getTempRet0: (function() {
  return tempRet0;
 }),
 stackSave: (function() {
  return STACKTOP;
 }),
 stackRestore: (function(stackTop) {
  STACKTOP = stackTop;
 }),
 forceAlign: (function(target, quantum) {
  quantum = quantum || 4;
  if (quantum == 1) return target;
  if (isNumber(target) && isNumber(quantum)) {
   return Math.ceil(target / quantum) * quantum;
  } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
   return "(((" + target + ")+" + (quantum - 1) + ")&" + -quantum + ")";
  }
  return "Math.ceil((" + target + ")/" + quantum + ")*" + quantum;
 }),
 isNumberType: (function(type) {
  return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
 }),
 isPointerType: function isPointerType(type) {
  return type[type.length - 1] == "*";
 },
 isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?\{ ?[^}]* ?\}>?/.test(type)) return true;
  return type[0] == "%";
 },
 INT_TYPES: {
  "i1": 0,
  "i8": 0,
  "i16": 0,
  "i32": 0,
  "i64": 0
 },
 FLOAT_TYPES: {
  "float": 0,
  "double": 0
 },
 or64: (function(x, y) {
  var l = x | 0 | (y | 0);
  var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
  return l + h;
 }),
 and64: (function(x, y) {
  var l = (x | 0) & (y | 0);
  var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
  return l + h;
 }),
 xor64: (function(x, y) {
  var l = (x | 0) ^ (y | 0);
  var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
  return l + h;
 }),
 getNativeTypeSize: (function(type) {
  switch (type) {
  case "i1":
  case "i8":
   return 1;
  case "i16":
   return 2;
  case "i32":
   return 4;
  case "i64":
   return 8;
  case "float":
   return 4;
  case "double":
   return 8;
  default:
   {
    if (type[type.length - 1] === "*") {
     return Runtime.QUANTUM_SIZE;
    } else if (type[0] === "i") {
     var bits = parseInt(type.substr(1));
     assert(bits % 8 === 0);
     return bits / 8;
    } else {
     return 0;
    }
   }
  }
 }),
 getNativeFieldSize: (function(type) {
  return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
 }),
 dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
   return items.filter((function(item) {
    if (seen[item[ident]]) return false;
    seen[item[ident]] = true;
    return true;
   }));
  } else {
   return items.filter((function(item) {
    if (seen[item]) return false;
    seen[item] = true;
    return true;
   }));
  }
 },
 set: function set() {
  var args = typeof arguments[0] === "object" ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
   ret[args[i]] = 0;
  }
  return ret;
 },
 STACK_ALIGN: 8,
 getAlignSize: (function(type, size, vararg) {
  if (!vararg && (type == "i64" || type == "double")) return 8;
  if (!type) return Math.min(size, 8);
  return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
 }),
 calculateStructAlignment: function calculateStructAlignment(type) {
  type.flatSize = 0;
  type.alignSize = 0;
  var diffs = [];
  var prev = -1;
  var index = 0;
  type.flatIndexes = type.fields.map((function(field) {
   index++;
   var size, alignSize;
   if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
    size = Runtime.getNativeTypeSize(field);
    alignSize = Runtime.getAlignSize(field, size);
   } else if (Runtime.isStructType(field)) {
    if (field[1] === "0") {
     size = 0;
     if (Types.types[field]) {
      alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
     } else {
      alignSize = type.alignSize || QUANTUM_SIZE;
     }
    } else {
     size = Types.types[field].flatSize;
     alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
    }
   } else if (field[0] == "b") {
    size = field.substr(1) | 0;
    alignSize = 1;
   } else if (field[0] === "<") {
    size = alignSize = Types.types[field].flatSize;
   } else if (field[0] === "i") {
    size = alignSize = parseInt(field.substr(1)) / 8;
    assert(size % 1 === 0, "cannot handle non-byte-size field " + field);
   } else {
    assert(false, "invalid type for calculateStructAlignment");
   }
   if (type.packed) alignSize = 1;
   type.alignSize = Math.max(type.alignSize, alignSize);
   var curr = Runtime.alignMemory(type.flatSize, alignSize);
   type.flatSize = curr + size;
   if (prev >= 0) {
    diffs.push(curr - prev);
   }
   prev = curr;
   return curr;
  }));
  if (type.name_ && type.name_[0] === "[") {
   type.flatSize = parseInt(type.name_.substr(1)) * type.flatSize / 2;
  }
  type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
  if (diffs.length == 0) {
   type.flatFactor = type.flatSize;
  } else if (Runtime.dedup(diffs).length == 1) {
   type.flatFactor = diffs[0];
  }
  type.needsFlattening = type.flatFactor != 1;
  return type.flatIndexes;
 },
 generateStructInfo: (function(struct, typeName, offset) {
  var type, alignment;
  if (typeName) {
   offset = offset || 0;
   type = (typeof Types === "undefined" ? Runtime.typeInfo : Types.types)[typeName];
   if (!type) return null;
   if (type.fields.length != struct.length) {
    printErr("Number of named fields must match the type for " + typeName + ": possibly duplicate struct names. Cannot return structInfo");
    return null;
   }
   alignment = type.flatIndexes;
  } else {
   var type = {
    fields: struct.map((function(item) {
     return item[0];
    }))
   };
   alignment = Runtime.calculateStructAlignment(type);
  }
  var ret = {
   __size__: type.flatSize
  };
  if (typeName) {
   struct.forEach((function(item, i) {
    if (typeof item === "string") {
     ret[item] = alignment[i] + offset;
    } else {
     var key;
     for (var k in item) key = k;
     ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
    }
   }));
  } else {
   struct.forEach((function(item, i) {
    ret[item[1]] = alignment[i];
   }));
  }
  return ret;
 }),
 dynCall: (function(sig, ptr, args) {
  if (args && args.length) {
   if (!args.splice) args = Array.prototype.slice.call(args);
   args.splice(0, 0, ptr);
   return Module["dynCall_" + sig].apply(null, args);
  } else {
   return Module["dynCall_" + sig].call(null, ptr);
  }
 }),
 functionPointers: [],
 addFunction: (function(func) {
  for (var i = 0; i < Runtime.functionPointers.length; i++) {
   if (!Runtime.functionPointers[i]) {
    Runtime.functionPointers[i] = func;
    return 2 * (1 + i);
   }
  }
  throw "Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.";
 }),
 removeFunction: (function(index) {
  Runtime.functionPointers[(index - 2) / 2] = null;
 }),
 getAsmConst: (function(code, numArgs) {
  if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
  var func = Runtime.asmConstCache[code];
  if (func) return func;
  var args = [];
  for (var i = 0; i < numArgs; i++) {
   args.push(String.fromCharCode(36) + i);
  }
  var source = Pointer_stringify(code);
  if (source[0] === '"') {
   if (source.indexOf('"', 1) === source.length - 1) {
    source = source.substr(1, source.length - 2);
   } else {
    abort("invalid EM_ASM input |" + source + "|. Please use EM_ASM(..code..) (no quotes) or EM_ASM({ ..code($0).. }, input) (to input values)");
   }
  }
  try {
   var evalled = eval("(function(" + args.join(",") + "){ " + source + " })");
  } catch (e) {
   Module.printErr("error in executing inline EM_ASM code: " + e + " on: \n\n" + source + "\n\nwith args |" + args + "| (make sure to use the right one out of EM_ASM, EM_ASM_ARGS, etc.)");
   throw e;
  }
  return Runtime.asmConstCache[code] = evalled;
 }),
 warnOnce: (function(text) {
  if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
  if (!Runtime.warnOnce.shown[text]) {
   Runtime.warnOnce.shown[text] = 1;
   Module.printErr(text);
  }
 }),
 funcWrappers: {},
 getFuncWrapper: (function(func, sig) {
  assert(sig);
  if (!Runtime.funcWrappers[func]) {
   Runtime.funcWrappers[func] = function dynCall_wrapper() {
    return Runtime.dynCall(sig, func, arguments);
   };
  }
  return Runtime.funcWrappers[func];
 }),
 UTF8Processor: (function() {
  var buffer = [];
  var needed = 0;
  this.processCChar = (function(code) {
   code = code & 255;
   if (buffer.length == 0) {
    if ((code & 128) == 0) {
     return String.fromCharCode(code);
    }
    buffer.push(code);
    if ((code & 224) == 192) {
     needed = 1;
    } else if ((code & 240) == 224) {
     needed = 2;
    } else {
     needed = 3;
    }
    return "";
   }
   if (needed) {
    buffer.push(code);
    needed--;
    if (needed > 0) return "";
   }
   var c1 = buffer[0];
   var c2 = buffer[1];
   var c3 = buffer[2];
   var c4 = buffer[3];
   var ret;
   if (buffer.length == 2) {
    ret = String.fromCharCode((c1 & 31) << 6 | c2 & 63);
   } else if (buffer.length == 3) {
    ret = String.fromCharCode((c1 & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
   } else {
    var codePoint = (c1 & 7) << 18 | (c2 & 63) << 12 | (c3 & 63) << 6 | c4 & 63;
    ret = String.fromCharCode(Math.floor((codePoint - 65536) / 1024) + 55296, (codePoint - 65536) % 1024 + 56320);
   }
   buffer.length = 0;
   return ret;
  });
  this.processJSString = function processJSString(string) {
   string = unescape(encodeURIComponent(string));
   var ret = [];
   for (var i = 0; i < string.length; i++) {
    ret.push(string.charCodeAt(i));
   }
   return ret;
  };
 }),
 getCompilerSetting: (function(name) {
  throw "You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work";
 }),
 stackAlloc: (function(size) {
  var ret = STACKTOP;
  STACKTOP = STACKTOP + size | 0;
  STACKTOP = STACKTOP + 7 & -8;
  return ret;
 }),
 staticAlloc: (function(size) {
  var ret = STATICTOP;
  STATICTOP = STATICTOP + size | 0;
  STATICTOP = STATICTOP + 7 & -8;
  return ret;
 }),
 dynamicAlloc: (function(size) {
  var ret = DYNAMICTOP;
  DYNAMICTOP = DYNAMICTOP + size | 0;
  DYNAMICTOP = DYNAMICTOP + 7 & -8;
  if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();
  return ret;
 }),
 alignMemory: (function(size, quantum) {
  var ret = size = Math.ceil(size / (quantum ? quantum : 8)) * (quantum ? quantum : 8);
  return ret;
 }),
 makeBigInt: (function(low, high, unsigned) {
  var ret = unsigned ? +(low >>> 0) + +(high >>> 0) * +4294967296 : +(low >>> 0) + +(high | 0) * +4294967296;
  return ret;
 }),
 GLOBAL_BASE: 8,
 QUANTUM_SIZE: 4,
 __dummy__: 0
};
Module["Runtime"] = Runtime;
var __THREW__ = 0;
var ABORT = false;
var EXITSTATUS = 0;
var undef = 0;
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function assert(condition, text) {
 if (!condition) {
  abort("Assertion failed: " + text);
 }
}
var globalScope = this;
function getCFunc(ident) {
 var func = Module["_" + ident];
 if (!func) {
  try {
   func = eval("_" + ident);
  } catch (e) {}
 }
 assert(func, "Cannot call unknown function " + ident + " (perhaps LLVM optimizations or closure removed it?)");
 return func;
}
var cwrap, ccall;
((function() {
 var stack = 0;
 var JSfuncs = {
  "stackSave": (function() {
   stack = Runtime.stackSave();
  }),
  "stackRestore": (function() {
   Runtime.stackRestore(stack);
  }),
  "arrayToC": (function(arr) {
   var ret = Runtime.stackAlloc(arr.length);
   writeArrayToMemory(arr, ret);
   return ret;
  }),
  "stringToC": (function(str) {
   var ret = 0;
   if (str !== null && str !== undefined && str !== 0) {
    ret = Runtime.stackAlloc(str.length + 1);
    writeStringToMemory(str, ret);
   }
   return ret;
  })
 };
 var toC = {
  "string": JSfuncs["stringToC"],
  "array": JSfuncs["arrayToC"]
 };
 ccall = function ccallFunc(ident, returnType, argTypes, args) {
  var func = getCFunc(ident);
  var cArgs = [];
  if (args) {
   for (var i = 0; i < args.length; i++) {
    var converter = toC[argTypes[i]];
    if (converter) {
     if (stack === 0) stack = Runtime.stackSave();
     cArgs[i] = converter(args[i]);
    } else {
     cArgs[i] = args[i];
    }
   }
  }
  var ret = func.apply(null, cArgs);
  if (returnType === "string") ret = Pointer_stringify(ret);
  if (stack !== 0) JSfuncs["stackRestore"]();
  return ret;
 };
 var sourceRegex = /^function\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/;
 function parseJSFunc(jsfunc) {
  var parsed = jsfunc.toString().match(sourceRegex).slice(1);
  return {
   arguments: parsed[0],
   body: parsed[1],
   returnValue: parsed[2]
  };
 }
 var JSsource = {};
 for (var fun in JSfuncs) {
  if (JSfuncs.hasOwnProperty(fun)) {
   JSsource[fun] = parseJSFunc(JSfuncs[fun]);
  }
 }
 cwrap = function cwrap(ident, returnType, argTypes) {
  var cfunc = getCFunc(ident);
  var numericArgs = argTypes.every((function(type) {
   return type === "number";
  }));
  var numericRet = returnType !== "string";
  if (numericRet && numericArgs) {
   return cfunc;
  }
  var argNames = argTypes.map((function(x, i) {
   return "$" + i;
  }));
  var funcstr = "(function(" + argNames.join(",") + ") {";
  var nargs = argTypes.length;
  if (!numericArgs) {
   funcstr += JSsource["stackSave"].body + ";";
   for (var i = 0; i < nargs; i++) {
    var arg = argNames[i], type = argTypes[i];
    if (type === "number") continue;
    var convertCode = JSsource[type + "ToC"];
    funcstr += "var " + convertCode.arguments + " = " + arg + ";";
    funcstr += convertCode.body + ";";
    funcstr += arg + "=" + convertCode.returnValue + ";";
   }
  }
  var cfuncname = parseJSFunc((function() {
   return cfunc;
  })).returnValue;
  funcstr += "var ret = " + cfuncname + "(" + argNames.join(",") + ");";
  if (!numericRet) {
   var strgfy = parseJSFunc((function() {
    return Pointer_stringify;
   })).returnValue;
   funcstr += "ret = " + strgfy + "(ret);";
  }
  if (!numericArgs) {
   funcstr += JSsource["stackRestore"].body + ";";
  }
  funcstr += "return ret})";
  return eval(funcstr);
 };
}))();
Module["cwrap"] = cwrap;
Module["ccall"] = ccall;
function setValue(ptr, value, type, noSafe) {
 type = type || "i8";
 if (type.charAt(type.length - 1) === "*") type = "i32";
 switch (type) {
 case "i1":
  HEAP8[ptr >> 0] = value;
  break;
 case "i8":
  HEAP8[ptr >> 0] = value;
  break;
 case "i16":
  HEAP16[ptr >> 1] = value;
  break;
 case "i32":
  HEAP32[ptr >> 2] = value;
  break;
 case "i64":
  tempI64 = [ value >>> 0, (tempDouble = value, +Math_abs(tempDouble) >= +1 ? tempDouble > +0 ? (Math_min(+Math_floor(tempDouble / +4294967296), +4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / +4294967296) >>> 0 : 0) ], HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
  break;
 case "float":
  HEAPF32[ptr >> 2] = value;
  break;
 case "double":
  HEAPF64[ptr >> 3] = value;
  break;
 default:
  abort("invalid type for setValue: " + type);
 }
}
Module["setValue"] = setValue;
function getValue(ptr, type, noSafe) {
 type = type || "i8";
 if (type.charAt(type.length - 1) === "*") type = "i32";
 switch (type) {
 case "i1":
  return HEAP8[ptr >> 0];
 case "i8":
  return HEAP8[ptr >> 0];
 case "i16":
  return HEAP16[ptr >> 1];
 case "i32":
  return HEAP32[ptr >> 2];
 case "i64":
  return HEAP32[ptr >> 2];
 case "float":
  return HEAPF32[ptr >> 2];
 case "double":
  return HEAPF64[ptr >> 3];
 default:
  abort("invalid type for setValue: " + type);
 }
 return null;
}
Module["getValue"] = getValue;
var ALLOC_NORMAL = 0;
var ALLOC_STACK = 1;
var ALLOC_STATIC = 2;
var ALLOC_DYNAMIC = 3;
var ALLOC_NONE = 4;
Module["ALLOC_NORMAL"] = ALLOC_NORMAL;
Module["ALLOC_STACK"] = ALLOC_STACK;
Module["ALLOC_STATIC"] = ALLOC_STATIC;
Module["ALLOC_DYNAMIC"] = ALLOC_DYNAMIC;
Module["ALLOC_NONE"] = ALLOC_NONE;
function allocate(slab, types, allocator, ptr) {
 var zeroinit, size;
 if (typeof slab === "number") {
  zeroinit = true;
  size = slab;
 } else {
  zeroinit = false;
  size = slab.length;
 }
 var singleType = typeof types === "string" ? types : null;
 var ret;
 if (allocator == ALLOC_NONE) {
  ret = ptr;
 } else {
  ret = [ _malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc ][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
 }
 if (zeroinit) {
  var ptr = ret, stop;
  assert((ret & 3) == 0);
  stop = ret + (size & ~3);
  for (; ptr < stop; ptr += 4) {
   HEAP32[ptr >> 2] = 0;
  }
  stop = ret + size;
  while (ptr < stop) {
   HEAP8[ptr++ >> 0] = 0;
  }
  return ret;
 }
 if (singleType === "i8") {
  if (slab.subarray || slab.slice) {
   HEAPU8.set(slab, ret);
  } else {
   HEAPU8.set(new Uint8Array(slab), ret);
  }
  return ret;
 }
 var i = 0, type, typeSize, previousType;
 while (i < size) {
  var curr = slab[i];
  if (typeof curr === "function") {
   curr = Runtime.getFunctionIndex(curr);
  }
  type = singleType || types[i];
  if (type === 0) {
   i++;
   continue;
  }
  if (type == "i64") type = "i32";
  setValue(ret + i, curr, type);
  if (previousType !== type) {
   typeSize = Runtime.getNativeTypeSize(type);
   previousType = type;
  }
  i += typeSize;
 }
 return ret;
}
Module["allocate"] = allocate;
function Pointer_stringify(ptr, length) {
 var hasUtf = false;
 var t;
 var i = 0;
 while (1) {
  t = HEAPU8[ptr + i >> 0];
  if (t >= 128) hasUtf = true; else if (t == 0 && !length) break;
  i++;
  if (length && i == length) break;
 }
 if (!length) length = i;
 var ret = "";
 if (!hasUtf) {
  var MAX_CHUNK = 1024;
  var curr;
  while (length > 0) {
   curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
   ret = ret ? ret + curr : curr;
   ptr += MAX_CHUNK;
   length -= MAX_CHUNK;
  }
  return ret;
 }
 var utf8 = new Runtime.UTF8Processor;
 for (i = 0; i < length; i++) {
  t = HEAPU8[ptr + i >> 0];
  ret += utf8.processCChar(t);
 }
 return ret;
}
Module["Pointer_stringify"] = Pointer_stringify;
function UTF16ToString(ptr) {
 var i = 0;
 var str = "";
 while (1) {
  var codeUnit = HEAP16[ptr + i * 2 >> 1];
  if (codeUnit == 0) return str;
  ++i;
  str += String.fromCharCode(codeUnit);
 }
}
Module["UTF16ToString"] = UTF16ToString;
function stringToUTF16(str, outPtr) {
 for (var i = 0; i < str.length; ++i) {
  var codeUnit = str.charCodeAt(i);
  HEAP16[outPtr + i * 2 >> 1] = codeUnit;
 }
 HEAP16[outPtr + str.length * 2 >> 1] = 0;
}
Module["stringToUTF16"] = stringToUTF16;
function UTF32ToString(ptr) {
 var i = 0;
 var str = "";
 while (1) {
  var utf32 = HEAP32[ptr + i * 4 >> 2];
  if (utf32 == 0) return str;
  ++i;
  if (utf32 >= 65536) {
   var ch = utf32 - 65536;
   str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
  } else {
   str += String.fromCharCode(utf32);
  }
 }
}
Module["UTF32ToString"] = UTF32ToString;
function stringToUTF32(str, outPtr) {
 var iChar = 0;
 for (var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
  var codeUnit = str.charCodeAt(iCodeUnit);
  if (codeUnit >= 55296 && codeUnit <= 57343) {
   var trailSurrogate = str.charCodeAt(++iCodeUnit);
   codeUnit = 65536 + ((codeUnit & 1023) << 10) | trailSurrogate & 1023;
  }
  HEAP32[outPtr + iChar * 4 >> 2] = codeUnit;
  ++iChar;
 }
 HEAP32[outPtr + iChar * 4 >> 2] = 0;
}
Module["stringToUTF32"] = stringToUTF32;
function demangle(func) {
 var i = 3;
 var basicTypes = {
  "v": "void",
  "b": "bool",
  "c": "char",
  "s": "short",
  "i": "int",
  "l": "long",
  "f": "float",
  "d": "double",
  "w": "wchar_t",
  "a": "signed char",
  "h": "unsigned char",
  "t": "unsigned short",
  "j": "unsigned int",
  "m": "unsigned long",
  "x": "long long",
  "y": "unsigned long long",
  "z": "..."
 };
 var subs = [];
 var first = true;
 function dump(x) {
  if (x) Module.print(x);
  Module.print(func);
  var pre = "";
  for (var a = 0; a < i; a++) pre += " ";
  Module.print(pre + "^");
 }
 function parseNested() {
  i++;
  if (func[i] === "K") i++;
  var parts = [];
  while (func[i] !== "E") {
   if (func[i] === "S") {
    i++;
    var next = func.indexOf("_", i);
    var num = func.substring(i, next) || 0;
    parts.push(subs[num] || "?");
    i = next + 1;
    continue;
   }
   if (func[i] === "C") {
    parts.push(parts[parts.length - 1]);
    i += 2;
    continue;
   }
   var size = parseInt(func.substr(i));
   var pre = size.toString().length;
   if (!size || !pre) {
    i--;
    break;
   }
   var curr = func.substr(i + pre, size);
   parts.push(curr);
   subs.push(curr);
   i += pre + size;
  }
  i++;
  return parts;
 }
 function parse(rawList, limit, allowVoid) {
  limit = limit || Infinity;
  var ret = "", list = [];
  function flushList() {
   return "(" + list.join(", ") + ")";
  }
  var name;
  if (func[i] === "N") {
   name = parseNested().join("::");
   limit--;
   if (limit === 0) return rawList ? [ name ] : name;
  } else {
   if (func[i] === "K" || first && func[i] === "L") i++;
   var size = parseInt(func.substr(i));
   if (size) {
    var pre = size.toString().length;
    name = func.substr(i + pre, size);
    i += pre + size;
   }
  }
  first = false;
  if (func[i] === "I") {
   i++;
   var iList = parse(true);
   var iRet = parse(true, 1, true);
   ret += iRet[0] + " " + name + "<" + iList.join(", ") + ">";
  } else {
   ret = name;
  }
  paramLoop : while (i < func.length && limit-- > 0) {
   var c = func[i++];
   if (c in basicTypes) {
    list.push(basicTypes[c]);
   } else {
    switch (c) {
    case "P":
     list.push(parse(true, 1, true)[0] + "*");
     break;
    case "R":
     list.push(parse(true, 1, true)[0] + "&");
     break;
    case "L":
     {
      i++;
      var end = func.indexOf("E", i);
      var size = end - i;
      list.push(func.substr(i, size));
      i += size + 2;
      break;
     }
    case "A":
     {
      var size = parseInt(func.substr(i));
      i += size.toString().length;
      if (func[i] !== "_") throw "?";
      i++;
      list.push(parse(true, 1, true)[0] + " [" + size + "]");
      break;
     }
    case "E":
     break paramLoop;
    default:
     ret += "?" + c;
     break paramLoop;
    }
   }
  }
  if (!allowVoid && list.length === 1 && list[0] === "void") list = [];
  if (rawList) {
   if (ret) {
    list.push(ret + "?");
   }
   return list;
  } else {
   return ret + flushList();
  }
 }
 try {
  if (func == "Object._main" || func == "_main") {
   return "main()";
  }
  if (typeof func === "number") func = Pointer_stringify(func);
  if (func[0] !== "_") return func;
  if (func[1] !== "_") return func;
  if (func[2] !== "Z") return func;
  switch (func[3]) {
  case "n":
   return "operator new()";
  case "d":
   return "operator delete()";
  }
  return parse();
 } catch (e) {
  return func;
 }
}
function demangleAll(text) {
 return text.replace(/__Z[\w\d_]+/g, (function(x) {
  var y = demangle(x);
  return x === y ? x : x + " [" + y + "]";
 }));
}
function stackTrace() {
 var stack = (new Error).stack;
 return stack ? demangleAll(stack) : "(no stack trace available)";
}
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
 return x + 4095 & -4096;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false;
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0;
var DYNAMIC_BASE = 0, DYNAMICTOP = 0;
function enlargeMemory() {
 abort("Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value " + TOTAL_MEMORY + ", (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.");
}
var TOTAL_STACK = Module["TOTAL_STACK"] || 5242880;
var TOTAL_MEMORY = Module["TOTAL_MEMORY"] || 16777216;
var FAST_MEMORY = Module["FAST_MEMORY"] || 2097152;
var totalMemory = 4096;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2 * TOTAL_STACK) {
 if (totalMemory < 16 * 1024 * 1024) {
  totalMemory *= 2;
 } else {
  totalMemory += 16 * 1024 * 1024;
 }
}
if (totalMemory !== TOTAL_MEMORY) {
 Module.printErr("increasing TOTAL_MEMORY to " + totalMemory + " to be more reasonable");
 TOTAL_MEMORY = totalMemory;
}
assert(typeof Int32Array !== "undefined" && typeof Float64Array !== "undefined" && !!(new Int32Array(1))["subarray"] && !!(new Int32Array(1))["set"], "JS engine does not provide full typed array support");
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, "Typed arrays 2 must be run on a little-endian system");
Module["HEAP"] = HEAP;
Module["HEAP8"] = HEAP8;
Module["HEAP16"] = HEAP16;
Module["HEAP32"] = HEAP32;
Module["HEAPU8"] = HEAPU8;
Module["HEAPU16"] = HEAPU16;
Module["HEAPU32"] = HEAPU32;
Module["HEAPF32"] = HEAPF32;
Module["HEAPF64"] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
 while (callbacks.length > 0) {
  var callback = callbacks.shift();
  if (typeof callback == "function") {
   callback();
   continue;
  }
  var func = callback.func;
  if (typeof func === "number") {
   if (callback.arg === undefined) {
    Runtime.dynCall("v", func);
   } else {
    Runtime.dynCall("vi", func, [ callback.arg ]);
   }
  } else {
   func(callback.arg === undefined ? null : callback.arg);
  }
 }
}
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATEXIT__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
var runtimeExited = false;
function preRun() {
 if (Module["preRun"]) {
  if (typeof Module["preRun"] == "function") Module["preRun"] = [ Module["preRun"] ];
  while (Module["preRun"].length) {
   addOnPreRun(Module["preRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
 if (runtimeInitialized) return;
 runtimeInitialized = true;
 callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
 callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
 callRuntimeCallbacks(__ATEXIT__);
 runtimeExited = true;
}
function postRun() {
 if (Module["postRun"]) {
  if (typeof Module["postRun"] == "function") Module["postRun"] = [ Module["postRun"] ];
  while (Module["postRun"].length) {
   addOnPostRun(Module["postRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
 __ATPRERUN__.unshift(cb);
}
Module["addOnPreRun"] = Module.addOnPreRun = addOnPreRun;
function addOnInit(cb) {
 __ATINIT__.unshift(cb);
}
Module["addOnInit"] = Module.addOnInit = addOnInit;
function addOnPreMain(cb) {
 __ATMAIN__.unshift(cb);
}
Module["addOnPreMain"] = Module.addOnPreMain = addOnPreMain;
function addOnExit(cb) {
 __ATEXIT__.unshift(cb);
}
Module["addOnExit"] = Module.addOnExit = addOnExit;
function addOnPostRun(cb) {
 __ATPOSTRUN__.unshift(cb);
}
Module["addOnPostRun"] = Module.addOnPostRun = addOnPostRun;
function intArrayFromString(stringy, dontAddNull, length) {
 var ret = (new Runtime.UTF8Processor).processJSString(stringy);
 if (length) {
  ret.length = length;
 }
 if (!dontAddNull) {
  ret.push(0);
 }
 return ret;
}
Module["intArrayFromString"] = intArrayFromString;
function intArrayToString(array) {
 var ret = [];
 for (var i = 0; i < array.length; i++) {
  var chr = array[i];
  if (chr > 255) {
   chr &= 255;
  }
  ret.push(String.fromCharCode(chr));
 }
 return ret.join("");
}
Module["intArrayToString"] = intArrayToString;
function writeStringToMemory(string, buffer, dontAddNull) {
 var array = intArrayFromString(string, dontAddNull);
 var i = 0;
 while (i < array.length) {
  var chr = array[i];
  HEAP8[buffer + i >> 0] = chr;
  i = i + 1;
 }
}
Module["writeStringToMemory"] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
 for (var i = 0; i < array.length; i++) {
  HEAP8[buffer + i >> 0] = array[i];
 }
}
Module["writeArrayToMemory"] = writeArrayToMemory;
function writeAsciiToMemory(str, buffer, dontAddNull) {
 for (var i = 0; i < str.length; i++) {
  HEAP8[buffer + i >> 0] = str.charCodeAt(i);
 }
 if (!dontAddNull) HEAP8[buffer + str.length >> 0] = 0;
}
Module["writeAsciiToMemory"] = writeAsciiToMemory;
function unSign(value, bits, ignore) {
 if (value >= 0) {
  return value;
 }
 return bits <= 32 ? 2 * Math.abs(1 << bits - 1) + value : Math.pow(2, bits) + value;
}
function reSign(value, bits, ignore) {
 if (value <= 0) {
  return value;
 }
 var half = bits <= 32 ? Math.abs(1 << bits - 1) : Math.pow(2, bits - 1);
 if (value >= half && (bits <= 32 || value > half)) {
  value = -2 * half + value;
 }
 return value;
}
if (!Math["imul"] || Math["imul"](4294967295, 5) !== -5) Math["imul"] = function imul(a, b) {
 var ah = a >>> 16;
 var al = a & 65535;
 var bh = b >>> 16;
 var bl = b & 65535;
 return al * bl + (ah * bl + al * bh << 16) | 0;
};
Math.imul = Math["imul"];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;
function addRunDependency(id) {
 runDependencies++;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
}
Module["addRunDependency"] = addRunDependency;
function removeRunDependency(id) {
 runDependencies--;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
 if (runDependencies == 0) {
  if (runDependencyWatcher !== null) {
   clearInterval(runDependencyWatcher);
   runDependencyWatcher = null;
  }
  if (dependenciesFulfilled) {
   var callback = dependenciesFulfilled;
   dependenciesFulfilled = null;
   callback();
  }
 }
}
Module["removeRunDependency"] = removeRunDependency;
Module["preloadedImages"] = {};
Module["preloadedAudios"] = {};
var memoryInitializer = null;
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + Runtime.alignMemory(6027);
__ATINIT__.push();
var memoryInitializer = "aaWebCam.js.mem";
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) {
 HEAP8[tempDoublePtr] = HEAP8[ptr];
 HEAP8[tempDoublePtr + 1] = HEAP8[ptr + 1];
 HEAP8[tempDoublePtr + 2] = HEAP8[ptr + 2];
 HEAP8[tempDoublePtr + 3] = HEAP8[ptr + 3];
}
function copyTempDouble(ptr) {
 HEAP8[tempDoublePtr] = HEAP8[ptr];
 HEAP8[tempDoublePtr + 1] = HEAP8[ptr + 1];
 HEAP8[tempDoublePtr + 2] = HEAP8[ptr + 2];
 HEAP8[tempDoublePtr + 3] = HEAP8[ptr + 3];
 HEAP8[tempDoublePtr + 4] = HEAP8[ptr + 4];
 HEAP8[tempDoublePtr + 5] = HEAP8[ptr + 5];
 HEAP8[tempDoublePtr + 6] = HEAP8[ptr + 6];
 HEAP8[tempDoublePtr + 7] = HEAP8[ptr + 7];
}
var aaweb = {
 canvas_node: null,
 ctx: null,
 cols: 160,
 rows: 50,
 x: 0,
 y: 0,
 attr: 0,
 font: "Source Code Pro",
 font_size: 6,
 font_str: "",
 bold_font_str: "",
 fg_color: "#fff",
 bg_color: "#000",
 dim_color: "#777",
 MASK_NORMAL: 1,
 MASK_DIM: 2,
 MASK_BOLD: 4,
 MASK_BOLDFONT: 8,
 MASK_REVERSE: 16
};
function _aaweb_init() {
 var font_test_node = document.getElementById("aa-font-test");
 font_test_node.style.font = aaweb.font_size + 'px "' + aaweb.font + '"';
 font_test_node.innerHTML = "m";
 var devicePixelRatio = window.devicePixelRatio;
 aaweb.char_height = Math.max(1, font_test_node.clientHeight * devicePixelRatio);
 aaweb.char_width = Math.max(1, font_test_node.clientWidth * devicePixelRatio);
 var canvas_node = aaweb.canvas_node = document.getElementById("aa-canvas");
 canvas_node.width = aaweb.cols * aaweb.char_width;
 canvas_node.height = aaweb.rows * aaweb.char_height;
 canvas_node.style.width = canvas_node.width / devicePixelRatio + canvas_node.offsetWidth - canvas_node.clientWidth + "px";
 canvas_node.style.height = canvas_node.height / devicePixelRatio + canvas_node.offsetHeight - canvas_node.clientHeight + "px";
 var ctx = aaweb.ctx = canvas_node.getContext("2d");
 aaweb.font_str = aaweb.font_size * devicePixelRatio + 'px "' + aaweb.font + '"';
 aaweb.bold_font_str = "bold " + aaweb.font_str;
 ctx.textBaseline = "bottom";
}
var ___errno_state = 0;
function ___setErrNo(value) {
 HEAP32[___errno_state >> 2] = value;
 return value;
}
var ERRNO_CODES = {
 EPERM: 1,
 ENOENT: 2,
 ESRCH: 3,
 EINTR: 4,
 EIO: 5,
 ENXIO: 6,
 E2BIG: 7,
 ENOEXEC: 8,
 EBADF: 9,
 ECHILD: 10,
 EAGAIN: 11,
 EWOULDBLOCK: 11,
 ENOMEM: 12,
 EACCES: 13,
 EFAULT: 14,
 ENOTBLK: 15,
 EBUSY: 16,
 EEXIST: 17,
 EXDEV: 18,
 ENODEV: 19,
 ENOTDIR: 20,
 EISDIR: 21,
 EINVAL: 22,
 ENFILE: 23,
 EMFILE: 24,
 ENOTTY: 25,
 ETXTBSY: 26,
 EFBIG: 27,
 ENOSPC: 28,
 ESPIPE: 29,
 EROFS: 30,
 EMLINK: 31,
 EPIPE: 32,
 EDOM: 33,
 ERANGE: 34,
 ENOMSG: 42,
 EIDRM: 43,
 ECHRNG: 44,
 EL2NSYNC: 45,
 EL3HLT: 46,
 EL3RST: 47,
 ELNRNG: 48,
 EUNATCH: 49,
 ENOCSI: 50,
 EL2HLT: 51,
 EDEADLK: 35,
 ENOLCK: 37,
 EBADE: 52,
 EBADR: 53,
 EXFULL: 54,
 ENOANO: 55,
 EBADRQC: 56,
 EBADSLT: 57,
 EDEADLOCK: 35,
 EBFONT: 59,
 ENOSTR: 60,
 ENODATA: 61,
 ETIME: 62,
 ENOSR: 63,
 ENONET: 64,
 ENOPKG: 65,
 EREMOTE: 66,
 ENOLINK: 67,
 EADV: 68,
 ESRMNT: 69,
 ECOMM: 70,
 EPROTO: 71,
 EMULTIHOP: 72,
 EDOTDOT: 73,
 EBADMSG: 74,
 ENOTUNIQ: 76,
 EBADFD: 77,
 EREMCHG: 78,
 ELIBACC: 79,
 ELIBBAD: 80,
 ELIBSCN: 81,
 ELIBMAX: 82,
 ELIBEXEC: 83,
 ENOSYS: 38,
 ENOTEMPTY: 39,
 ENAMETOOLONG: 36,
 ELOOP: 40,
 EOPNOTSUPP: 95,
 EPFNOSUPPORT: 96,
 ECONNRESET: 104,
 ENOBUFS: 105,
 EAFNOSUPPORT: 97,
 EPROTOTYPE: 91,
 ENOTSOCK: 88,
 ENOPROTOOPT: 92,
 ESHUTDOWN: 108,
 ECONNREFUSED: 111,
 EADDRINUSE: 98,
 ECONNABORTED: 103,
 ENETUNREACH: 101,
 ENETDOWN: 100,
 ETIMEDOUT: 110,
 EHOSTDOWN: 112,
 EHOSTUNREACH: 113,
 EINPROGRESS: 115,
 EALREADY: 114,
 EDESTADDRREQ: 89,
 EMSGSIZE: 90,
 EPROTONOSUPPORT: 93,
 ESOCKTNOSUPPORT: 94,
 EADDRNOTAVAIL: 99,
 ENETRESET: 102,
 EISCONN: 106,
 ENOTCONN: 107,
 ETOOMANYREFS: 109,
 EUSERS: 87,
 EDQUOT: 122,
 ESTALE: 116,
 ENOTSUP: 95,
 ENOMEDIUM: 123,
 EILSEQ: 84,
 EOVERFLOW: 75,
 ECANCELED: 125,
 ENOTRECOVERABLE: 131,
 EOWNERDEAD: 130,
 ESTRPIPE: 86
};
function _sysconf(name) {
 switch (name) {
 case 30:
  return PAGE_SIZE;
 case 132:
 case 133:
 case 12:
 case 137:
 case 138:
 case 15:
 case 235:
 case 16:
 case 17:
 case 18:
 case 19:
 case 20:
 case 149:
 case 13:
 case 10:
 case 236:
 case 153:
 case 9:
 case 21:
 case 22:
 case 159:
 case 154:
 case 14:
 case 77:
 case 78:
 case 139:
 case 80:
 case 81:
 case 79:
 case 82:
 case 68:
 case 67:
 case 164:
 case 11:
 case 29:
 case 47:
 case 48:
 case 95:
 case 52:
 case 51:
 case 46:
  return 200809;
 case 27:
 case 246:
 case 127:
 case 128:
 case 23:
 case 24:
 case 160:
 case 161:
 case 181:
 case 182:
 case 242:
 case 183:
 case 184:
 case 243:
 case 244:
 case 245:
 case 165:
 case 178:
 case 179:
 case 49:
 case 50:
 case 168:
 case 169:
 case 175:
 case 170:
 case 171:
 case 172:
 case 97:
 case 76:
 case 32:
 case 173:
 case 35:
  return -1;
 case 176:
 case 177:
 case 7:
 case 155:
 case 8:
 case 157:
 case 125:
 case 126:
 case 92:
 case 93:
 case 129:
 case 130:
 case 131:
 case 94:
 case 91:
  return 1;
 case 74:
 case 60:
 case 69:
 case 70:
 case 4:
  return 1024;
 case 31:
 case 42:
 case 72:
  return 32;
 case 87:
 case 26:
 case 33:
  return 2147483647;
 case 34:
 case 1:
  return 47839;
 case 38:
 case 36:
  return 99;
 case 43:
 case 37:
  return 2048;
 case 0:
  return 2097152;
 case 3:
  return 65536;
 case 28:
  return 32768;
 case 44:
  return 32767;
 case 75:
  return 16384;
 case 39:
  return 1e3;
 case 89:
  return 700;
 case 71:
  return 256;
 case 40:
  return 255;
 case 2:
  return 100;
 case 180:
  return 64;
 case 25:
  return 20;
 case 5:
  return 16;
 case 6:
  return 6;
 case 73:
  return 4;
 case 84:
  {
   if (typeof navigator === "object") return navigator["hardwareConcurrency"] || 1;
   return 1;
  }
 }
 ___setErrNo(ERRNO_CODES.EINVAL);
 return -1;
}
function _aaweb_gotoxy(x, y) {
 aaweb.x = x;
 aaweb.y = y;
}
Module["_memset"] = _memset;
function _abort() {
 Module["abort"]();
}
var ERRNO_MESSAGES = {
 0: "Success",
 1: "Not super-user",
 2: "No such file or directory",
 3: "No such process",
 4: "Interrupted system call",
 5: "I/O error",
 6: "No such device or address",
 7: "Arg list too long",
 8: "Exec format error",
 9: "Bad file number",
 10: "No children",
 11: "No more processes",
 12: "Not enough core",
 13: "Permission denied",
 14: "Bad address",
 15: "Block device required",
 16: "Mount device busy",
 17: "File exists",
 18: "Cross-device link",
 19: "No such device",
 20: "Not a directory",
 21: "Is a directory",
 22: "Invalid argument",
 23: "Too many open files in system",
 24: "Too many open files",
 25: "Not a typewriter",
 26: "Text file busy",
 27: "File too large",
 28: "No space left on device",
 29: "Illegal seek",
 30: "Read only file system",
 31: "Too many links",
 32: "Broken pipe",
 33: "Math arg out of domain of func",
 34: "Math result not representable",
 35: "File locking deadlock error",
 36: "File or path name too long",
 37: "No record locks available",
 38: "Function not implemented",
 39: "Directory not empty",
 40: "Too many symbolic links",
 42: "No message of desired type",
 43: "Identifier removed",
 44: "Channel number out of range",
 45: "Level 2 not synchronized",
 46: "Level 3 halted",
 47: "Level 3 reset",
 48: "Link number out of range",
 49: "Protocol driver not attached",
 50: "No CSI structure available",
 51: "Level 2 halted",
 52: "Invalid exchange",
 53: "Invalid request descriptor",
 54: "Exchange full",
 55: "No anode",
 56: "Invalid request code",
 57: "Invalid slot",
 59: "Bad font file fmt",
 60: "Device not a stream",
 61: "No data (for no delay io)",
 62: "Timer expired",
 63: "Out of streams resources",
 64: "Machine is not on the network",
 65: "Package not installed",
 66: "The object is remote",
 67: "The link has been severed",
 68: "Advertise error",
 69: "Srmount error",
 70: "Communication error on send",
 71: "Protocol error",
 72: "Multihop attempted",
 73: "Cross mount point (not really error)",
 74: "Trying to read unreadable message",
 75: "Value too large for defined data type",
 76: "Given log. name not unique",
 77: "f.d. invalid for this operation",
 78: "Remote address changed",
 79: "Can   access a needed shared lib",
 80: "Accessing a corrupted shared lib",
 81: ".lib section in a.out corrupted",
 82: "Attempting to link in too many libs",
 83: "Attempting to exec a shared library",
 84: "Illegal byte sequence",
 86: "Streams pipe error",
 87: "Too many users",
 88: "Socket operation on non-socket",
 89: "Destination address required",
 90: "Message too long",
 91: "Protocol wrong type for socket",
 92: "Protocol not available",
 93: "Unknown protocol",
 94: "Socket type not supported",
 95: "Not supported",
 96: "Protocol family not supported",
 97: "Address family not supported by protocol family",
 98: "Address already in use",
 99: "Address not available",
 100: "Network interface is not configured",
 101: "Network is unreachable",
 102: "Connection reset by network",
 103: "Connection aborted",
 104: "Connection reset by peer",
 105: "No buffer space available",
 106: "Socket is already connected",
 107: "Socket is not connected",
 108: "Can't send after socket shutdown",
 109: "Too many references",
 110: "Connection timed out",
 111: "Connection refused",
 112: "Host is down",
 113: "Host is unreachable",
 114: "Socket already connected",
 115: "Connection already in progress",
 116: "Stale file handle",
 122: "Quota exceeded",
 123: "No medium (in tape drive)",
 125: "Operation canceled",
 130: "Previous owner died",
 131: "State not recoverable"
};
var PATH = {
 splitPath: (function(filename) {
  var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
  return splitPathRe.exec(filename).slice(1);
 }),
 normalizeArray: (function(parts, allowAboveRoot) {
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
   var last = parts[i];
   if (last === ".") {
    parts.splice(i, 1);
   } else if (last === "..") {
    parts.splice(i, 1);
    up++;
   } else if (up) {
    parts.splice(i, 1);
    up--;
   }
  }
  if (allowAboveRoot) {
   for (; up--; up) {
    parts.unshift("..");
   }
  }
  return parts;
 }),
 normalize: (function(path) {
  var isAbsolute = path.charAt(0) === "/", trailingSlash = path.substr(-1) === "/";
  path = PATH.normalizeArray(path.split("/").filter((function(p) {
   return !!p;
  })), !isAbsolute).join("/");
  if (!path && !isAbsolute) {
   path = ".";
  }
  if (path && trailingSlash) {
   path += "/";
  }
  return (isAbsolute ? "/" : "") + path;
 }),
 dirname: (function(path) {
  var result = PATH.splitPath(path), root = result[0], dir = result[1];
  if (!root && !dir) {
   return ".";
  }
  if (dir) {
   dir = dir.substr(0, dir.length - 1);
  }
  return root + dir;
 }),
 basename: (function(path) {
  if (path === "/") return "/";
  var lastSlash = path.lastIndexOf("/");
  if (lastSlash === -1) return path;
  return path.substr(lastSlash + 1);
 }),
 extname: (function(path) {
  return PATH.splitPath(path)[3];
 }),
 join: (function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return PATH.normalize(paths.join("/"));
 }),
 join2: (function(l, r) {
  return PATH.normalize(l + "/" + r);
 }),
 resolve: (function() {
  var resolvedPath = "", resolvedAbsolute = false;
  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
   var path = i >= 0 ? arguments[i] : FS.cwd();
   if (typeof path !== "string") {
    throw new TypeError("Arguments to path.resolve must be strings");
   } else if (!path) {
    continue;
   }
   resolvedPath = path + "/" + resolvedPath;
   resolvedAbsolute = path.charAt(0) === "/";
  }
  resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter((function(p) {
   return !!p;
  })), !resolvedAbsolute).join("/");
  return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
 }),
 relative: (function(from, to) {
  from = PATH.resolve(from).substr(1);
  to = PATH.resolve(to).substr(1);
  function trim(arr) {
   var start = 0;
   for (; start < arr.length; start++) {
    if (arr[start] !== "") break;
   }
   var end = arr.length - 1;
   for (; end >= 0; end--) {
    if (arr[end] !== "") break;
   }
   if (start > end) return [];
   return arr.slice(start, end - start + 1);
  }
  var fromParts = trim(from.split("/"));
  var toParts = trim(to.split("/"));
  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
   if (fromParts[i] !== toParts[i]) {
    samePartsLength = i;
    break;
   }
  }
  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
   outputParts.push("..");
  }
  outputParts = outputParts.concat(toParts.slice(samePartsLength));
  return outputParts.join("/");
 })
};
var TTY = {
 ttys: [],
 init: (function() {}),
 shutdown: (function() {}),
 register: (function(dev, ops) {
  TTY.ttys[dev] = {
   input: [],
   output: [],
   ops: ops
  };
  FS.registerDevice(dev, TTY.stream_ops);
 }),
 stream_ops: {
  open: (function(stream) {
   var tty = TTY.ttys[stream.node.rdev];
   if (!tty) {
    throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
   }
   stream.tty = tty;
   stream.seekable = false;
  }),
  close: (function(stream) {
   if (stream.tty.output.length) {
    stream.tty.ops.put_char(stream.tty, 10);
   }
  }),
  read: (function(stream, buffer, offset, length, pos) {
   if (!stream.tty || !stream.tty.ops.get_char) {
    throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
   }
   var bytesRead = 0;
   for (var i = 0; i < length; i++) {
    var result;
    try {
     result = stream.tty.ops.get_char(stream.tty);
    } catch (e) {
     throw new FS.ErrnoError(ERRNO_CODES.EIO);
    }
    if (result === undefined && bytesRead === 0) {
     throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
    }
    if (result === null || result === undefined) break;
    bytesRead++;
    buffer[offset + i] = result;
   }
   if (bytesRead) {
    stream.node.timestamp = Date.now();
   }
   return bytesRead;
  }),
  write: (function(stream, buffer, offset, length, pos) {
   if (!stream.tty || !stream.tty.ops.put_char) {
    throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
   }
   for (var i = 0; i < length; i++) {
    try {
     stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
    } catch (e) {
     throw new FS.ErrnoError(ERRNO_CODES.EIO);
    }
   }
   if (length) {
    stream.node.timestamp = Date.now();
   }
   return i;
  })
 },
 default_tty_ops: {
  get_char: (function(tty) {
   if (!tty.input.length) {
    var result = null;
    if (ENVIRONMENT_IS_NODE) {
     result = process["stdin"]["read"]();
     if (!result) {
      if (process["stdin"]["_readableState"] && process["stdin"]["_readableState"]["ended"]) {
       return null;
      }
      return undefined;
     }
    } else if (typeof window != "undefined" && typeof window.prompt == "function") {
     result = window.prompt("Input: ");
     if (result !== null) {
      result += "\n";
     }
    } else if (typeof readline == "function") {
     result = readline();
     if (result !== null) {
      result += "\n";
     }
    }
    if (!result) {
     return null;
    }
    tty.input = intArrayFromString(result, true);
   }
   return tty.input.shift();
  }),
  put_char: (function(tty, val) {
   if (val === null || val === 10) {
    Module["print"](tty.output.join(""));
    tty.output = [];
   } else {
    tty.output.push(TTY.utf8.processCChar(val));
   }
  })
 },
 default_tty1_ops: {
  put_char: (function(tty, val) {
   if (val === null || val === 10) {
    Module["printErr"](tty.output.join(""));
    tty.output = [];
   } else {
    tty.output.push(TTY.utf8.processCChar(val));
   }
  })
 }
};
var MEMFS = {
 ops_table: null,
 mount: (function(mount) {
  return MEMFS.createNode(null, "/", 16384 | 511, 0);
 }),
 createNode: (function(parent, name, mode, dev) {
  if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  if (!MEMFS.ops_table) {
   MEMFS.ops_table = {
    dir: {
     node: {
      getattr: MEMFS.node_ops.getattr,
      setattr: MEMFS.node_ops.setattr,
      lookup: MEMFS.node_ops.lookup,
      mknod: MEMFS.node_ops.mknod,
      rename: MEMFS.node_ops.rename,
      unlink: MEMFS.node_ops.unlink,
      rmdir: MEMFS.node_ops.rmdir,
      readdir: MEMFS.node_ops.readdir,
      symlink: MEMFS.node_ops.symlink
     },
     stream: {
      llseek: MEMFS.stream_ops.llseek
     }
    },
    file: {
     node: {
      getattr: MEMFS.node_ops.getattr,
      setattr: MEMFS.node_ops.setattr
     },
     stream: {
      llseek: MEMFS.stream_ops.llseek,
      read: MEMFS.stream_ops.read,
      write: MEMFS.stream_ops.write,
      allocate: MEMFS.stream_ops.allocate,
      mmap: MEMFS.stream_ops.mmap
     }
    },
    link: {
     node: {
      getattr: MEMFS.node_ops.getattr,
      setattr: MEMFS.node_ops.setattr,
      readlink: MEMFS.node_ops.readlink
     },
     stream: {}
    },
    chrdev: {
     node: {
      getattr: MEMFS.node_ops.getattr,
      setattr: MEMFS.node_ops.setattr
     },
     stream: FS.chrdev_stream_ops
    }
   };
  }
  var node = FS.createNode(parent, name, mode, dev);
  if (FS.isDir(node.mode)) {
   node.node_ops = MEMFS.ops_table.dir.node;
   node.stream_ops = MEMFS.ops_table.dir.stream;
   node.contents = {};
  } else if (FS.isFile(node.mode)) {
   node.node_ops = MEMFS.ops_table.file.node;
   node.stream_ops = MEMFS.ops_table.file.stream;
   node.usedBytes = 0;
   node.contents = null;
  } else if (FS.isLink(node.mode)) {
   node.node_ops = MEMFS.ops_table.link.node;
   node.stream_ops = MEMFS.ops_table.link.stream;
  } else if (FS.isChrdev(node.mode)) {
   node.node_ops = MEMFS.ops_table.chrdev.node;
   node.stream_ops = MEMFS.ops_table.chrdev.stream;
  }
  node.timestamp = Date.now();
  if (parent) {
   parent.contents[name] = node;
  }
  return node;
 }),
 getFileDataAsRegularArray: (function(node) {
  if (node.contents && node.contents.subarray) {
   var arr = [];
   for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
   return arr;
  }
  return node.contents;
 }),
 getFileDataAsTypedArray: (function(node) {
  if (node.contents && node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
  return new Uint8Array(node.contents);
 }),
 expandFileStorage: (function(node, newCapacity) {
  if (node.contents && node.contents.subarray && newCapacity > node.contents.length) {
   node.contents = MEMFS.getFileDataAsRegularArray(node);
   node.usedBytes = node.contents.length;
  }
  if (!node.contents || node.contents.subarray) {
   var prevCapacity = node.contents ? node.contents.buffer.byteLength : 0;
   if (prevCapacity >= newCapacity) return;
   var CAPACITY_DOUBLING_MAX = 1024 * 1024;
   newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) | 0);
   if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
   var oldContents = node.contents;
   node.contents = new Uint8Array(newCapacity);
   if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
   return;
  }
  if (!node.contents && newCapacity > 0) node.contents = [];
  while (node.contents.length < newCapacity) node.contents.push(0);
 }),
 resizeFileStorage: (function(node, newSize) {
  if (node.usedBytes == newSize) return;
  if (newSize == 0) {
   node.contents = null;
   node.usedBytes = 0;
   return;
  }
  if (!node.contents || node.contents.subarray) {
   var oldContents = node.contents;
   node.contents = new Uint8Array(new ArrayBuffer(newSize));
   node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)));
   node.usedBytes = newSize;
   return;
  }
  if (!node.contents) node.contents = [];
  if (node.contents.length > newSize) node.contents.length = newSize; else while (node.contents.length < newSize) node.contents.push(0);
  node.usedBytes = newSize;
 }),
 node_ops: {
  getattr: (function(node) {
   var attr = {};
   attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
   attr.ino = node.id;
   attr.mode = node.mode;
   attr.nlink = 1;
   attr.uid = 0;
   attr.gid = 0;
   attr.rdev = node.rdev;
   if (FS.isDir(node.mode)) {
    attr.size = 4096;
   } else if (FS.isFile(node.mode)) {
    attr.size = node.usedBytes;
   } else if (FS.isLink(node.mode)) {
    attr.size = node.link.length;
   } else {
    attr.size = 0;
   }
   attr.atime = new Date(node.timestamp);
   attr.mtime = new Date(node.timestamp);
   attr.ctime = new Date(node.timestamp);
   attr.blksize = 4096;
   attr.blocks = Math.ceil(attr.size / attr.blksize);
   return attr;
  }),
  setattr: (function(node, attr) {
   if (attr.mode !== undefined) {
    node.mode = attr.mode;
   }
   if (attr.timestamp !== undefined) {
    node.timestamp = attr.timestamp;
   }
   if (attr.size !== undefined) {
    MEMFS.resizeFileStorage(node, attr.size);
   }
  }),
  lookup: (function(parent, name) {
   throw FS.genericErrors[ERRNO_CODES.ENOENT];
  }),
  mknod: (function(parent, name, mode, dev) {
   return MEMFS.createNode(parent, name, mode, dev);
  }),
  rename: (function(old_node, new_dir, new_name) {
   if (FS.isDir(old_node.mode)) {
    var new_node;
    try {
     new_node = FS.lookupNode(new_dir, new_name);
    } catch (e) {}
    if (new_node) {
     for (var i in new_node.contents) {
      throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
     }
    }
   }
   delete old_node.parent.contents[old_node.name];
   old_node.name = new_name;
   new_dir.contents[new_name] = old_node;
   old_node.parent = new_dir;
  }),
  unlink: (function(parent, name) {
   delete parent.contents[name];
  }),
  rmdir: (function(parent, name) {
   var node = FS.lookupNode(parent, name);
   for (var i in node.contents) {
    throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
   }
   delete parent.contents[name];
  }),
  readdir: (function(node) {
   var entries = [ ".", ".." ];
   for (var key in node.contents) {
    if (!node.contents.hasOwnProperty(key)) {
     continue;
    }
    entries.push(key);
   }
   return entries;
  }),
  symlink: (function(parent, newname, oldpath) {
   var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
   node.link = oldpath;
   return node;
  }),
  readlink: (function(node) {
   if (!FS.isLink(node.mode)) {
    throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
   }
   return node.link;
  })
 },
 stream_ops: {
  read: (function(stream, buffer, offset, length, position) {
   var contents = stream.node.contents;
   if (position >= stream.node.usedBytes) return 0;
   var size = Math.min(stream.node.usedBytes - position, length);
   assert(size >= 0);
   if (size > 8 && contents.subarray) {
    buffer.set(contents.subarray(position, position + size), offset);
   } else {
    for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
   }
   return size;
  }),
  write: (function(stream, buffer, offset, length, position, canOwn) {
   if (!length) return 0;
   var node = stream.node;
   node.timestamp = Date.now();
   if (buffer.subarray && (!node.contents || node.contents.subarray)) {
    if (canOwn) {
     node.contents = buffer.subarray(offset, offset + length);
     node.usedBytes = length;
     return length;
    } else if (node.usedBytes === 0 && position === 0) {
     node.contents = new Uint8Array(buffer.subarray(offset, offset + length));
     node.usedBytes = length;
     return length;
    } else if (position + length <= node.usedBytes) {
     node.contents.set(buffer.subarray(offset, offset + length), position);
     return length;
    }
   }
   MEMFS.expandFileStorage(node, position + length);
   if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position); else for (var i = 0; i < length; i++) {
    node.contents[position + i] = buffer[offset + i];
   }
   node.usedBytes = Math.max(node.usedBytes, position + length);
   return length;
  }),
  llseek: (function(stream, offset, whence) {
   var position = offset;
   if (whence === 1) {
    position += stream.position;
   } else if (whence === 2) {
    if (FS.isFile(stream.node.mode)) {
     position += stream.node.usedBytes;
    }
   }
   if (position < 0) {
    throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
   }
   stream.ungotten = [];
   stream.position = position;
   return position;
  }),
  allocate: (function(stream, offset, length) {
   MEMFS.expandFileStorage(stream.node, offset + length);
   stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
  }),
  mmap: (function(stream, buffer, offset, length, position, prot, flags) {
   if (!FS.isFile(stream.node.mode)) {
    throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
   }
   var ptr;
   var allocated;
   var contents = stream.node.contents;
   if (!(flags & 2) && (contents.buffer === buffer || contents.buffer === buffer.buffer)) {
    allocated = false;
    ptr = contents.byteOffset;
   } else {
    if (position > 0 || position + length < stream.node.usedBytes) {
     if (contents.subarray) {
      contents = contents.subarray(position, position + length);
     } else {
      contents = Array.prototype.slice.call(contents, position, position + length);
     }
    }
    allocated = true;
    ptr = _malloc(length);
    if (!ptr) {
     throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
    }
    buffer.set(contents, ptr);
   }
   return {
    ptr: ptr,
    allocated: allocated
   };
  })
 }
};
var IDBFS = {
 dbs: {},
 indexedDB: (function() {
  return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
 }),
 DB_VERSION: 21,
 DB_STORE_NAME: "FILE_DATA",
 mount: (function(mount) {
  return MEMFS.mount.apply(null, arguments);
 }),
 syncfs: (function(mount, populate, callback) {
  IDBFS.getLocalSet(mount, (function(err, local) {
   if (err) return callback(err);
   IDBFS.getRemoteSet(mount, (function(err, remote) {
    if (err) return callback(err);
    var src = populate ? remote : local;
    var dst = populate ? local : remote;
    IDBFS.reconcile(src, dst, callback);
   }));
  }));
 }),
 getDB: (function(name, callback) {
  var db = IDBFS.dbs[name];
  if (db) {
   return callback(null, db);
  }
  var req;
  try {
   req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
  } catch (e) {
   return callback(e);
  }
  req.onupgradeneeded = (function(e) {
   var db = e.target.result;
   var transaction = e.target.transaction;
   var fileStore;
   if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
    fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
   } else {
    fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
   }
   fileStore.createIndex("timestamp", "timestamp", {
    unique: false
   });
  });
  req.onsuccess = (function() {
   db = req.result;
   IDBFS.dbs[name] = db;
   callback(null, db);
  });
  req.onerror = (function() {
   callback(this.error);
  });
 }),
 getLocalSet: (function(mount, callback) {
  var entries = {};
  function isRealDir(p) {
   return p !== "." && p !== "..";
  }
  function toAbsolute(root) {
   return (function(p) {
    return PATH.join2(root, p);
   });
  }
  var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  while (check.length) {
   var path = check.pop();
   var stat;
   try {
    stat = FS.stat(path);
   } catch (e) {
    return callback(e);
   }
   if (FS.isDir(stat.mode)) {
    check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
   }
   entries[path] = {
    timestamp: stat.mtime
   };
  }
  return callback(null, {
   type: "local",
   entries: entries
  });
 }),
 getRemoteSet: (function(mount, callback) {
  var entries = {};
  IDBFS.getDB(mount.mountpoint, (function(err, db) {
   if (err) return callback(err);
   var transaction = db.transaction([ IDBFS.DB_STORE_NAME ], "readonly");
   transaction.onerror = (function() {
    callback(this.error);
   });
   var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
   var index = store.index("timestamp");
   index.openKeyCursor().onsuccess = (function(event) {
    var cursor = event.target.result;
    if (!cursor) {
     return callback(null, {
      type: "remote",
      db: db,
      entries: entries
     });
    }
    entries[cursor.primaryKey] = {
     timestamp: cursor.key
    };
    cursor.continue();
   });
  }));
 }),
 loadLocalEntry: (function(path, callback) {
  var stat, node;
  try {
   var lookup = FS.lookupPath(path);
   node = lookup.node;
   stat = FS.stat(path);
  } catch (e) {
   return callback(e);
  }
  if (FS.isDir(stat.mode)) {
   return callback(null, {
    timestamp: stat.mtime,
    mode: stat.mode
   });
  } else if (FS.isFile(stat.mode)) {
   node.contents = MEMFS.getFileDataAsTypedArray(node);
   return callback(null, {
    timestamp: stat.mtime,
    mode: stat.mode,
    contents: node.contents
   });
  } else {
   return callback(new Error("node type not supported"));
  }
 }),
 storeLocalEntry: (function(path, entry, callback) {
  try {
   if (FS.isDir(entry.mode)) {
    FS.mkdir(path, entry.mode);
   } else if (FS.isFile(entry.mode)) {
    FS.writeFile(path, entry.contents, {
     encoding: "binary",
     canOwn: true
    });
   } else {
    return callback(new Error("node type not supported"));
   }
   FS.utime(path, entry.timestamp, entry.timestamp);
  } catch (e) {
   return callback(e);
  }
  callback(null);
 }),
 removeLocalEntry: (function(path, callback) {
  try {
   var lookup = FS.lookupPath(path);
   var stat = FS.stat(path);
   if (FS.isDir(stat.mode)) {
    FS.rmdir(path);
   } else if (FS.isFile(stat.mode)) {
    FS.unlink(path);
   }
  } catch (e) {
   return callback(e);
  }
  callback(null);
 }),
 loadRemoteEntry: (function(store, path, callback) {
  var req = store.get(path);
  req.onsuccess = (function(event) {
   callback(null, event.target.result);
  });
  req.onerror = (function() {
   callback(this.error);
  });
 }),
 storeRemoteEntry: (function(store, path, entry, callback) {
  var req = store.put(entry, path);
  req.onsuccess = (function() {
   callback(null);
  });
  req.onerror = (function() {
   callback(this.error);
  });
 }),
 removeRemoteEntry: (function(store, path, callback) {
  var req = store.delete(path);
  req.onsuccess = (function() {
   callback(null);
  });
  req.onerror = (function() {
   callback(this.error);
  });
 }),
 reconcile: (function(src, dst, callback) {
  var total = 0;
  var create = [];
  Object.keys(src.entries).forEach((function(key) {
   var e = src.entries[key];
   var e2 = dst.entries[key];
   if (!e2 || e.timestamp > e2.timestamp) {
    create.push(key);
    total++;
   }
  }));
  var remove = [];
  Object.keys(dst.entries).forEach((function(key) {
   var e = dst.entries[key];
   var e2 = src.entries[key];
   if (!e2) {
    remove.push(key);
    total++;
   }
  }));
  if (!total) {
   return callback(null);
  }
  var errored = false;
  var completed = 0;
  var db = src.type === "remote" ? src.db : dst.db;
  var transaction = db.transaction([ IDBFS.DB_STORE_NAME ], "readwrite");
  var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  function done(err) {
   if (err) {
    if (!done.errored) {
     done.errored = true;
     return callback(err);
    }
    return;
   }
   if (++completed >= total) {
    return callback(null);
   }
  }
  transaction.onerror = (function() {
   done(this.error);
  });
  create.sort().forEach((function(path) {
   if (dst.type === "local") {
    IDBFS.loadRemoteEntry(store, path, (function(err, entry) {
     if (err) return done(err);
     IDBFS.storeLocalEntry(path, entry, done);
    }));
   } else {
    IDBFS.loadLocalEntry(path, (function(err, entry) {
     if (err) return done(err);
     IDBFS.storeRemoteEntry(store, path, entry, done);
    }));
   }
  }));
  remove.sort().reverse().forEach((function(path) {
   if (dst.type === "local") {
    IDBFS.removeLocalEntry(path, done);
   } else {
    IDBFS.removeRemoteEntry(store, path, done);
   }
  }));
 })
};
var NODEFS = {
 isWindows: false,
 staticInit: (function() {
  NODEFS.isWindows = !!process.platform.match(/^win/);
 }),
 mount: (function(mount) {
  assert(ENVIRONMENT_IS_NODE);
  return NODEFS.createNode(null, "/", NODEFS.getMode(mount.opts.root), 0);
 }),
 createNode: (function(parent, name, mode, dev) {
  if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  var node = FS.createNode(parent, name, mode);
  node.node_ops = NODEFS.node_ops;
  node.stream_ops = NODEFS.stream_ops;
  return node;
 }),
 getMode: (function(path) {
  var stat;
  try {
   stat = fs.lstatSync(path);
   if (NODEFS.isWindows) {
    stat.mode = stat.mode | (stat.mode & 146) >> 1;
   }
  } catch (e) {
   if (!e.code) throw e;
   throw new FS.ErrnoError(ERRNO_CODES[e.code]);
  }
  return stat.mode;
 }),
 realPath: (function(node) {
  var parts = [];
  while (node.parent !== node) {
   parts.push(node.name);
   node = node.parent;
  }
  parts.push(node.mount.opts.root);
  parts.reverse();
  return PATH.join.apply(null, parts);
 }),
 flagsToPermissionStringMap: {
  0: "r",
  1: "r+",
  2: "r+",
  64: "r",
  65: "r+",
  66: "r+",
  129: "rx+",
  193: "rx+",
  514: "w+",
  577: "w",
  578: "w+",
  705: "wx",
  706: "wx+",
  1024: "a",
  1025: "a",
  1026: "a+",
  1089: "a",
  1090: "a+",
  1153: "ax",
  1154: "ax+",
  1217: "ax",
  1218: "ax+",
  4096: "rs",
  4098: "rs+"
 },
 flagsToPermissionString: (function(flags) {
  if (flags in NODEFS.flagsToPermissionStringMap) {
   return NODEFS.flagsToPermissionStringMap[flags];
  } else {
   return flags;
  }
 }),
 node_ops: {
  getattr: (function(node) {
   var path = NODEFS.realPath(node);
   var stat;
   try {
    stat = fs.lstatSync(path);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
   if (NODEFS.isWindows && !stat.blksize) {
    stat.blksize = 4096;
   }
   if (NODEFS.isWindows && !stat.blocks) {
    stat.blocks = (stat.size + stat.blksize - 1) / stat.blksize | 0;
   }
   return {
    dev: stat.dev,
    ino: stat.ino,
    mode: stat.mode,
    nlink: stat.nlink,
    uid: stat.uid,
    gid: stat.gid,
    rdev: stat.rdev,
    size: stat.size,
    atime: stat.atime,
    mtime: stat.mtime,
    ctime: stat.ctime,
    blksize: stat.blksize,
    blocks: stat.blocks
   };
  }),
  setattr: (function(node, attr) {
   var path = NODEFS.realPath(node);
   try {
    if (attr.mode !== undefined) {
     fs.chmodSync(path, attr.mode);
     node.mode = attr.mode;
    }
    if (attr.timestamp !== undefined) {
     var date = new Date(attr.timestamp);
     fs.utimesSync(path, date, date);
    }
    if (attr.size !== undefined) {
     fs.truncateSync(path, attr.size);
    }
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  lookup: (function(parent, name) {
   var path = PATH.join2(NODEFS.realPath(parent), name);
   var mode = NODEFS.getMode(path);
   return NODEFS.createNode(parent, name, mode);
  }),
  mknod: (function(parent, name, mode, dev) {
   var node = NODEFS.createNode(parent, name, mode, dev);
   var path = NODEFS.realPath(node);
   try {
    if (FS.isDir(node.mode)) {
     fs.mkdirSync(path, node.mode);
    } else {
     fs.writeFileSync(path, "", {
      mode: node.mode
     });
    }
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
   return node;
  }),
  rename: (function(oldNode, newDir, newName) {
   var oldPath = NODEFS.realPath(oldNode);
   var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
   try {
    fs.renameSync(oldPath, newPath);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  unlink: (function(parent, name) {
   var path = PATH.join2(NODEFS.realPath(parent), name);
   try {
    fs.unlinkSync(path);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  rmdir: (function(parent, name) {
   var path = PATH.join2(NODEFS.realPath(parent), name);
   try {
    fs.rmdirSync(path);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  readdir: (function(node) {
   var path = NODEFS.realPath(node);
   try {
    return fs.readdirSync(path);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  symlink: (function(parent, newName, oldPath) {
   var newPath = PATH.join2(NODEFS.realPath(parent), newName);
   try {
    fs.symlinkSync(oldPath, newPath);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  readlink: (function(node) {
   var path = NODEFS.realPath(node);
   try {
    return fs.readlinkSync(path);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  })
 },
 stream_ops: {
  open: (function(stream) {
   var path = NODEFS.realPath(stream.node);
   try {
    if (FS.isFile(stream.node.mode)) {
     stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
    }
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  close: (function(stream) {
   try {
    if (FS.isFile(stream.node.mode) && stream.nfd) {
     fs.closeSync(stream.nfd);
    }
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  read: (function(stream, buffer, offset, length, position) {
   var nbuffer = new Buffer(length);
   var res;
   try {
    res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
   } catch (e) {
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
   if (res > 0) {
    for (var i = 0; i < res; i++) {
     buffer[offset + i] = nbuffer[i];
    }
   }
   return res;
  }),
  write: (function(stream, buffer, offset, length, position) {
   var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
   var res;
   try {
    res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
   } catch (e) {
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
   return res;
  }),
  llseek: (function(stream, offset, whence) {
   var position = offset;
   if (whence === 1) {
    position += stream.position;
   } else if (whence === 2) {
    if (FS.isFile(stream.node.mode)) {
     try {
      var stat = fs.fstatSync(stream.nfd);
      position += stat.size;
     } catch (e) {
      throw new FS.ErrnoError(ERRNO_CODES[e.code]);
     }
    }
   }
   if (position < 0) {
    throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
   }
   stream.position = position;
   return position;
  })
 }
};
var _stdin = allocate(1, "i32*", ALLOC_STATIC);
var _stdout = allocate(1, "i32*", ALLOC_STATIC);
var _stderr = allocate(1, "i32*", ALLOC_STATIC);
function _fflush(stream) {}
var FS = {
 root: null,
 mounts: [],
 devices: [ null ],
 streams: [],
 nextInode: 1,
 nameTable: null,
 currentPath: "/",
 initialized: false,
 ignorePermissions: true,
 trackingDelegate: {},
 tracking: {
  openFlags: {
   READ: 1,
   WRITE: 2
  }
 },
 ErrnoError: null,
 genericErrors: {},
 handleFSError: (function(e) {
  if (!(e instanceof FS.ErrnoError)) throw e + " : " + stackTrace();
  return ___setErrNo(e.errno);
 }),
 lookupPath: (function(path, opts) {
  path = PATH.resolve(FS.cwd(), path);
  opts = opts || {};
  var defaults = {
   follow_mount: true,
   recurse_count: 0
  };
  for (var key in defaults) {
   if (opts[key] === undefined) {
    opts[key] = defaults[key];
   }
  }
  if (opts.recurse_count > 8) {
   throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
  }
  var parts = PATH.normalizeArray(path.split("/").filter((function(p) {
   return !!p;
  })), false);
  var current = FS.root;
  var current_path = "/";
  for (var i = 0; i < parts.length; i++) {
   var islast = i === parts.length - 1;
   if (islast && opts.parent) {
    break;
   }
   current = FS.lookupNode(current, parts[i]);
   current_path = PATH.join2(current_path, parts[i]);
   if (FS.isMountpoint(current)) {
    if (!islast || islast && opts.follow_mount) {
     current = current.mounted.root;
    }
   }
   if (!islast || opts.follow) {
    var count = 0;
    while (FS.isLink(current.mode)) {
     var link = FS.readlink(current_path);
     current_path = PATH.resolve(PATH.dirname(current_path), link);
     var lookup = FS.lookupPath(current_path, {
      recurse_count: opts.recurse_count
     });
     current = lookup.node;
     if (count++ > 40) {
      throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
     }
    }
   }
  }
  return {
   path: current_path,
   node: current
  };
 }),
 getPath: (function(node) {
  var path;
  while (true) {
   if (FS.isRoot(node)) {
    var mount = node.mount.mountpoint;
    if (!path) return mount;
    return mount[mount.length - 1] !== "/" ? mount + "/" + path : mount + path;
   }
   path = path ? node.name + "/" + path : node.name;
   node = node.parent;
  }
 }),
 hashName: (function(parentid, name) {
  var hash = 0;
  for (var i = 0; i < name.length; i++) {
   hash = (hash << 5) - hash + name.charCodeAt(i) | 0;
  }
  return (parentid + hash >>> 0) % FS.nameTable.length;
 }),
 hashAddNode: (function(node) {
  var hash = FS.hashName(node.parent.id, node.name);
  node.name_next = FS.nameTable[hash];
  FS.nameTable[hash] = node;
 }),
 hashRemoveNode: (function(node) {
  var hash = FS.hashName(node.parent.id, node.name);
  if (FS.nameTable[hash] === node) {
   FS.nameTable[hash] = node.name_next;
  } else {
   var current = FS.nameTable[hash];
   while (current) {
    if (current.name_next === node) {
     current.name_next = node.name_next;
     break;
    }
    current = current.name_next;
   }
  }
 }),
 lookupNode: (function(parent, name) {
  var err = FS.mayLookup(parent);
  if (err) {
   throw new FS.ErrnoError(err);
  }
  var hash = FS.hashName(parent.id, name);
  for (var node = FS.nameTable[hash]; node; node = node.name_next) {
   var nodeName = node.name;
   if (node.parent.id === parent.id && nodeName === name) {
    return node;
   }
  }
  return FS.lookup(parent, name);
 }),
 createNode: (function(parent, name, mode, rdev) {
  if (!FS.FSNode) {
   FS.FSNode = (function(parent, name, mode, rdev) {
    if (!parent) {
     parent = this;
    }
    this.parent = parent;
    this.mount = parent.mount;
    this.mounted = null;
    this.id = FS.nextInode++;
    this.name = name;
    this.mode = mode;
    this.node_ops = {};
    this.stream_ops = {};
    this.rdev = rdev;
   });
   FS.FSNode.prototype = {};
   var readMode = 292 | 73;
   var writeMode = 146;
   Object.defineProperties(FS.FSNode.prototype, {
    read: {
     get: (function() {
      return (this.mode & readMode) === readMode;
     }),
     set: (function(val) {
      val ? this.mode |= readMode : this.mode &= ~readMode;
     })
    },
    write: {
     get: (function() {
      return (this.mode & writeMode) === writeMode;
     }),
     set: (function(val) {
      val ? this.mode |= writeMode : this.mode &= ~writeMode;
     })
    },
    isFolder: {
     get: (function() {
      return FS.isDir(this.mode);
     })
    },
    isDevice: {
     get: (function() {
      return FS.isChrdev(this.mode);
     })
    }
   });
  }
  var node = new FS.FSNode(parent, name, mode, rdev);
  FS.hashAddNode(node);
  return node;
 }),
 destroyNode: (function(node) {
  FS.hashRemoveNode(node);
 }),
 isRoot: (function(node) {
  return node === node.parent;
 }),
 isMountpoint: (function(node) {
  return !!node.mounted;
 }),
 isFile: (function(mode) {
  return (mode & 61440) === 32768;
 }),
 isDir: (function(mode) {
  return (mode & 61440) === 16384;
 }),
 isLink: (function(mode) {
  return (mode & 61440) === 40960;
 }),
 isChrdev: (function(mode) {
  return (mode & 61440) === 8192;
 }),
 isBlkdev: (function(mode) {
  return (mode & 61440) === 24576;
 }),
 isFIFO: (function(mode) {
  return (mode & 61440) === 4096;
 }),
 isSocket: (function(mode) {
  return (mode & 49152) === 49152;
 }),
 flagModes: {
  "r": 0,
  "rs": 1052672,
  "r+": 2,
  "w": 577,
  "wx": 705,
  "xw": 705,
  "w+": 578,
  "wx+": 706,
  "xw+": 706,
  "a": 1089,
  "ax": 1217,
  "xa": 1217,
  "a+": 1090,
  "ax+": 1218,
  "xa+": 1218
 },
 modeStringToFlags: (function(str) {
  var flags = FS.flagModes[str];
  if (typeof flags === "undefined") {
   throw new Error("Unknown file open mode: " + str);
  }
  return flags;
 }),
 flagsToPermissionString: (function(flag) {
  var accmode = flag & 2097155;
  var perms = [ "r", "w", "rw" ][accmode];
  if (flag & 512) {
   perms += "w";
  }
  return perms;
 }),
 nodePermissions: (function(node, perms) {
  if (FS.ignorePermissions) {
   return 0;
  }
  if (perms.indexOf("r") !== -1 && !(node.mode & 292)) {
   return ERRNO_CODES.EACCES;
  } else if (perms.indexOf("w") !== -1 && !(node.mode & 146)) {
   return ERRNO_CODES.EACCES;
  } else if (perms.indexOf("x") !== -1 && !(node.mode & 73)) {
   return ERRNO_CODES.EACCES;
  }
  return 0;
 }),
 mayLookup: (function(dir) {
  return FS.nodePermissions(dir, "x");
 }),
 mayCreate: (function(dir, name) {
  try {
   var node = FS.lookupNode(dir, name);
   return ERRNO_CODES.EEXIST;
  } catch (e) {}
  return FS.nodePermissions(dir, "wx");
 }),
 mayDelete: (function(dir, name, isdir) {
  var node;
  try {
   node = FS.lookupNode(dir, name);
  } catch (e) {
   return e.errno;
  }
  var err = FS.nodePermissions(dir, "wx");
  if (err) {
   return err;
  }
  if (isdir) {
   if (!FS.isDir(node.mode)) {
    return ERRNO_CODES.ENOTDIR;
   }
   if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
    return ERRNO_CODES.EBUSY;
   }
  } else {
   if (FS.isDir(node.mode)) {
    return ERRNO_CODES.EISDIR;
   }
  }
  return 0;
 }),
 mayOpen: (function(node, flags) {
  if (!node) {
   return ERRNO_CODES.ENOENT;
  }
  if (FS.isLink(node.mode)) {
   return ERRNO_CODES.ELOOP;
  } else if (FS.isDir(node.mode)) {
   if ((flags & 2097155) !== 0 || flags & 512) {
    return ERRNO_CODES.EISDIR;
   }
  }
  return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
 }),
 MAX_OPEN_FDS: 4096,
 nextfd: (function(fd_start, fd_end) {
  fd_start = fd_start || 0;
  fd_end = fd_end || FS.MAX_OPEN_FDS;
  for (var fd = fd_start; fd <= fd_end; fd++) {
   if (!FS.streams[fd]) {
    return fd;
   }
  }
  throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
 }),
 getStream: (function(fd) {
  return FS.streams[fd];
 }),
 createStream: (function(stream, fd_start, fd_end) {
  if (!FS.FSStream) {
   FS.FSStream = (function() {});
   FS.FSStream.prototype = {};
   Object.defineProperties(FS.FSStream.prototype, {
    object: {
     get: (function() {
      return this.node;
     }),
     set: (function(val) {
      this.node = val;
     })
    },
    isRead: {
     get: (function() {
      return (this.flags & 2097155) !== 1;
     })
    },
    isWrite: {
     get: (function() {
      return (this.flags & 2097155) !== 0;
     })
    },
    isAppend: {
     get: (function() {
      return this.flags & 1024;
     })
    }
   });
  }
  var newStream = new FS.FSStream;
  for (var p in stream) {
   newStream[p] = stream[p];
  }
  stream = newStream;
  var fd = FS.nextfd(fd_start, fd_end);
  stream.fd = fd;
  FS.streams[fd] = stream;
  return stream;
 }),
 closeStream: (function(fd) {
  FS.streams[fd] = null;
 }),
 getStreamFromPtr: (function(ptr) {
  return FS.streams[ptr - 1];
 }),
 getPtrForStream: (function(stream) {
  return stream ? stream.fd + 1 : 0;
 }),
 chrdev_stream_ops: {
  open: (function(stream) {
   var device = FS.getDevice(stream.node.rdev);
   stream.stream_ops = device.stream_ops;
   if (stream.stream_ops.open) {
    stream.stream_ops.open(stream);
   }
  }),
  llseek: (function() {
   throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
  })
 },
 major: (function(dev) {
  return dev >> 8;
 }),
 minor: (function(dev) {
  return dev & 255;
 }),
 makedev: (function(ma, mi) {
  return ma << 8 | mi;
 }),
 registerDevice: (function(dev, ops) {
  FS.devices[dev] = {
   stream_ops: ops
  };
 }),
 getDevice: (function(dev) {
  return FS.devices[dev];
 }),
 getMounts: (function(mount) {
  var mounts = [];
  var check = [ mount ];
  while (check.length) {
   var m = check.pop();
   mounts.push(m);
   check.push.apply(check, m.mounts);
  }
  return mounts;
 }),
 syncfs: (function(populate, callback) {
  if (typeof populate === "function") {
   callback = populate;
   populate = false;
  }
  var mounts = FS.getMounts(FS.root.mount);
  var completed = 0;
  function done(err) {
   if (err) {
    if (!done.errored) {
     done.errored = true;
     return callback(err);
    }
    return;
   }
   if (++completed >= mounts.length) {
    callback(null);
   }
  }
  mounts.forEach((function(mount) {
   if (!mount.type.syncfs) {
    return done(null);
   }
   mount.type.syncfs(mount, populate, done);
  }));
 }),
 mount: (function(type, opts, mountpoint) {
  var root = mountpoint === "/";
  var pseudo = !mountpoint;
  var node;
  if (root && FS.root) {
   throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
  } else if (!root && !pseudo) {
   var lookup = FS.lookupPath(mountpoint, {
    follow_mount: false
   });
   mountpoint = lookup.path;
   node = lookup.node;
   if (FS.isMountpoint(node)) {
    throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
   }
   if (!FS.isDir(node.mode)) {
    throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
   }
  }
  var mount = {
   type: type,
   opts: opts,
   mountpoint: mountpoint,
   mounts: []
  };
  var mountRoot = type.mount(mount);
  mountRoot.mount = mount;
  mount.root = mountRoot;
  if (root) {
   FS.root = mountRoot;
  } else if (node) {
   node.mounted = mount;
   if (node.mount) {
    node.mount.mounts.push(mount);
   }
  }
  return mountRoot;
 }),
 unmount: (function(mountpoint) {
  var lookup = FS.lookupPath(mountpoint, {
   follow_mount: false
  });
  if (!FS.isMountpoint(lookup.node)) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  var node = lookup.node;
  var mount = node.mounted;
  var mounts = FS.getMounts(mount);
  Object.keys(FS.nameTable).forEach((function(hash) {
   var current = FS.nameTable[hash];
   while (current) {
    var next = current.name_next;
    if (mounts.indexOf(current.mount) !== -1) {
     FS.destroyNode(current);
    }
    current = next;
   }
  }));
  node.mounted = null;
  var idx = node.mount.mounts.indexOf(mount);
  assert(idx !== -1);
  node.mount.mounts.splice(idx, 1);
 }),
 lookup: (function(parent, name) {
  return parent.node_ops.lookup(parent, name);
 }),
 mknod: (function(path, mode, dev) {
  var lookup = FS.lookupPath(path, {
   parent: true
  });
  var parent = lookup.node;
  var name = PATH.basename(path);
  var err = FS.mayCreate(parent, name);
  if (err) {
   throw new FS.ErrnoError(err);
  }
  if (!parent.node_ops.mknod) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  return parent.node_ops.mknod(parent, name, mode, dev);
 }),
 create: (function(path, mode) {
  mode = mode !== undefined ? mode : 438;
  mode &= 4095;
  mode |= 32768;
  return FS.mknod(path, mode, 0);
 }),
 mkdir: (function(path, mode) {
  mode = mode !== undefined ? mode : 511;
  mode &= 511 | 512;
  mode |= 16384;
  return FS.mknod(path, mode, 0);
 }),
 mkdev: (function(path, mode, dev) {
  if (typeof dev === "undefined") {
   dev = mode;
   mode = 438;
  }
  mode |= 8192;
  return FS.mknod(path, mode, dev);
 }),
 symlink: (function(oldpath, newpath) {
  var lookup = FS.lookupPath(newpath, {
   parent: true
  });
  var parent = lookup.node;
  var newname = PATH.basename(newpath);
  var err = FS.mayCreate(parent, newname);
  if (err) {
   throw new FS.ErrnoError(err);
  }
  if (!parent.node_ops.symlink) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  return parent.node_ops.symlink(parent, newname, oldpath);
 }),
 rename: (function(old_path, new_path) {
  var old_dirname = PATH.dirname(old_path);
  var new_dirname = PATH.dirname(new_path);
  var old_name = PATH.basename(old_path);
  var new_name = PATH.basename(new_path);
  var lookup, old_dir, new_dir;
  try {
   lookup = FS.lookupPath(old_path, {
    parent: true
   });
   old_dir = lookup.node;
   lookup = FS.lookupPath(new_path, {
    parent: true
   });
   new_dir = lookup.node;
  } catch (e) {
   throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
  }
  if (old_dir.mount !== new_dir.mount) {
   throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
  }
  var old_node = FS.lookupNode(old_dir, old_name);
  var relative = PATH.relative(old_path, new_dirname);
  if (relative.charAt(0) !== ".") {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  relative = PATH.relative(new_path, old_dirname);
  if (relative.charAt(0) !== ".") {
   throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
  }
  var new_node;
  try {
   new_node = FS.lookupNode(new_dir, new_name);
  } catch (e) {}
  if (old_node === new_node) {
   return;
  }
  var isdir = FS.isDir(old_node.mode);
  var err = FS.mayDelete(old_dir, old_name, isdir);
  if (err) {
   throw new FS.ErrnoError(err);
  }
  err = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
  if (err) {
   throw new FS.ErrnoError(err);
  }
  if (!old_dir.node_ops.rename) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
   throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
  }
  if (new_dir !== old_dir) {
   err = FS.nodePermissions(old_dir, "w");
   if (err) {
    throw new FS.ErrnoError(err);
   }
  }
  try {
   if (FS.trackingDelegate["willMovePath"]) {
    FS.trackingDelegate["willMovePath"](old_path, new_path);
   }
  } catch (e) {
   console.log("FS.trackingDelegate['willMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message);
  }
  FS.hashRemoveNode(old_node);
  try {
   old_dir.node_ops.rename(old_node, new_dir, new_name);
  } catch (e) {
   throw e;
  } finally {
   FS.hashAddNode(old_node);
  }
  try {
   if (FS.trackingDelegate["onMovePath"]) FS.trackingDelegate["onMovePath"](old_path, new_path);
  } catch (e) {
   console.log("FS.trackingDelegate['onMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message);
  }
 }),
 rmdir: (function(path) {
  var lookup = FS.lookupPath(path, {
   parent: true
  });
  var parent = lookup.node;
  var name = PATH.basename(path);
  var node = FS.lookupNode(parent, name);
  var err = FS.mayDelete(parent, name, true);
  if (err) {
   throw new FS.ErrnoError(err);
  }
  if (!parent.node_ops.rmdir) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  if (FS.isMountpoint(node)) {
   throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
  }
  try {
   if (FS.trackingDelegate["willDeletePath"]) {
    FS.trackingDelegate["willDeletePath"](path);
   }
  } catch (e) {
   console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message);
  }
  parent.node_ops.rmdir(parent, name);
  FS.destroyNode(node);
  try {
   if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path);
  } catch (e) {
   console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message);
  }
 }),
 readdir: (function(path) {
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  var node = lookup.node;
  if (!node.node_ops.readdir) {
   throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
  }
  return node.node_ops.readdir(node);
 }),
 unlink: (function(path) {
  var lookup = FS.lookupPath(path, {
   parent: true
  });
  var parent = lookup.node;
  var name = PATH.basename(path);
  var node = FS.lookupNode(parent, name);
  var err = FS.mayDelete(parent, name, false);
  if (err) {
   if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
   throw new FS.ErrnoError(err);
  }
  if (!parent.node_ops.unlink) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  if (FS.isMountpoint(node)) {
   throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
  }
  try {
   if (FS.trackingDelegate["willDeletePath"]) {
    FS.trackingDelegate["willDeletePath"](path);
   }
  } catch (e) {
   console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message);
  }
  parent.node_ops.unlink(parent, name);
  FS.destroyNode(node);
  try {
   if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path);
  } catch (e) {
   console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message);
  }
 }),
 readlink: (function(path) {
  var lookup = FS.lookupPath(path);
  var link = lookup.node;
  if (!link.node_ops.readlink) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  return link.node_ops.readlink(link);
 }),
 stat: (function(path, dontFollow) {
  var lookup = FS.lookupPath(path, {
   follow: !dontFollow
  });
  var node = lookup.node;
  if (!node.node_ops.getattr) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  return node.node_ops.getattr(node);
 }),
 lstat: (function(path) {
  return FS.stat(path, true);
 }),
 chmod: (function(path, mode, dontFollow) {
  var node;
  if (typeof path === "string") {
   var lookup = FS.lookupPath(path, {
    follow: !dontFollow
   });
   node = lookup.node;
  } else {
   node = path;
  }
  if (!node.node_ops.setattr) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  node.node_ops.setattr(node, {
   mode: mode & 4095 | node.mode & ~4095,
   timestamp: Date.now()
  });
 }),
 lchmod: (function(path, mode) {
  FS.chmod(path, mode, true);
 }),
 fchmod: (function(fd, mode) {
  var stream = FS.getStream(fd);
  if (!stream) {
   throw new FS.ErrnoError(ERRNO_CODES.EBADF);
  }
  FS.chmod(stream.node, mode);
 }),
 chown: (function(path, uid, gid, dontFollow) {
  var node;
  if (typeof path === "string") {
   var lookup = FS.lookupPath(path, {
    follow: !dontFollow
   });
   node = lookup.node;
  } else {
   node = path;
  }
  if (!node.node_ops.setattr) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  node.node_ops.setattr(node, {
   timestamp: Date.now()
  });
 }),
 lchown: (function(path, uid, gid) {
  FS.chown(path, uid, gid, true);
 }),
 fchown: (function(fd, uid, gid) {
  var stream = FS.getStream(fd);
  if (!stream) {
   throw new FS.ErrnoError(ERRNO_CODES.EBADF);
  }
  FS.chown(stream.node, uid, gid);
 }),
 truncate: (function(path, len) {
  if (len < 0) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  var node;
  if (typeof path === "string") {
   var lookup = FS.lookupPath(path, {
    follow: true
   });
   node = lookup.node;
  } else {
   node = path;
  }
  if (!node.node_ops.setattr) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  if (FS.isDir(node.mode)) {
   throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
  }
  if (!FS.isFile(node.mode)) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  var err = FS.nodePermissions(node, "w");
  if (err) {
   throw new FS.ErrnoError(err);
  }
  node.node_ops.setattr(node, {
   size: len,
   timestamp: Date.now()
  });
 }),
 ftruncate: (function(fd, len) {
  var stream = FS.getStream(fd);
  if (!stream) {
   throw new FS.ErrnoError(ERRNO_CODES.EBADF);
  }
  if ((stream.flags & 2097155) === 0) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  FS.truncate(stream.node, len);
 }),
 utime: (function(path, atime, mtime) {
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  var node = lookup.node;
  node.node_ops.setattr(node, {
   timestamp: Math.max(atime, mtime)
  });
 }),
 open: (function(path, flags, mode, fd_start, fd_end) {
  if (path === "") {
   throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
  }
  flags = typeof flags === "string" ? FS.modeStringToFlags(flags) : flags;
  mode = typeof mode === "undefined" ? 438 : mode;
  if (flags & 64) {
   mode = mode & 4095 | 32768;
  } else {
   mode = 0;
  }
  var node;
  if (typeof path === "object") {
   node = path;
  } else {
   path = PATH.normalize(path);
   try {
    var lookup = FS.lookupPath(path, {
     follow: !(flags & 131072)
    });
    node = lookup.node;
   } catch (e) {}
  }
  if (flags & 64) {
   if (node) {
    if (flags & 128) {
     throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
    }
   } else {
    node = FS.mknod(path, mode, 0);
   }
  }
  if (!node) {
   throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
  }
  if (FS.isChrdev(node.mode)) {
   flags &= ~512;
  }
  var err = FS.mayOpen(node, flags);
  if (err) {
   throw new FS.ErrnoError(err);
  }
  if (flags & 512) {
   FS.truncate(node, 0);
  }
  flags &= ~(128 | 512);
  var stream = FS.createStream({
   node: node,
   path: FS.getPath(node),
   flags: flags,
   seekable: true,
   position: 0,
   stream_ops: node.stream_ops,
   ungotten: [],
   error: false
  }, fd_start, fd_end);
  if (stream.stream_ops.open) {
   stream.stream_ops.open(stream);
  }
  if (Module["logReadFiles"] && !(flags & 1)) {
   if (!FS.readFiles) FS.readFiles = {};
   if (!(path in FS.readFiles)) {
    FS.readFiles[path] = 1;
    Module["printErr"]("read file: " + path);
   }
  }
  try {
   if (FS.trackingDelegate["onOpenFile"]) {
    var trackingFlags = 0;
    if ((flags & 2097155) !== 1) {
     trackingFlags |= FS.tracking.openFlags.READ;
    }
    if ((flags & 2097155) !== 0) {
     trackingFlags |= FS.tracking.openFlags.WRITE;
    }
    FS.trackingDelegate["onOpenFile"](path, trackingFlags);
   }
  } catch (e) {
   console.log("FS.trackingDelegate['onOpenFile']('" + path + "', flags) threw an exception: " + e.message);
  }
  return stream;
 }),
 close: (function(stream) {
  try {
   if (stream.stream_ops.close) {
    stream.stream_ops.close(stream);
   }
  } catch (e) {
   throw e;
  } finally {
   FS.closeStream(stream.fd);
  }
 }),
 llseek: (function(stream, offset, whence) {
  if (!stream.seekable || !stream.stream_ops.llseek) {
   throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
  }
  return stream.stream_ops.llseek(stream, offset, whence);
 }),
 read: (function(stream, buffer, offset, length, position) {
  if (length < 0 || position < 0) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  if ((stream.flags & 2097155) === 1) {
   throw new FS.ErrnoError(ERRNO_CODES.EBADF);
  }
  if (FS.isDir(stream.node.mode)) {
   throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
  }
  if (!stream.stream_ops.read) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  var seeking = true;
  if (typeof position === "undefined") {
   position = stream.position;
   seeking = false;
  } else if (!stream.seekable) {
   throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
  }
  var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
  if (!seeking) stream.position += bytesRead;
  return bytesRead;
 }),
 write: (function(stream, buffer, offset, length, position, canOwn) {
  if (length < 0 || position < 0) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  if ((stream.flags & 2097155) === 0) {
   throw new FS.ErrnoError(ERRNO_CODES.EBADF);
  }
  if (FS.isDir(stream.node.mode)) {
   throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
  }
  if (!stream.stream_ops.write) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  if (stream.flags & 1024) {
   FS.llseek(stream, 0, 2);
  }
  var seeking = true;
  if (typeof position === "undefined") {
   position = stream.position;
   seeking = false;
  } else if (!stream.seekable) {
   throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
  }
  var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
  if (!seeking) stream.position += bytesWritten;
  try {
   if (stream.path && FS.trackingDelegate["onWriteToFile"]) FS.trackingDelegate["onWriteToFile"](stream.path);
  } catch (e) {
   console.log("FS.trackingDelegate['onWriteToFile']('" + path + "') threw an exception: " + e.message);
  }
  return bytesWritten;
 }),
 allocate: (function(stream, offset, length) {
  if (offset < 0 || length <= 0) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  if ((stream.flags & 2097155) === 0) {
   throw new FS.ErrnoError(ERRNO_CODES.EBADF);
  }
  if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
   throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
  }
  if (!stream.stream_ops.allocate) {
   throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
  }
  stream.stream_ops.allocate(stream, offset, length);
 }),
 mmap: (function(stream, buffer, offset, length, position, prot, flags) {
  if ((stream.flags & 2097155) === 1) {
   throw new FS.ErrnoError(ERRNO_CODES.EACCES);
  }
  if (!stream.stream_ops.mmap) {
   throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
  }
  return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
 }),
 ioctl: (function(stream, cmd, arg) {
  if (!stream.stream_ops.ioctl) {
   throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
  }
  return stream.stream_ops.ioctl(stream, cmd, arg);
 }),
 readFile: (function(path, opts) {
  opts = opts || {};
  opts.flags = opts.flags || "r";
  opts.encoding = opts.encoding || "binary";
  if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
   throw new Error('Invalid encoding type "' + opts.encoding + '"');
  }
  var ret;
  var stream = FS.open(path, opts.flags);
  var stat = FS.stat(path);
  var length = stat.size;
  var buf = new Uint8Array(length);
  FS.read(stream, buf, 0, length, 0);
  if (opts.encoding === "utf8") {
   ret = "";
   var utf8 = new Runtime.UTF8Processor;
   for (var i = 0; i < length; i++) {
    ret += utf8.processCChar(buf[i]);
   }
  } else if (opts.encoding === "binary") {
   ret = buf;
  }
  FS.close(stream);
  return ret;
 }),
 writeFile: (function(path, data, opts) {
  opts = opts || {};
  opts.flags = opts.flags || "w";
  opts.encoding = opts.encoding || "utf8";
  if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
   throw new Error('Invalid encoding type "' + opts.encoding + '"');
  }
  var stream = FS.open(path, opts.flags, opts.mode);
  if (opts.encoding === "utf8") {
   var utf8 = new Runtime.UTF8Processor;
   var buf = new Uint8Array(utf8.processJSString(data));
   FS.write(stream, buf, 0, buf.length, 0, opts.canOwn);
  } else if (opts.encoding === "binary") {
   FS.write(stream, data, 0, data.length, 0, opts.canOwn);
  }
  FS.close(stream);
 }),
 cwd: (function() {
  return FS.currentPath;
 }),
 chdir: (function(path) {
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  if (!FS.isDir(lookup.node.mode)) {
   throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
  }
  var err = FS.nodePermissions(lookup.node, "x");
  if (err) {
   throw new FS.ErrnoError(err);
  }
  FS.currentPath = lookup.path;
 }),
 createDefaultDirectories: (function() {
  FS.mkdir("/tmp");
 }),
 createDefaultDevices: (function() {
  FS.mkdir("/dev");
  FS.registerDevice(FS.makedev(1, 3), {
   read: (function() {
    return 0;
   }),
   write: (function() {
    return 0;
   })
  });
  FS.mkdev("/dev/null", FS.makedev(1, 3));
  TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
  TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
  FS.mkdev("/dev/tty", FS.makedev(5, 0));
  FS.mkdev("/dev/tty1", FS.makedev(6, 0));
  var random_device;
  if (typeof crypto !== "undefined") {
   var randomBuffer = new Uint8Array(1);
   random_device = (function() {
    crypto.getRandomValues(randomBuffer);
    return randomBuffer[0];
   });
  } else if (ENVIRONMENT_IS_NODE) {
   random_device = (function() {
    return require("crypto").randomBytes(1)[0];
   });
  } else {
   random_device = (function() {
    return Math.floor(Math.random() * 256);
   });
  }
  FS.createDevice("/dev", "random", random_device);
  FS.createDevice("/dev", "urandom", random_device);
  FS.mkdir("/dev/shm");
  FS.mkdir("/dev/shm/tmp");
 }),
 createStandardStreams: (function() {
  if (Module["stdin"]) {
   FS.createDevice("/dev", "stdin", Module["stdin"]);
  } else {
   FS.symlink("/dev/tty", "/dev/stdin");
  }
  if (Module["stdout"]) {
   FS.createDevice("/dev", "stdout", null, Module["stdout"]);
  } else {
   FS.symlink("/dev/tty", "/dev/stdout");
  }
  if (Module["stderr"]) {
   FS.createDevice("/dev", "stderr", null, Module["stderr"]);
  } else {
   FS.symlink("/dev/tty1", "/dev/stderr");
  }
  var stdin = FS.open("/dev/stdin", "r");
  HEAP32[_stdin >> 2] = FS.getPtrForStream(stdin);
  assert(stdin.fd === 0, "invalid handle for stdin (" + stdin.fd + ")");
  var stdout = FS.open("/dev/stdout", "w");
  HEAP32[_stdout >> 2] = FS.getPtrForStream(stdout);
  assert(stdout.fd === 1, "invalid handle for stdout (" + stdout.fd + ")");
  var stderr = FS.open("/dev/stderr", "w");
  HEAP32[_stderr >> 2] = FS.getPtrForStream(stderr);
  assert(stderr.fd === 2, "invalid handle for stderr (" + stderr.fd + ")");
 }),
 ensureErrnoError: (function() {
  if (FS.ErrnoError) return;
  FS.ErrnoError = function ErrnoError(errno) {
   this.errno = errno;
   for (var key in ERRNO_CODES) {
    if (ERRNO_CODES[key] === errno) {
     this.code = key;
     break;
    }
   }
   this.message = ERRNO_MESSAGES[errno];
  };
  FS.ErrnoError.prototype = new Error;
  FS.ErrnoError.prototype.constructor = FS.ErrnoError;
  [ ERRNO_CODES.ENOENT ].forEach((function(code) {
   FS.genericErrors[code] = new FS.ErrnoError(code);
   FS.genericErrors[code].stack = "<generic error, no stack>";
  }));
 }),
 staticInit: (function() {
  FS.ensureErrnoError();
  FS.nameTable = new Array(4096);
  FS.mount(MEMFS, {}, "/");
  FS.createDefaultDirectories();
  FS.createDefaultDevices();
 }),
 init: (function(input, output, error) {
  assert(!FS.init.initialized, "FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)");
  FS.init.initialized = true;
  FS.ensureErrnoError();
  Module["stdin"] = input || Module["stdin"];
  Module["stdout"] = output || Module["stdout"];
  Module["stderr"] = error || Module["stderr"];
  FS.createStandardStreams();
 }),
 quit: (function() {
  FS.init.initialized = false;
  for (var i = 0; i < FS.streams.length; i++) {
   var stream = FS.streams[i];
   if (!stream) {
    continue;
   }
   FS.close(stream);
  }
 }),
 getMode: (function(canRead, canWrite) {
  var mode = 0;
  if (canRead) mode |= 292 | 73;
  if (canWrite) mode |= 146;
  return mode;
 }),
 joinPath: (function(parts, forceRelative) {
  var path = PATH.join.apply(null, parts);
  if (forceRelative && path[0] == "/") path = path.substr(1);
  return path;
 }),
 absolutePath: (function(relative, base) {
  return PATH.resolve(base, relative);
 }),
 standardizePath: (function(path) {
  return PATH.normalize(path);
 }),
 findObject: (function(path, dontResolveLastLink) {
  var ret = FS.analyzePath(path, dontResolveLastLink);
  if (ret.exists) {
   return ret.object;
  } else {
   ___setErrNo(ret.error);
   return null;
  }
 }),
 analyzePath: (function(path, dontResolveLastLink) {
  try {
   var lookup = FS.lookupPath(path, {
    follow: !dontResolveLastLink
   });
   path = lookup.path;
  } catch (e) {}
  var ret = {
   isRoot: false,
   exists: false,
   error: 0,
   name: null,
   path: null,
   object: null,
   parentExists: false,
   parentPath: null,
   parentObject: null
  };
  try {
   var lookup = FS.lookupPath(path, {
    parent: true
   });
   ret.parentExists = true;
   ret.parentPath = lookup.path;
   ret.parentObject = lookup.node;
   ret.name = PATH.basename(path);
   lookup = FS.lookupPath(path, {
    follow: !dontResolveLastLink
   });
   ret.exists = true;
   ret.path = lookup.path;
   ret.object = lookup.node;
   ret.name = lookup.node.name;
   ret.isRoot = lookup.path === "/";
  } catch (e) {
   ret.error = e.errno;
  }
  return ret;
 }),
 createFolder: (function(parent, name, canRead, canWrite) {
  var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
  var mode = FS.getMode(canRead, canWrite);
  return FS.mkdir(path, mode);
 }),
 createPath: (function(parent, path, canRead, canWrite) {
  parent = typeof parent === "string" ? parent : FS.getPath(parent);
  var parts = path.split("/").reverse();
  while (parts.length) {
   var part = parts.pop();
   if (!part) continue;
   var current = PATH.join2(parent, part);
   try {
    FS.mkdir(current);
   } catch (e) {}
   parent = current;
  }
  return current;
 }),
 createFile: (function(parent, name, properties, canRead, canWrite) {
  var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
  var mode = FS.getMode(canRead, canWrite);
  return FS.create(path, mode);
 }),
 createDataFile: (function(parent, name, data, canRead, canWrite, canOwn) {
  var path = name ? PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name) : parent;
  var mode = FS.getMode(canRead, canWrite);
  var node = FS.create(path, mode);
  if (data) {
   if (typeof data === "string") {
    var arr = new Array(data.length);
    for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
    data = arr;
   }
   FS.chmod(node, mode | 146);
   var stream = FS.open(node, "w");
   FS.write(stream, data, 0, data.length, 0, canOwn);
   FS.close(stream);
   FS.chmod(node, mode);
  }
  return node;
 }),
 createDevice: (function(parent, name, input, output) {
  var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
  var mode = FS.getMode(!!input, !!output);
  if (!FS.createDevice.major) FS.createDevice.major = 64;
  var dev = FS.makedev(FS.createDevice.major++, 0);
  FS.registerDevice(dev, {
   open: (function(stream) {
    stream.seekable = false;
   }),
   close: (function(stream) {
    if (output && output.buffer && output.buffer.length) {
     output(10);
    }
   }),
   read: (function(stream, buffer, offset, length, pos) {
    var bytesRead = 0;
    for (var i = 0; i < length; i++) {
     var result;
     try {
      result = input();
     } catch (e) {
      throw new FS.ErrnoError(ERRNO_CODES.EIO);
     }
     if (result === undefined && bytesRead === 0) {
      throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
     }
     if (result === null || result === undefined) break;
     bytesRead++;
     buffer[offset + i] = result;
    }
    if (bytesRead) {
     stream.node.timestamp = Date.now();
    }
    return bytesRead;
   }),
   write: (function(stream, buffer, offset, length, pos) {
    for (var i = 0; i < length; i++) {
     try {
      output(buffer[offset + i]);
     } catch (e) {
      throw new FS.ErrnoError(ERRNO_CODES.EIO);
     }
    }
    if (length) {
     stream.node.timestamp = Date.now();
    }
    return i;
   })
  });
  return FS.mkdev(path, mode, dev);
 }),
 createLink: (function(parent, name, target, canRead, canWrite) {
  var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
  return FS.symlink(target, path);
 }),
 forceLoadFile: (function(obj) {
  if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
  var success = true;
  if (typeof XMLHttpRequest !== "undefined") {
   throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
  } else if (Module["read"]) {
   try {
    obj.contents = intArrayFromString(Module["read"](obj.url), true);
    obj.usedBytes = obj.contents.length;
   } catch (e) {
    success = false;
   }
  } else {
   throw new Error("Cannot load without read() or XMLHttpRequest.");
  }
  if (!success) ___setErrNo(ERRNO_CODES.EIO);
  return success;
 }),
 createLazyFile: (function(parent, name, url, canRead, canWrite) {
  function LazyUint8Array() {
   this.lengthKnown = false;
   this.chunks = [];
  }
  LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
   if (idx > this.length - 1 || idx < 0) {
    return undefined;
   }
   var chunkOffset = idx % this.chunkSize;
   var chunkNum = Math.floor(idx / this.chunkSize);
   return this.getter(chunkNum)[chunkOffset];
  };
  LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
   this.getter = getter;
  };
  LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
   var xhr = new XMLHttpRequest;
   xhr.open("HEAD", url, false);
   xhr.send(null);
   if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
   var datalength = Number(xhr.getResponseHeader("Content-length"));
   var header;
   var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
   var chunkSize = 1024 * 1024;
   if (!hasByteServing) chunkSize = datalength;
   var doXHR = (function(from, to) {
    if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
    if (to > datalength - 1) throw new Error("only " + datalength + " bytes available! programmer error!");
    var xhr = new XMLHttpRequest;
    xhr.open("GET", url, false);
    if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
    if (typeof Uint8Array != "undefined") xhr.responseType = "arraybuffer";
    if (xhr.overrideMimeType) {
     xhr.overrideMimeType("text/plain; charset=x-user-defined");
    }
    xhr.send(null);
    if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
    if (xhr.response !== undefined) {
     return new Uint8Array(xhr.response || []);
    } else {
     return intArrayFromString(xhr.responseText || "", true);
    }
   });
   var lazyArray = this;
   lazyArray.setDataGetter((function(chunkNum) {
    var start = chunkNum * chunkSize;
    var end = (chunkNum + 1) * chunkSize - 1;
    end = Math.min(end, datalength - 1);
    if (typeof lazyArray.chunks[chunkNum] === "undefined") {
     lazyArray.chunks[chunkNum] = doXHR(start, end);
    }
    if (typeof lazyArray.chunks[chunkNum] === "undefined") throw new Error("doXHR failed!");
    return lazyArray.chunks[chunkNum];
   }));
   this._length = datalength;
   this._chunkSize = chunkSize;
   this.lengthKnown = true;
  };
  if (typeof XMLHttpRequest !== "undefined") {
   if (!ENVIRONMENT_IS_WORKER) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
   var lazyArray = new LazyUint8Array;
   Object.defineProperty(lazyArray, "length", {
    get: (function() {
     if (!this.lengthKnown) {
      this.cacheLength();
     }
     return this._length;
    })
   });
   Object.defineProperty(lazyArray, "chunkSize", {
    get: (function() {
     if (!this.lengthKnown) {
      this.cacheLength();
     }
     return this._chunkSize;
    })
   });
   var properties = {
    isDevice: false,
    contents: lazyArray
   };
  } else {
   var properties = {
    isDevice: false,
    url: url
   };
  }
  var node = FS.createFile(parent, name, properties, canRead, canWrite);
  if (properties.contents) {
   node.contents = properties.contents;
  } else if (properties.url) {
   node.contents = null;
   node.url = properties.url;
  }
  Object.defineProperty(node, "usedBytes", {
   get: (function() {
    return this.contents.length;
   })
  });
  var stream_ops = {};
  var keys = Object.keys(node.stream_ops);
  keys.forEach((function(key) {
   var fn = node.stream_ops[key];
   stream_ops[key] = function forceLoadLazyFile() {
    if (!FS.forceLoadFile(node)) {
     throw new FS.ErrnoError(ERRNO_CODES.EIO);
    }
    return fn.apply(null, arguments);
   };
  }));
  stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
   if (!FS.forceLoadFile(node)) {
    throw new FS.ErrnoError(ERRNO_CODES.EIO);
   }
   var contents = stream.node.contents;
   if (position >= contents.length) return 0;
   var size = Math.min(contents.length - position, length);
   assert(size >= 0);
   if (contents.slice) {
    for (var i = 0; i < size; i++) {
     buffer[offset + i] = contents[position + i];
    }
   } else {
    for (var i = 0; i < size; i++) {
     buffer[offset + i] = contents.get(position + i);
    }
   }
   return size;
  };
  node.stream_ops = stream_ops;
  return node;
 }),
 createPreloadedFile: (function(parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
  Browser.init();
  var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
  function processData(byteArray) {
   function finish(byteArray) {
    if (!dontCreateFile) {
     FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
    }
    if (onload) onload();
    removeRunDependency("cp " + fullname);
   }
   var handled = false;
   Module["preloadPlugins"].forEach((function(plugin) {
    if (handled) return;
    if (plugin["canHandle"](fullname)) {
     plugin["handle"](byteArray, fullname, finish, (function() {
      if (onerror) onerror();
      removeRunDependency("cp " + fullname);
     }));
     handled = true;
    }
   }));
   if (!handled) finish(byteArray);
  }
  addRunDependency("cp " + fullname);
  if (typeof url == "string") {
   Browser.asyncLoad(url, (function(byteArray) {
    processData(byteArray);
   }), onerror);
  } else {
   processData(url);
  }
 }),
 indexedDB: (function() {
  return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
 }),
 DB_NAME: (function() {
  return "EM_FS_" + window.location.pathname;
 }),
 DB_VERSION: 20,
 DB_STORE_NAME: "FILE_DATA",
 saveFilesToDB: (function(paths, onload, onerror) {
  onload = onload || (function() {});
  onerror = onerror || (function() {});
  var indexedDB = FS.indexedDB();
  try {
   var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
  } catch (e) {
   return onerror(e);
  }
  openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
   console.log("creating db");
   var db = openRequest.result;
   db.createObjectStore(FS.DB_STORE_NAME);
  };
  openRequest.onsuccess = function openRequest_onsuccess() {
   var db = openRequest.result;
   var transaction = db.transaction([ FS.DB_STORE_NAME ], "readwrite");
   var files = transaction.objectStore(FS.DB_STORE_NAME);
   var ok = 0, fail = 0, total = paths.length;
   function finish() {
    if (fail == 0) onload(); else onerror();
   }
   paths.forEach((function(path) {
    var putRequest = files.put(FS.analyzePath(path).object.contents, path);
    putRequest.onsuccess = function putRequest_onsuccess() {
     ok++;
     if (ok + fail == total) finish();
    };
    putRequest.onerror = function putRequest_onerror() {
     fail++;
     if (ok + fail == total) finish();
    };
   }));
   transaction.onerror = onerror;
  };
  openRequest.onerror = onerror;
 }),
 loadFilesFromDB: (function(paths, onload, onerror) {
  onload = onload || (function() {});
  onerror = onerror || (function() {});
  var indexedDB = FS.indexedDB();
  try {
   var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
  } catch (e) {
   return onerror(e);
  }
  openRequest.onupgradeneeded = onerror;
  openRequest.onsuccess = function openRequest_onsuccess() {
   var db = openRequest.result;
   try {
    var transaction = db.transaction([ FS.DB_STORE_NAME ], "readonly");
   } catch (e) {
    onerror(e);
    return;
   }
   var files = transaction.objectStore(FS.DB_STORE_NAME);
   var ok = 0, fail = 0, total = paths.length;
   function finish() {
    if (fail == 0) onload(); else onerror();
   }
   paths.forEach((function(path) {
    var getRequest = files.get(path);
    getRequest.onsuccess = function getRequest_onsuccess() {
     if (FS.analyzePath(path).exists) {
      FS.unlink(path);
     }
     FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
     ok++;
     if (ok + fail == total) finish();
    };
    getRequest.onerror = function getRequest_onerror() {
     fail++;
     if (ok + fail == total) finish();
    };
   }));
   transaction.onerror = onerror;
  };
  openRequest.onerror = onerror;
 })
};
function _mkport() {
 throw "TODO";
}
var SOCKFS = {
 mount: (function(mount) {
  return FS.createNode(null, "/", 16384 | 511, 0);
 }),
 createSocket: (function(family, type, protocol) {
  var streaming = type == 1;
  if (protocol) {
   assert(streaming == (protocol == 6));
  }
  var sock = {
   family: family,
   type: type,
   protocol: protocol,
   server: null,
   peers: {},
   pending: [],
   recv_queue: [],
   sock_ops: SOCKFS.websocket_sock_ops
  };
  var name = SOCKFS.nextname();
  var node = FS.createNode(SOCKFS.root, name, 49152, 0);
  node.sock = sock;
  var stream = FS.createStream({
   path: name,
   node: node,
   flags: FS.modeStringToFlags("r+"),
   seekable: false,
   stream_ops: SOCKFS.stream_ops
  });
  sock.stream = stream;
  return sock;
 }),
 getSocket: (function(fd) {
  var stream = FS.getStream(fd);
  if (!stream || !FS.isSocket(stream.node.mode)) {
   return null;
  }
  return stream.node.sock;
 }),
 stream_ops: {
  poll: (function(stream) {
   var sock = stream.node.sock;
   return sock.sock_ops.poll(sock);
  }),
  ioctl: (function(stream, request, varargs) {
   var sock = stream.node.sock;
   return sock.sock_ops.ioctl(sock, request, varargs);
  }),
  read: (function(stream, buffer, offset, length, position) {
   var sock = stream.node.sock;
   var msg = sock.sock_ops.recvmsg(sock, length);
   if (!msg) {
    return 0;
   }
   buffer.set(msg.buffer, offset);
   return msg.buffer.length;
  }),
  write: (function(stream, buffer, offset, length, position) {
   var sock = stream.node.sock;
   return sock.sock_ops.sendmsg(sock, buffer, offset, length);
  }),
  close: (function(stream) {
   var sock = stream.node.sock;
   sock.sock_ops.close(sock);
  })
 },
 nextname: (function() {
  if (!SOCKFS.nextname.current) {
   SOCKFS.nextname.current = 0;
  }
  return "socket[" + SOCKFS.nextname.current++ + "]";
 }),
 websocket_sock_ops: {
  createPeer: (function(sock, addr, port) {
   var ws;
   if (typeof addr === "object") {
    ws = addr;
    addr = null;
    port = null;
   }
   if (ws) {
    if (ws._socket) {
     addr = ws._socket.remoteAddress;
     port = ws._socket.remotePort;
    } else {
     var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
     if (!result) {
      throw new Error("WebSocket URL must be in the format ws(s)://address:port");
     }
     addr = result[1];
     port = parseInt(result[2], 10);
    }
   } else {
    try {
     var runtimeConfig = Module["websocket"] && "object" === typeof Module["websocket"];
     var url = "ws:#".replace("#", "//");
     if (runtimeConfig) {
      if ("string" === typeof Module["websocket"]["url"]) {
       url = Module["websocket"]["url"];
      }
     }
     if (url === "ws://" || url === "wss://") {
      url = url + addr + ":" + port;
     }
     var subProtocols = "binary";
     if (runtimeConfig) {
      if ("string" === typeof Module["websocket"]["subprotocol"]) {
       subProtocols = Module["websocket"]["subprotocol"];
      }
     }
     subProtocols = subProtocols.replace(/^ +| +$/g, "").split(/ *, */);
     var opts = ENVIRONMENT_IS_NODE ? {
      "protocol": subProtocols.toString()
     } : subProtocols;
     var WebSocket = ENVIRONMENT_IS_NODE ? require("ws") : window["WebSocket"];
     ws = new WebSocket(url, opts);
     ws.binaryType = "arraybuffer";
    } catch (e) {
     throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
    }
   }
   var peer = {
    addr: addr,
    port: port,
    socket: ws,
    dgram_send_queue: []
   };
   SOCKFS.websocket_sock_ops.addPeer(sock, peer);
   SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
   if (sock.type === 2 && typeof sock.sport !== "undefined") {
    peer.dgram_send_queue.push(new Uint8Array([ 255, 255, 255, 255, "p".charCodeAt(0), "o".charCodeAt(0), "r".charCodeAt(0), "t".charCodeAt(0), (sock.sport & 65280) >> 8, sock.sport & 255 ]));
   }
   return peer;
  }),
  getPeer: (function(sock, addr, port) {
   return sock.peers[addr + ":" + port];
  }),
  addPeer: (function(sock, peer) {
   sock.peers[peer.addr + ":" + peer.port] = peer;
  }),
  removePeer: (function(sock, peer) {
   delete sock.peers[peer.addr + ":" + peer.port];
  }),
  handlePeerEvents: (function(sock, peer) {
   var first = true;
   var handleOpen = (function() {
    try {
     var queued = peer.dgram_send_queue.shift();
     while (queued) {
      peer.socket.send(queued);
      queued = peer.dgram_send_queue.shift();
     }
    } catch (e) {
     peer.socket.close();
    }
   });
   function handleMessage(data) {
    assert(typeof data !== "string" && data.byteLength !== undefined);
    data = new Uint8Array(data);
    var wasfirst = first;
    first = false;
    if (wasfirst && data.length === 10 && data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 && data[4] === "p".charCodeAt(0) && data[5] === "o".charCodeAt(0) && data[6] === "r".charCodeAt(0) && data[7] === "t".charCodeAt(0)) {
     var newport = data[8] << 8 | data[9];
     SOCKFS.websocket_sock_ops.removePeer(sock, peer);
     peer.port = newport;
     SOCKFS.websocket_sock_ops.addPeer(sock, peer);
     return;
    }
    sock.recv_queue.push({
     addr: peer.addr,
     port: peer.port,
     data: data
    });
   }
   if (ENVIRONMENT_IS_NODE) {
    peer.socket.on("open", handleOpen);
    peer.socket.on("message", (function(data, flags) {
     if (!flags.binary) {
      return;
     }
     handleMessage((new Uint8Array(data)).buffer);
    }));
    peer.socket.on("error", (function() {}));
   } else {
    peer.socket.onopen = handleOpen;
    peer.socket.onmessage = function peer_socket_onmessage(event) {
     handleMessage(event.data);
    };
   }
  }),
  poll: (function(sock) {
   if (sock.type === 1 && sock.server) {
    return sock.pending.length ? 64 | 1 : 0;
   }
   var mask = 0;
   var dest = sock.type === 1 ? SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) : null;
   if (sock.recv_queue.length || !dest || dest && dest.socket.readyState === dest.socket.CLOSING || dest && dest.socket.readyState === dest.socket.CLOSED) {
    mask |= 64 | 1;
   }
   if (!dest || dest && dest.socket.readyState === dest.socket.OPEN) {
    mask |= 4;
   }
   if (dest && dest.socket.readyState === dest.socket.CLOSING || dest && dest.socket.readyState === dest.socket.CLOSED) {
    mask |= 16;
   }
   return mask;
  }),
  ioctl: (function(sock, request, arg) {
   switch (request) {
   case 21531:
    var bytes = 0;
    if (sock.recv_queue.length) {
     bytes = sock.recv_queue[0].data.length;
    }
    HEAP32[arg >> 2] = bytes;
    return 0;
   default:
    return ERRNO_CODES.EINVAL;
   }
  }),
  close: (function(sock) {
   if (sock.server) {
    try {
     sock.server.close();
    } catch (e) {}
    sock.server = null;
   }
   var peers = Object.keys(sock.peers);
   for (var i = 0; i < peers.length; i++) {
    var peer = sock.peers[peers[i]];
    try {
     peer.socket.close();
    } catch (e) {}
    SOCKFS.websocket_sock_ops.removePeer(sock, peer);
   }
   return 0;
  }),
  bind: (function(sock, addr, port) {
   if (typeof sock.saddr !== "undefined" || typeof sock.sport !== "undefined") {
    throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
   }
   sock.saddr = addr;
   sock.sport = port || _mkport();
   if (sock.type === 2) {
    if (sock.server) {
     sock.server.close();
     sock.server = null;
    }
    try {
     sock.sock_ops.listen(sock, 0);
    } catch (e) {
     if (!(e instanceof FS.ErrnoError)) throw e;
     if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
    }
   }
  }),
  connect: (function(sock, addr, port) {
   if (sock.server) {
    throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
   }
   if (typeof sock.daddr !== "undefined" && typeof sock.dport !== "undefined") {
    var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
    if (dest) {
     if (dest.socket.readyState === dest.socket.CONNECTING) {
      throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
     } else {
      throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
     }
    }
   }
   var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
   sock.daddr = peer.addr;
   sock.dport = peer.port;
   throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
  }),
  listen: (function(sock, backlog) {
   if (!ENVIRONMENT_IS_NODE) {
    throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
   }
   if (sock.server) {
    throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
   }
   var WebSocketServer = require("ws").Server;
   var host = sock.saddr;
   sock.server = new WebSocketServer({
    host: host,
    port: sock.sport
   });
   sock.server.on("connection", (function(ws) {
    if (sock.type === 1) {
     var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
     var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
     newsock.daddr = peer.addr;
     newsock.dport = peer.port;
     sock.pending.push(newsock);
    } else {
     SOCKFS.websocket_sock_ops.createPeer(sock, ws);
    }
   }));
   sock.server.on("closed", (function() {
    sock.server = null;
   }));
   sock.server.on("error", (function() {}));
  }),
  accept: (function(listensock) {
   if (!listensock.server) {
    throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
   }
   var newsock = listensock.pending.shift();
   newsock.stream.flags = listensock.stream.flags;
   return newsock;
  }),
  getname: (function(sock, peer) {
   var addr, port;
   if (peer) {
    if (sock.daddr === undefined || sock.dport === undefined) {
     throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
    }
    addr = sock.daddr;
    port = sock.dport;
   } else {
    addr = sock.saddr || 0;
    port = sock.sport || 0;
   }
   return {
    addr: addr,
    port: port
   };
  }),
  sendmsg: (function(sock, buffer, offset, length, addr, port) {
   if (sock.type === 2) {
    if (addr === undefined || port === undefined) {
     addr = sock.daddr;
     port = sock.dport;
    }
    if (addr === undefined || port === undefined) {
     throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
    }
   } else {
    addr = sock.daddr;
    port = sock.dport;
   }
   var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
   if (sock.type === 1) {
    if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
     throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
    } else if (dest.socket.readyState === dest.socket.CONNECTING) {
     throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
    }
   }
   var data;
   if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
    data = buffer.slice(offset, offset + length);
   } else {
    data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
   }
   if (sock.type === 2) {
    if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
     if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
      dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
     }
     dest.dgram_send_queue.push(data);
     return length;
    }
   }
   try {
    dest.socket.send(data);
    return length;
   } catch (e) {
    throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
   }
  }),
  recvmsg: (function(sock, length) {
   if (sock.type === 1 && sock.server) {
    throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
   }
   var queued = sock.recv_queue.shift();
   if (!queued) {
    if (sock.type === 1) {
     var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
     if (!dest) {
      throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
     } else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
      return null;
     } else {
      throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
     }
    } else {
     throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
    }
   }
   var queuedLength = queued.data.byteLength || queued.data.length;
   var queuedOffset = queued.data.byteOffset || 0;
   var queuedBuffer = queued.data.buffer || queued.data;
   var bytesRead = Math.min(length, queuedLength);
   var res = {
    buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
    addr: queued.addr,
    port: queued.port
   };
   if (sock.type === 1 && bytesRead < queuedLength) {
    var bytesRemaining = queuedLength - bytesRead;
    queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
    sock.recv_queue.unshift(queued);
   }
   return res;
  })
 }
};
function _send(fd, buf, len, flags) {
 var sock = SOCKFS.getSocket(fd);
 if (!sock) {
  ___setErrNo(ERRNO_CODES.EBADF);
  return -1;
 }
 return _write(fd, buf, len);
}
function _pwrite(fildes, buf, nbyte, offset) {
 var stream = FS.getStream(fildes);
 if (!stream) {
  ___setErrNo(ERRNO_CODES.EBADF);
  return -1;
 }
 try {
  var slab = HEAP8;
  return FS.write(stream, slab, buf, nbyte, offset);
 } catch (e) {
  FS.handleFSError(e);
  return -1;
 }
}
function _write(fildes, buf, nbyte) {
 var stream = FS.getStream(fildes);
 if (!stream) {
  ___setErrNo(ERRNO_CODES.EBADF);
  return -1;
 }
 try {
  var slab = HEAP8;
  return FS.write(stream, slab, buf, nbyte);
 } catch (e) {
  FS.handleFSError(e);
  return -1;
 }
}
function _fileno(stream) {
 stream = FS.getStreamFromPtr(stream);
 if (!stream) return -1;
 return stream.fd;
}
function _fwrite(ptr, size, nitems, stream) {
 var bytesToWrite = nitems * size;
 if (bytesToWrite == 0) return 0;
 var fd = _fileno(stream);
 var bytesWritten = _write(fd, ptr, bytesToWrite);
 if (bytesWritten == -1) {
  var streamObj = FS.getStreamFromPtr(stream);
  if (streamObj) streamObj.error = true;
  return 0;
 } else {
  return Math.floor(bytesWritten / size);
 }
}
Module["_strlen"] = _strlen;
function __reallyNegative(x) {
 return x < 0 || x === 0 && 1 / x === -Infinity;
}
function __formatString(format, varargs) {
 var textIndex = format;
 var argIndex = 0;
 function getNextArg(type) {
  var ret;
  if (type === "double") {
   ret = (HEAP32[tempDoublePtr >> 2] = HEAP32[varargs + argIndex >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[varargs + (argIndex + 4) >> 2], +HEAPF64[tempDoublePtr >> 3]);
  } else if (type == "i64") {
   ret = [ HEAP32[varargs + argIndex >> 2], HEAP32[varargs + (argIndex + 4) >> 2] ];
  } else {
   type = "i32";
   ret = HEAP32[varargs + argIndex >> 2];
  }
  argIndex += Runtime.getNativeFieldSize(type);
  return ret;
 }
 var ret = [];
 var curr, next, currArg;
 while (1) {
  var startTextIndex = textIndex;
  curr = HEAP8[textIndex >> 0];
  if (curr === 0) break;
  next = HEAP8[textIndex + 1 >> 0];
  if (curr == 37) {
   var flagAlwaysSigned = false;
   var flagLeftAlign = false;
   var flagAlternative = false;
   var flagZeroPad = false;
   var flagPadSign = false;
   flagsLoop : while (1) {
    switch (next) {
    case 43:
     flagAlwaysSigned = true;
     break;
    case 45:
     flagLeftAlign = true;
     break;
    case 35:
     flagAlternative = true;
     break;
    case 48:
     if (flagZeroPad) {
      break flagsLoop;
     } else {
      flagZeroPad = true;
      break;
     }
    case 32:
     flagPadSign = true;
     break;
    default:
     break flagsLoop;
    }
    textIndex++;
    next = HEAP8[textIndex + 1 >> 0];
   }
   var width = 0;
   if (next == 42) {
    width = getNextArg("i32");
    textIndex++;
    next = HEAP8[textIndex + 1 >> 0];
   } else {
    while (next >= 48 && next <= 57) {
     width = width * 10 + (next - 48);
     textIndex++;
     next = HEAP8[textIndex + 1 >> 0];
    }
   }
   var precisionSet = false, precision = -1;
   if (next == 46) {
    precision = 0;
    precisionSet = true;
    textIndex++;
    next = HEAP8[textIndex + 1 >> 0];
    if (next == 42) {
     precision = getNextArg("i32");
     textIndex++;
    } else {
     while (1) {
      var precisionChr = HEAP8[textIndex + 1 >> 0];
      if (precisionChr < 48 || precisionChr > 57) break;
      precision = precision * 10 + (precisionChr - 48);
      textIndex++;
     }
    }
    next = HEAP8[textIndex + 1 >> 0];
   }
   if (precision < 0) {
    precision = 6;
    precisionSet = false;
   }
   var argSize;
   switch (String.fromCharCode(next)) {
   case "h":
    var nextNext = HEAP8[textIndex + 2 >> 0];
    if (nextNext == 104) {
     textIndex++;
     argSize = 1;
    } else {
     argSize = 2;
    }
    break;
   case "l":
    var nextNext = HEAP8[textIndex + 2 >> 0];
    if (nextNext == 108) {
     textIndex++;
     argSize = 8;
    } else {
     argSize = 4;
    }
    break;
   case "L":
   case "q":
   case "j":
    argSize = 8;
    break;
   case "z":
   case "t":
   case "I":
    argSize = 4;
    break;
   default:
    argSize = null;
   }
   if (argSize) textIndex++;
   next = HEAP8[textIndex + 1 >> 0];
   switch (String.fromCharCode(next)) {
   case "d":
   case "i":
   case "u":
   case "o":
   case "x":
   case "X":
   case "p":
    {
     var signed = next == 100 || next == 105;
     argSize = argSize || 4;
     var currArg = getNextArg("i" + argSize * 8);
     var origArg = currArg;
     var argText;
     if (argSize == 8) {
      currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
     }
     if (argSize <= 4) {
      var limit = Math.pow(256, argSize) - 1;
      currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
     }
     var currAbsArg = Math.abs(currArg);
     var prefix = "";
     if (next == 100 || next == 105) {
      if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else argText = reSign(currArg, 8 * argSize, 1).toString(10);
     } else if (next == 117) {
      if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else argText = unSign(currArg, 8 * argSize, 1).toString(10);
      currArg = Math.abs(currArg);
     } else if (next == 111) {
      argText = (flagAlternative ? "0" : "") + currAbsArg.toString(8);
     } else if (next == 120 || next == 88) {
      prefix = flagAlternative && currArg != 0 ? "0x" : "";
      if (argSize == 8 && i64Math) {
       if (origArg[1]) {
        argText = (origArg[1] >>> 0).toString(16);
        var lower = (origArg[0] >>> 0).toString(16);
        while (lower.length < 8) lower = "0" + lower;
        argText += lower;
       } else {
        argText = (origArg[0] >>> 0).toString(16);
       }
      } else if (currArg < 0) {
       currArg = -currArg;
       argText = (currAbsArg - 1).toString(16);
       var buffer = [];
       for (var i = 0; i < argText.length; i++) {
        buffer.push((15 - parseInt(argText[i], 16)).toString(16));
       }
       argText = buffer.join("");
       while (argText.length < argSize * 2) argText = "f" + argText;
      } else {
       argText = currAbsArg.toString(16);
      }
      if (next == 88) {
       prefix = prefix.toUpperCase();
       argText = argText.toUpperCase();
      }
     } else if (next == 112) {
      if (currAbsArg === 0) {
       argText = "(nil)";
      } else {
       prefix = "0x";
       argText = currAbsArg.toString(16);
      }
     }
     if (precisionSet) {
      while (argText.length < precision) {
       argText = "0" + argText;
      }
     }
     if (currArg >= 0) {
      if (flagAlwaysSigned) {
       prefix = "+" + prefix;
      } else if (flagPadSign) {
       prefix = " " + prefix;
      }
     }
     if (argText.charAt(0) == "-") {
      prefix = "-" + prefix;
      argText = argText.substr(1);
     }
     while (prefix.length + argText.length < width) {
      if (flagLeftAlign) {
       argText += " ";
      } else {
       if (flagZeroPad) {
        argText = "0" + argText;
       } else {
        prefix = " " + prefix;
       }
      }
     }
     argText = prefix + argText;
     argText.split("").forEach((function(chr) {
      ret.push(chr.charCodeAt(0));
     }));
     break;
    }
   case "f":
   case "F":
   case "e":
   case "E":
   case "g":
   case "G":
    {
     var currArg = getNextArg("double");
     var argText;
     if (isNaN(currArg)) {
      argText = "nan";
      flagZeroPad = false;
     } else if (!isFinite(currArg)) {
      argText = (currArg < 0 ? "-" : "") + "inf";
      flagZeroPad = false;
     } else {
      var isGeneral = false;
      var effectivePrecision = Math.min(precision, 20);
      if (next == 103 || next == 71) {
       isGeneral = true;
       precision = precision || 1;
       var exponent = parseInt(currArg.toExponential(effectivePrecision).split("e")[1], 10);
       if (precision > exponent && exponent >= -4) {
        next = (next == 103 ? "f" : "F").charCodeAt(0);
        precision -= exponent + 1;
       } else {
        next = (next == 103 ? "e" : "E").charCodeAt(0);
        precision--;
       }
       effectivePrecision = Math.min(precision, 20);
      }
      if (next == 101 || next == 69) {
       argText = currArg.toExponential(effectivePrecision);
       if (/[eE][-+]\d$/.test(argText)) {
        argText = argText.slice(0, -1) + "0" + argText.slice(-1);
       }
      } else if (next == 102 || next == 70) {
       argText = currArg.toFixed(effectivePrecision);
       if (currArg === 0 && __reallyNegative(currArg)) {
        argText = "-" + argText;
       }
      }
      var parts = argText.split("e");
      if (isGeneral && !flagAlternative) {
       while (parts[0].length > 1 && parts[0].indexOf(".") != -1 && (parts[0].slice(-1) == "0" || parts[0].slice(-1) == ".")) {
        parts[0] = parts[0].slice(0, -1);
       }
      } else {
       if (flagAlternative && argText.indexOf(".") == -1) parts[0] += ".";
       while (precision > effectivePrecision++) parts[0] += "0";
      }
      argText = parts[0] + (parts.length > 1 ? "e" + parts[1] : "");
      if (next == 69) argText = argText.toUpperCase();
      if (currArg >= 0) {
       if (flagAlwaysSigned) {
        argText = "+" + argText;
       } else if (flagPadSign) {
        argText = " " + argText;
       }
      }
     }
     while (argText.length < width) {
      if (flagLeftAlign) {
       argText += " ";
      } else {
       if (flagZeroPad && (argText[0] == "-" || argText[0] == "+")) {
        argText = argText[0] + "0" + argText.slice(1);
       } else {
        argText = (flagZeroPad ? "0" : " ") + argText;
       }
      }
     }
     if (next < 97) argText = argText.toUpperCase();
     argText.split("").forEach((function(chr) {
      ret.push(chr.charCodeAt(0));
     }));
     break;
    }
   case "s":
    {
     var arg = getNextArg("i8*");
     var argLength = arg ? _strlen(arg) : "(null)".length;
     if (precisionSet) argLength = Math.min(argLength, precision);
     if (!flagLeftAlign) {
      while (argLength < width--) {
       ret.push(32);
      }
     }
     if (arg) {
      for (var i = 0; i < argLength; i++) {
       ret.push(HEAPU8[arg++ >> 0]);
      }
     } else {
      ret = ret.concat(intArrayFromString("(null)".substr(0, argLength), true));
     }
     if (flagLeftAlign) {
      while (argLength < width--) {
       ret.push(32);
      }
     }
     break;
    }
   case "c":
    {
     if (flagLeftAlign) ret.push(getNextArg("i8"));
     while (--width > 0) {
      ret.push(32);
     }
     if (!flagLeftAlign) ret.push(getNextArg("i8"));
     break;
    }
   case "n":
    {
     var ptr = getNextArg("i32*");
     HEAP32[ptr >> 2] = ret.length;
     break;
    }
   case "%":
    {
     ret.push(curr);
     break;
    }
   default:
    {
     for (var i = startTextIndex; i < textIndex + 2; i++) {
      ret.push(HEAP8[i >> 0]);
     }
    }
   }
   textIndex += 2;
  } else {
   ret.push(curr);
   textIndex += 1;
  }
 }
 return ret;
}
function _fprintf(stream, format, varargs) {
 var result = __formatString(format, varargs);
 var stack = Runtime.stackSave();
 var ret = _fwrite(allocate(result, "i8", ALLOC_STACK), 1, result.length, stream);
 Runtime.stackRestore(stack);
 return ret;
}
function _printf(format, varargs) {
 var stdout = HEAP32[_stdout >> 2];
 return _fprintf(stdout, format, varargs);
}
function _aaweb_get_width() {
 return aaweb.cols;
}
function _emscripten_memcpy_big(dest, src, num) {
 HEAPU8.set(HEAPU8.subarray(src, src + num), dest);
 return dest;
}
Module["_memcpy"] = _memcpy;
function _aaweb_setattr(attr) {
 aaweb.attr = attr;
}
function _aaweb_print(p) {
 p = Pointer_stringify(p);
 var x = aaweb.x * aaweb.char_width;
 var y = aaweb.y * aaweb.char_height;
 var w = p.length * aaweb.char_width;
 var ctx = aaweb.ctx;
 var attr = aaweb.attr;
 ctx.fillStyle = attr & aaweb.MASK_REVERSE ? aaweb.fg_color : aaweb.bg_color;
 ctx.fillRect(x, y, w, aaweb.char_height);
 ctx.fillStyle = attr & aaweb.MASK_DIM ? aaweb.dim_color : attr & aaweb.MASK_REVERSE ? aaweb.bg_color : aaweb.fg_color;
 ctx.font = aaweb.attr & (aaweb.MASK_BOLD | aaweb.MASK_BOLDFONT) ? aaweb.bold_font_str : aaweb.font_str;
 ctx.fillText(p, x, y + aaweb.char_height, w);
 aaweb.x += p.length;
}
var _llvm_pow_f64 = Math_pow;
function _fputs(s, stream) {
 var fd = _fileno(stream);
 return _write(fd, s, _strlen(s));
}
function _fputc(c, stream) {
 var chr = unSign(c & 255);
 HEAP8[_fputc.ret >> 0] = chr;
 var fd = _fileno(stream);
 var ret = _write(fd, _fputc.ret, 1);
 if (ret == -1) {
  var streamObj = FS.getStreamFromPtr(stream);
  if (streamObj) streamObj.error = true;
  return -1;
 } else {
  return chr;
 }
}
function _puts(s) {
 var stdout = HEAP32[_stdout >> 2];
 var ret = _fputs(s, stdout);
 if (ret < 0) {
  return ret;
 } else {
  var newlineRet = _fputc(10, stdout);
  return newlineRet < 0 ? -1 : ret + 1;
 }
}
function ___errno_location() {
 return ___errno_state;
}
var Browser = {
 mainLoop: {
  scheduler: null,
  method: "",
  shouldPause: false,
  paused: false,
  queue: [],
  pause: (function() {
   Browser.mainLoop.shouldPause = true;
  }),
  resume: (function() {
   if (Browser.mainLoop.paused) {
    Browser.mainLoop.paused = false;
    Browser.mainLoop.scheduler();
   }
   Browser.mainLoop.shouldPause = false;
  }),
  updateStatus: (function() {
   if (Module["setStatus"]) {
    var message = Module["statusMessage"] || "Please wait...";
    var remaining = Browser.mainLoop.remainingBlockers;
    var expected = Browser.mainLoop.expectedBlockers;
    if (remaining) {
     if (remaining < expected) {
      Module["setStatus"](message + " (" + (expected - remaining) + "/" + expected + ")");
     } else {
      Module["setStatus"](message);
     }
    } else {
     Module["setStatus"]("");
    }
   }
  }),
  runIter: (function(func) {
   if (ABORT) return;
   if (Module["preMainLoop"]) {
    var preRet = Module["preMainLoop"]();
    if (preRet === false) {
     return;
    }
   }
   try {
    func();
   } catch (e) {
    if (e instanceof ExitStatus) {
     return;
    } else {
     if (e && typeof e === "object" && e.stack) Module.printErr("exception thrown: " + [ e, e.stack ]);
     throw e;
    }
   }
   if (Module["postMainLoop"]) Module["postMainLoop"]();
  })
 },
 isFullScreen: false,
 pointerLock: false,
 moduleContextCreatedCallbacks: [],
 workers: [],
 init: (function() {
  if (!Module["preloadPlugins"]) Module["preloadPlugins"] = [];
  if (Browser.initted) return;
  Browser.initted = true;
  try {
   new Blob;
   Browser.hasBlobConstructor = true;
  } catch (e) {
   Browser.hasBlobConstructor = false;
   console.log("warning: no blob constructor, cannot create blobs with mimetypes");
  }
  Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : !Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null;
  Browser.URLObject = typeof window != "undefined" ? window.URL ? window.URL : window.webkitURL : undefined;
  if (!Module.noImageDecoding && typeof Browser.URLObject === "undefined") {
   console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
   Module.noImageDecoding = true;
  }
  var imagePlugin = {};
  imagePlugin["canHandle"] = function imagePlugin_canHandle(name) {
   return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
  };
  imagePlugin["handle"] = function imagePlugin_handle(byteArray, name, onload, onerror) {
   var b = null;
   if (Browser.hasBlobConstructor) {
    try {
     b = new Blob([ byteArray ], {
      type: Browser.getMimetype(name)
     });
     if (b.size !== byteArray.length) {
      b = new Blob([ (new Uint8Array(byteArray)).buffer ], {
       type: Browser.getMimetype(name)
      });
     }
    } catch (e) {
     Runtime.warnOnce("Blob constructor present but fails: " + e + "; falling back to blob builder");
    }
   }
   if (!b) {
    var bb = new Browser.BlobBuilder;
    bb.append((new Uint8Array(byteArray)).buffer);
    b = bb.getBlob();
   }
   var url = Browser.URLObject.createObjectURL(b);
   var img = new Image;
   img.onload = function img_onload() {
    assert(img.complete, "Image " + name + " could not be decoded");
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    Module["preloadedImages"][name] = canvas;
    Browser.URLObject.revokeObjectURL(url);
    if (onload) onload(byteArray);
   };
   img.onerror = function img_onerror(event) {
    console.log("Image " + url + " could not be decoded");
    if (onerror) onerror();
   };
   img.src = url;
  };
  Module["preloadPlugins"].push(imagePlugin);
  var audioPlugin = {};
  audioPlugin["canHandle"] = function audioPlugin_canHandle(name) {
   return !Module.noAudioDecoding && name.substr(-4) in {
    ".ogg": 1,
    ".wav": 1,
    ".mp3": 1
   };
  };
  audioPlugin["handle"] = function audioPlugin_handle(byteArray, name, onload, onerror) {
   var done = false;
   function finish(audio) {
    if (done) return;
    done = true;
    Module["preloadedAudios"][name] = audio;
    if (onload) onload(byteArray);
   }
   function fail() {
    if (done) return;
    done = true;
    Module["preloadedAudios"][name] = new Audio;
    if (onerror) onerror();
   }
   if (Browser.hasBlobConstructor) {
    try {
     var b = new Blob([ byteArray ], {
      type: Browser.getMimetype(name)
     });
    } catch (e) {
     return fail();
    }
    var url = Browser.URLObject.createObjectURL(b);
    var audio = new Audio;
    audio.addEventListener("canplaythrough", (function() {
     finish(audio);
    }), false);
    audio.onerror = function audio_onerror(event) {
     if (done) return;
     console.log("warning: browser could not fully decode audio " + name + ", trying slower base64 approach");
     function encode64(data) {
      var BASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      var PAD = "=";
      var ret = "";
      var leftchar = 0;
      var leftbits = 0;
      for (var i = 0; i < data.length; i++) {
       leftchar = leftchar << 8 | data[i];
       leftbits += 8;
       while (leftbits >= 6) {
        var curr = leftchar >> leftbits - 6 & 63;
        leftbits -= 6;
        ret += BASE[curr];
       }
      }
      if (leftbits == 2) {
       ret += BASE[(leftchar & 3) << 4];
       ret += PAD + PAD;
      } else if (leftbits == 4) {
       ret += BASE[(leftchar & 15) << 2];
       ret += PAD;
      }
      return ret;
     }
     audio.src = "data:audio/x-" + name.substr(-3) + ";base64," + encode64(byteArray);
     finish(audio);
    };
    audio.src = url;
    Browser.safeSetTimeout((function() {
     finish(audio);
    }), 1e4);
   } else {
    return fail();
   }
  };
  Module["preloadPlugins"].push(audioPlugin);
  var canvas = Module["canvas"];
  function pointerLockChange() {
   Browser.pointerLock = document["pointerLockElement"] === canvas || document["mozPointerLockElement"] === canvas || document["webkitPointerLockElement"] === canvas || document["msPointerLockElement"] === canvas;
  }
  if (canvas) {
   canvas.requestPointerLock = canvas["requestPointerLock"] || canvas["mozRequestPointerLock"] || canvas["webkitRequestPointerLock"] || canvas["msRequestPointerLock"] || (function() {});
   canvas.exitPointerLock = document["exitPointerLock"] || document["mozExitPointerLock"] || document["webkitExitPointerLock"] || document["msExitPointerLock"] || (function() {});
   canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
   document.addEventListener("pointerlockchange", pointerLockChange, false);
   document.addEventListener("mozpointerlockchange", pointerLockChange, false);
   document.addEventListener("webkitpointerlockchange", pointerLockChange, false);
   document.addEventListener("mspointerlockchange", pointerLockChange, false);
   if (Module["elementPointerLock"]) {
    canvas.addEventListener("click", (function(ev) {
     if (!Browser.pointerLock && canvas.requestPointerLock) {
      canvas.requestPointerLock();
      ev.preventDefault();
     }
    }), false);
   }
  }
 }),
 createContext: (function(canvas, useWebGL, setInModule, webGLContextAttributes) {
  if (useWebGL && Module.ctx) return Module.ctx;
  var ctx;
  var errorInfo = "?";
  function onContextCreationError(event) {
   errorInfo = event.statusMessage || errorInfo;
  }
  try {
   if (useWebGL) {
    var contextAttributes = {
     antialias: false,
     alpha: false
    };
    if (webGLContextAttributes) {
     for (var attribute in webGLContextAttributes) {
      contextAttributes[attribute] = webGLContextAttributes[attribute];
     }
    }
    canvas.addEventListener("webglcontextcreationerror", onContextCreationError, false);
    try {
     [ "experimental-webgl", "webgl" ].some((function(webglId) {
      return ctx = canvas.getContext(webglId, contextAttributes);
     }));
    } finally {
     canvas.removeEventListener("webglcontextcreationerror", onContextCreationError, false);
    }
   } else {
    ctx = canvas.getContext("2d");
   }
   if (!ctx) throw ":(";
  } catch (e) {
   Module.print("Could not create canvas: " + [ errorInfo, e ]);
   return null;
  }
  if (useWebGL) {
   canvas.style.backgroundColor = "black";
  }
  if (setInModule) {
   if (!useWebGL) assert(typeof GLctx === "undefined", "cannot set in module if GLctx is used, but we are a non-GL context that would replace it");
   Module.ctx = ctx;
   if (useWebGL) GLctx = ctx;
   Module.useWebGL = useWebGL;
   Browser.moduleContextCreatedCallbacks.forEach((function(callback) {
    callback();
   }));
   Browser.init();
  }
  return ctx;
 }),
 destroyContext: (function(canvas, useWebGL, setInModule) {}),
 fullScreenHandlersInstalled: false,
 lockPointer: undefined,
 resizeCanvas: undefined,
 requestFullScreen: (function(lockPointer, resizeCanvas) {
  Browser.lockPointer = lockPointer;
  Browser.resizeCanvas = resizeCanvas;
  if (typeof Browser.lockPointer === "undefined") Browser.lockPointer = true;
  if (typeof Browser.resizeCanvas === "undefined") Browser.resizeCanvas = false;
  var canvas = Module["canvas"];
  function fullScreenChange() {
   Browser.isFullScreen = false;
   var canvasContainer = canvas.parentNode;
   if ((document["webkitFullScreenElement"] || document["webkitFullscreenElement"] || document["mozFullScreenElement"] || document["mozFullscreenElement"] || document["fullScreenElement"] || document["fullscreenElement"] || document["msFullScreenElement"] || document["msFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvasContainer) {
    canvas.cancelFullScreen = document["cancelFullScreen"] || document["mozCancelFullScreen"] || document["webkitCancelFullScreen"] || document["msExitFullscreen"] || document["exitFullscreen"] || (function() {});
    canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
    if (Browser.lockPointer) canvas.requestPointerLock();
    Browser.isFullScreen = true;
    if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
   } else {
    canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
    canvasContainer.parentNode.removeChild(canvasContainer);
    if (Browser.resizeCanvas) Browser.setWindowedCanvasSize();
   }
   if (Module["onFullScreen"]) Module["onFullScreen"](Browser.isFullScreen);
   Browser.updateCanvasDimensions(canvas);
  }
  if (!Browser.fullScreenHandlersInstalled) {
   Browser.fullScreenHandlersInstalled = true;
   document.addEventListener("fullscreenchange", fullScreenChange, false);
   document.addEventListener("mozfullscreenchange", fullScreenChange, false);
   document.addEventListener("webkitfullscreenchange", fullScreenChange, false);
   document.addEventListener("MSFullscreenChange", fullScreenChange, false);
  }
  var canvasContainer = document.createElement("div");
  canvas.parentNode.insertBefore(canvasContainer, canvas);
  canvasContainer.appendChild(canvas);
  canvasContainer.requestFullScreen = canvasContainer["requestFullScreen"] || canvasContainer["mozRequestFullScreen"] || canvasContainer["msRequestFullscreen"] || (canvasContainer["webkitRequestFullScreen"] ? (function() {
   canvasContainer["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"]);
  }) : null);
  canvasContainer.requestFullScreen();
 }),
 nextRAF: 0,
 fakeRequestAnimationFrame: (function(func) {
  var now = Date.now();
  if (Browser.nextRAF === 0) {
   Browser.nextRAF = now + 1e3 / 60;
  } else {
   while (now + 2 >= Browser.nextRAF) {
    Browser.nextRAF += 1e3 / 60;
   }
  }
  var delay = Math.max(Browser.nextRAF - now, 0);
  setTimeout(func, delay);
 }),
 requestAnimationFrame: function requestAnimationFrame(func) {
  if (typeof window === "undefined") {
   Browser.fakeRequestAnimationFrame(func);
  } else {
   if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = window["requestAnimationFrame"] || window["mozRequestAnimationFrame"] || window["webkitRequestAnimationFrame"] || window["msRequestAnimationFrame"] || window["oRequestAnimationFrame"] || Browser.fakeRequestAnimationFrame;
   }
   window.requestAnimationFrame(func);
  }
 },
 safeCallback: (function(func) {
  return (function() {
   if (!ABORT) return func.apply(null, arguments);
  });
 }),
 safeRequestAnimationFrame: (function(func) {
  return Browser.requestAnimationFrame((function() {
   if (!ABORT) func();
  }));
 }),
 safeSetTimeout: (function(func, timeout) {
  Module["noExitRuntime"] = true;
  return setTimeout((function() {
   if (!ABORT) func();
  }), timeout);
 }),
 safeSetInterval: (function(func, timeout) {
  Module["noExitRuntime"] = true;
  return setInterval((function() {
   if (!ABORT) func();
  }), timeout);
 }),
 getMimetype: (function(name) {
  return {
   "jpg": "image/jpeg",
   "jpeg": "image/jpeg",
   "png": "image/png",
   "bmp": "image/bmp",
   "ogg": "audio/ogg",
   "wav": "audio/wav",
   "mp3": "audio/mpeg"
  }[name.substr(name.lastIndexOf(".") + 1)];
 }),
 getUserMedia: (function(func) {
  if (!window.getUserMedia) {
   window.getUserMedia = navigator["getUserMedia"] || navigator["mozGetUserMedia"];
  }
  window.getUserMedia(func);
 }),
 getMovementX: (function(event) {
  return event["movementX"] || event["mozMovementX"] || event["webkitMovementX"] || 0;
 }),
 getMovementY: (function(event) {
  return event["movementY"] || event["mozMovementY"] || event["webkitMovementY"] || 0;
 }),
 getMouseWheelDelta: (function(event) {
  var delta = 0;
  switch (event.type) {
  case "DOMMouseScroll":
   delta = event.detail;
   break;
  case "mousewheel":
   delta = -event.wheelDelta;
   break;
  case "wheel":
   delta = event.deltaY;
   break;
  default:
   throw "unrecognized mouse wheel event: " + event.type;
  }
  return Math.max(-1, Math.min(1, delta));
 }),
 mouseX: 0,
 mouseY: 0,
 mouseMovementX: 0,
 mouseMovementY: 0,
 touches: {},
 lastTouches: {},
 calculateMouseEvent: (function(event) {
  if (Browser.pointerLock) {
   if (event.type != "mousemove" && "mozMovementX" in event) {
    Browser.mouseMovementX = Browser.mouseMovementY = 0;
   } else {
    Browser.mouseMovementX = Browser.getMovementX(event);
    Browser.mouseMovementY = Browser.getMovementY(event);
   }
   if (typeof SDL != "undefined") {
    Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
    Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
   } else {
    Browser.mouseX += Browser.mouseMovementX;
    Browser.mouseY += Browser.mouseMovementY;
   }
  } else {
   var rect = Module["canvas"].getBoundingClientRect();
   var cw = Module["canvas"].width;
   var ch = Module["canvas"].height;
   var scrollX = typeof window.scrollX !== "undefined" ? window.scrollX : window.pageXOffset;
   var scrollY = typeof window.scrollY !== "undefined" ? window.scrollY : window.pageYOffset;
   if (event.type === "touchstart" || event.type === "touchend" || event.type === "touchmove") {
    var touch = event.touch;
    if (touch === undefined) {
     return;
    }
    var adjustedX = touch.pageX - (scrollX + rect.left);
    var adjustedY = touch.pageY - (scrollY + rect.top);
    adjustedX = adjustedX * (cw / rect.width);
    adjustedY = adjustedY * (ch / rect.height);
    var coords = {
     x: adjustedX,
     y: adjustedY
    };
    if (event.type === "touchstart") {
     Browser.lastTouches[touch.identifier] = coords;
     Browser.touches[touch.identifier] = coords;
    } else if (event.type === "touchend" || event.type === "touchmove") {
     Browser.lastTouches[touch.identifier] = Browser.touches[touch.identifier];
     Browser.touches[touch.identifier] = {
      x: adjustedX,
      y: adjustedY
     };
    }
    return;
   }
   var x = event.pageX - (scrollX + rect.left);
   var y = event.pageY - (scrollY + rect.top);
   x = x * (cw / rect.width);
   y = y * (ch / rect.height);
   Browser.mouseMovementX = x - Browser.mouseX;
   Browser.mouseMovementY = y - Browser.mouseY;
   Browser.mouseX = x;
   Browser.mouseY = y;
  }
 }),
 xhrLoad: (function(url, onload, onerror) {
  var xhr = new XMLHttpRequest;
  xhr.open("GET", url, true);
  xhr.responseType = "arraybuffer";
  xhr.onload = function xhr_onload() {
   if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
    onload(xhr.response);
   } else {
    onerror();
   }
  };
  xhr.onerror = onerror;
  xhr.send(null);
 }),
 asyncLoad: (function(url, onload, onerror, noRunDep) {
  Browser.xhrLoad(url, (function(arrayBuffer) {
   assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
   onload(new Uint8Array(arrayBuffer));
   if (!noRunDep) removeRunDependency("al " + url);
  }), (function(event) {
   if (onerror) {
    onerror();
   } else {
    throw 'Loading data file "' + url + '" failed.';
   }
  }));
  if (!noRunDep) addRunDependency("al " + url);
 }),
 resizeListeners: [],
 updateResizeListeners: (function() {
  var canvas = Module["canvas"];
  Browser.resizeListeners.forEach((function(listener) {
   listener(canvas.width, canvas.height);
  }));
 }),
 setCanvasSize: (function(width, height, noUpdates) {
  var canvas = Module["canvas"];
  Browser.updateCanvasDimensions(canvas, width, height);
  if (!noUpdates) Browser.updateResizeListeners();
 }),
 windowedWidth: 0,
 windowedHeight: 0,
 setFullScreenCanvasSize: (function() {
  if (typeof SDL != "undefined") {
   var flags = HEAPU32[SDL.screen + Runtime.QUANTUM_SIZE * 0 >> 2];
   flags = flags | 8388608;
   HEAP32[SDL.screen + Runtime.QUANTUM_SIZE * 0 >> 2] = flags;
  }
  Browser.updateResizeListeners();
 }),
 setWindowedCanvasSize: (function() {
  if (typeof SDL != "undefined") {
   var flags = HEAPU32[SDL.screen + Runtime.QUANTUM_SIZE * 0 >> 2];
   flags = flags & ~8388608;
   HEAP32[SDL.screen + Runtime.QUANTUM_SIZE * 0 >> 2] = flags;
  }
  Browser.updateResizeListeners();
 }),
 updateCanvasDimensions: (function(canvas, wNative, hNative) {
  if (wNative && hNative) {
   canvas.widthNative = wNative;
   canvas.heightNative = hNative;
  } else {
   wNative = canvas.widthNative;
   hNative = canvas.heightNative;
  }
  var w = wNative;
  var h = hNative;
  if (Module["forcedAspectRatio"] && Module["forcedAspectRatio"] > 0) {
   if (w / h < Module["forcedAspectRatio"]) {
    w = Math.round(h * Module["forcedAspectRatio"]);
   } else {
    h = Math.round(w / Module["forcedAspectRatio"]);
   }
  }
  if ((document["webkitFullScreenElement"] || document["webkitFullscreenElement"] || document["mozFullScreenElement"] || document["mozFullscreenElement"] || document["fullScreenElement"] || document["fullscreenElement"] || document["msFullScreenElement"] || document["msFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvas.parentNode && typeof screen != "undefined") {
   var factor = Math.min(screen.width / w, screen.height / h);
   w = Math.round(w * factor);
   h = Math.round(h * factor);
  }
  if (Browser.resizeCanvas) {
   if (canvas.width != w) canvas.width = w;
   if (canvas.height != h) canvas.height = h;
   if (typeof canvas.style != "undefined") {
    canvas.style.removeProperty("width");
    canvas.style.removeProperty("height");
   }
  } else {
   if (canvas.width != wNative) canvas.width = wNative;
   if (canvas.height != hNative) canvas.height = hNative;
   if (typeof canvas.style != "undefined") {
    if (w != wNative || h != hNative) {
     canvas.style.setProperty("width", w + "px", "important");
     canvas.style.setProperty("height", h + "px", "important");
    } else {
     canvas.style.removeProperty("width");
     canvas.style.removeProperty("height");
    }
   }
  }
 })
};
function _sbrk(bytes) {
 var self = _sbrk;
 if (!self.called) {
  DYNAMICTOP = alignMemoryPage(DYNAMICTOP);
  self.called = true;
  assert(Runtime.dynamicAlloc);
  self.alloc = Runtime.dynamicAlloc;
  Runtime.dynamicAlloc = (function() {
   abort("cannot dynamically allocate, sbrk now has control");
  });
 }
 var ret = DYNAMICTOP;
 if (bytes != 0) self.alloc(bytes);
 return ret;
}
function _time(ptr) {
 var ret = Math.floor(Date.now() / 1e3);
 if (ptr) {
  HEAP32[ptr >> 2] = ret;
 }
 return ret;
}
function _aaweb_get_height() {
 return aaweb.rows;
}
function __exit(status) {
 Module["exit"](status);
}
function _exit(status) {
 __exit(status);
}
___errno_state = Runtime.staticAlloc(4);
HEAP32[___errno_state >> 2] = 0;
FS.staticInit();
__ATINIT__.unshift({
 func: (function() {
  if (!Module["noFSInit"] && !FS.init.initialized) FS.init();
 })
});
__ATMAIN__.push({
 func: (function() {
  FS.ignorePermissions = false;
 })
});
__ATEXIT__.push({
 func: (function() {
  FS.quit();
 })
});
Module["FS_createFolder"] = FS.createFolder;
Module["FS_createPath"] = FS.createPath;
Module["FS_createDataFile"] = FS.createDataFile;
Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
Module["FS_createLazyFile"] = FS.createLazyFile;
Module["FS_createLink"] = FS.createLink;
Module["FS_createDevice"] = FS.createDevice;
__ATINIT__.unshift({
 func: (function() {
  TTY.init();
 })
});
__ATEXIT__.push({
 func: (function() {
  TTY.shutdown();
 })
});
TTY.utf8 = new Runtime.UTF8Processor;
if (ENVIRONMENT_IS_NODE) {
 var fs = require("fs");
 NODEFS.staticInit();
}
__ATINIT__.push({
 func: (function() {
  SOCKFS.root = FS.mount(SOCKFS, {}, null);
 })
});
_fputc.ret = allocate([ 0 ], "i8", ALLOC_STATIC);
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) {
 Browser.requestFullScreen(lockPointer, resizeCanvas);
};
Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) {
 Browser.requestAnimationFrame(func);
};
Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) {
 Browser.setCanvasSize(width, height, noUpdates);
};
Module["pauseMainLoop"] = function Module_pauseMainLoop() {
 Browser.mainLoop.pause();
};
Module["resumeMainLoop"] = function Module_resumeMainLoop() {
 Browser.mainLoop.resume();
};
Module["getUserMedia"] = function Module_getUserMedia() {
 Browser.getUserMedia();
};
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true;
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");
var Math_min = Math.min;
function invoke_iiiii(index, a1, a2, a3, a4) {
 try {
  return Module["dynCall_iiiii"](index, a1, a2, a3, a4);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_vi(index, a1) {
 try {
  Module["dynCall_vi"](index, a1);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_vii(index, a1, a2) {
 try {
  Module["dynCall_vii"](index, a1, a2);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_viii(index, a1, a2, a3) {
 try {
  Module["dynCall_viii"](index, a1, a2, a3);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function asmPrintInt(x, y) {
 Module.print("int " + x + "," + y);
}
function asmPrintFloat(x, y) {
 Module.print("float " + x + "," + y);
}

var asm = (function(global,env,buffer) {
// EMSCRIPTEN_START_ASM

    'use asm';
    var HEAP8 = new global.Int8Array(buffer);
    var HEAP16 = new global.Int16Array(buffer);
    var HEAP32 = new global.Int32Array(buffer);
    var HEAPU8 = new global.Uint8Array(buffer);
    var HEAPU16 = new global.Uint16Array(buffer);
    var HEAPU32 = new global.Uint32Array(buffer);
    var HEAPF32 = new global.Float32Array(buffer);
    var HEAPF64 = new global.Float64Array(buffer);
  
  var STACKTOP=env.STACKTOP|0;
  var STACK_MAX=env.STACK_MAX|0;
  var tempDoublePtr=env.tempDoublePtr|0;
  var ABORT=env.ABORT|0;

    var __THREW__ = 0;
    var threwValue = 0;
    var setjmpId = 0;
    var undef = 0;
    var nan = +env.NaN, inf = +env.Infinity;
    var tempInt = 0, tempBigInt = 0, tempBigIntP = 0, tempBigIntS = 0, tempBigIntR = 0.0, tempBigIntI = 0, tempBigIntD = 0, tempValue = 0, tempDouble = 0.0;
  
    var tempRet0 = 0;
    var tempRet1 = 0;
    var tempRet2 = 0;
    var tempRet3 = 0;
    var tempRet4 = 0;
    var tempRet5 = 0;
    var tempRet6 = 0;
    var tempRet7 = 0;
    var tempRet8 = 0;
    var tempRet9 = 0;
  var Math_floor=global.Math.floor;
  var Math_abs=global.Math.abs;
  var Math_sqrt=global.Math.sqrt;
  var Math_pow=global.Math.pow;
  var Math_cos=global.Math.cos;
  var Math_sin=global.Math.sin;
  var Math_tan=global.Math.tan;
  var Math_acos=global.Math.acos;
  var Math_asin=global.Math.asin;
  var Math_atan=global.Math.atan;
  var Math_atan2=global.Math.atan2;
  var Math_exp=global.Math.exp;
  var Math_log=global.Math.log;
  var Math_ceil=global.Math.ceil;
  var Math_imul=global.Math.imul;
  var abort=env.abort;
  var assert=env.assert;
  var asmPrintInt=env.asmPrintInt;
  var asmPrintFloat=env.asmPrintFloat;
  var Math_min=env.min;
  var invoke_iiiii=env.invoke_iiiii;
  var invoke_vi=env.invoke_vi;
  var invoke_vii=env.invoke_vii;
  var invoke_viii=env.invoke_viii;
  var _llvm_pow_f64=env._llvm_pow_f64;
  var _send=env._send;
  var _aaweb_get_height=env._aaweb_get_height;
  var _aaweb_setattr=env._aaweb_setattr;
  var ___setErrNo=env.___setErrNo;
  var _fflush=env._fflush;
  var _pwrite=env._pwrite;
  var __reallyNegative=env.__reallyNegative;
  var _sbrk=env._sbrk;
  var _emscripten_memcpy_big=env._emscripten_memcpy_big;
  var _fileno=env._fileno;
  var _sysconf=env._sysconf;
  var _aaweb_get_width=env._aaweb_get_width;
  var _printf=env._printf;
  var _puts=env._puts;
  var _aaweb_print=env._aaweb_print;
  var _write=env._write;
  var _aaweb_init=env._aaweb_init;
  var ___errno_location=env.___errno_location;
  var _aaweb_gotoxy=env._aaweb_gotoxy;
  var _fputc=env._fputc;
  var _mkport=env._mkport;
  var __exit=env.__exit;
  var _abort=env._abort;
  var _fwrite=env._fwrite;
  var _time=env._time;
  var _fprintf=env._fprintf;
  var __formatString=env.__formatString;
  var _fputs=env._fputs;
  var _exit=env._exit;
  var tempFloat = 0.0;

  // EMSCRIPTEN_START_FUNCS
function _malloc(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, i42 = 0, i43 = 0, i44 = 0, i45 = 0, i46 = 0, i47 = 0, i48 = 0, i49 = 0, i50 = 0, i51 = 0, i52 = 0, i53 = 0, i54 = 0, i55 = 0, i56 = 0, i57 = 0, i58 = 0, i59 = 0, i60 = 0, i61 = 0, i62 = 0, i63 = 0, i64 = 0, i65 = 0, i66 = 0, i67 = 0, i68 = 0, i69 = 0, i70 = 0, i71 = 0, i72 = 0, i73 = 0, i74 = 0, i75 = 0, i76 = 0, i77 = 0, i78 = 0, i79 = 0, i80 = 0, i81 = 0, i82 = 0, i83 = 0, i84 = 0, i85 = 0, i86 = 0, i87 = 0, i88 = 0;
 i2 = STACKTOP;
 do {
  if (i1 >>> 0 < 245) {
   if (i1 >>> 0 < 11) {
    i3 = 16;
   } else {
    i3 = i1 + 11 & -8;
   }
   i4 = i3 >>> 3;
   i5 = HEAP32[1384] | 0;
   i6 = i5 >>> i4;
   if ((i6 & 3 | 0) != 0) {
    i7 = (i6 & 1 ^ 1) + i4 | 0;
    i8 = i7 << 1;
    i9 = 5576 + (i8 << 2) | 0;
    i10 = 5576 + (i8 + 2 << 2) | 0;
    i8 = HEAP32[i10 >> 2] | 0;
    i11 = i8 + 8 | 0;
    i12 = HEAP32[i11 >> 2] | 0;
    do {
     if ((i9 | 0) != (i12 | 0)) {
      if (i12 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
       _abort();
      }
      i13 = i12 + 12 | 0;
      if ((HEAP32[i13 >> 2] | 0) == (i8 | 0)) {
       HEAP32[i13 >> 2] = i9;
       HEAP32[i10 >> 2] = i12;
       break;
      } else {
       _abort();
      }
     } else {
      HEAP32[1384] = i5 & ~(1 << i7);
     }
    } while (0);
    i12 = i7 << 3;
    HEAP32[i8 + 4 >> 2] = i12 | 3;
    i10 = i8 + (i12 | 4) | 0;
    HEAP32[i10 >> 2] = HEAP32[i10 >> 2] | 1;
    i14 = i11;
    STACKTOP = i2;
    return i14 | 0;
   }
   if (i3 >>> 0 > (HEAP32[5544 >> 2] | 0) >>> 0) {
    if ((i6 | 0) != 0) {
     i10 = 2 << i4;
     i12 = i6 << i4 & (i10 | 0 - i10);
     i10 = (i12 & 0 - i12) + -1 | 0;
     i12 = i10 >>> 12 & 16;
     i9 = i10 >>> i12;
     i10 = i9 >>> 5 & 8;
     i13 = i9 >>> i10;
     i9 = i13 >>> 2 & 4;
     i15 = i13 >>> i9;
     i13 = i15 >>> 1 & 2;
     i16 = i15 >>> i13;
     i15 = i16 >>> 1 & 1;
     i17 = (i10 | i12 | i9 | i13 | i15) + (i16 >>> i15) | 0;
     i15 = i17 << 1;
     i16 = 5576 + (i15 << 2) | 0;
     i13 = 5576 + (i15 + 2 << 2) | 0;
     i15 = HEAP32[i13 >> 2] | 0;
     i9 = i15 + 8 | 0;
     i12 = HEAP32[i9 >> 2] | 0;
     do {
      if ((i16 | 0) != (i12 | 0)) {
       if (i12 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
        _abort();
       }
       i10 = i12 + 12 | 0;
       if ((HEAP32[i10 >> 2] | 0) == (i15 | 0)) {
        HEAP32[i10 >> 2] = i16;
        HEAP32[i13 >> 2] = i12;
        break;
       } else {
        _abort();
       }
      } else {
       HEAP32[1384] = i5 & ~(1 << i17);
      }
     } while (0);
     i5 = i17 << 3;
     i12 = i5 - i3 | 0;
     HEAP32[i15 + 4 >> 2] = i3 | 3;
     i13 = i15 + i3 | 0;
     HEAP32[i15 + (i3 | 4) >> 2] = i12 | 1;
     HEAP32[i15 + i5 >> 2] = i12;
     i5 = HEAP32[5544 >> 2] | 0;
     if ((i5 | 0) != 0) {
      i16 = HEAP32[5556 >> 2] | 0;
      i4 = i5 >>> 3;
      i5 = i4 << 1;
      i6 = 5576 + (i5 << 2) | 0;
      i11 = HEAP32[1384] | 0;
      i8 = 1 << i4;
      if ((i11 & i8 | 0) != 0) {
       i4 = 5576 + (i5 + 2 << 2) | 0;
       i7 = HEAP32[i4 >> 2] | 0;
       if (i7 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
        _abort();
       } else {
        i18 = i4;
        i19 = i7;
       }
      } else {
       HEAP32[1384] = i11 | i8;
       i18 = 5576 + (i5 + 2 << 2) | 0;
       i19 = i6;
      }
      HEAP32[i18 >> 2] = i16;
      HEAP32[i19 + 12 >> 2] = i16;
      HEAP32[i16 + 8 >> 2] = i19;
      HEAP32[i16 + 12 >> 2] = i6;
     }
     HEAP32[5544 >> 2] = i12;
     HEAP32[5556 >> 2] = i13;
     i14 = i9;
     STACKTOP = i2;
     return i14 | 0;
    }
    i13 = HEAP32[5540 >> 2] | 0;
    if ((i13 | 0) != 0) {
     i12 = (i13 & 0 - i13) + -1 | 0;
     i13 = i12 >>> 12 & 16;
     i6 = i12 >>> i13;
     i12 = i6 >>> 5 & 8;
     i16 = i6 >>> i12;
     i6 = i16 >>> 2 & 4;
     i5 = i16 >>> i6;
     i16 = i5 >>> 1 & 2;
     i8 = i5 >>> i16;
     i5 = i8 >>> 1 & 1;
     i11 = HEAP32[5840 + ((i12 | i13 | i6 | i16 | i5) + (i8 >>> i5) << 2) >> 2] | 0;
     i5 = (HEAP32[i11 + 4 >> 2] & -8) - i3 | 0;
     i8 = i11;
     i16 = i11;
     while (1) {
      i11 = HEAP32[i8 + 16 >> 2] | 0;
      if ((i11 | 0) == 0) {
       i6 = HEAP32[i8 + 20 >> 2] | 0;
       if ((i6 | 0) == 0) {
        break;
       } else {
        i20 = i6;
       }
      } else {
       i20 = i11;
      }
      i11 = (HEAP32[i20 + 4 >> 2] & -8) - i3 | 0;
      i6 = i11 >>> 0 < i5 >>> 0;
      i5 = i6 ? i11 : i5;
      i8 = i20;
      i16 = i6 ? i20 : i16;
     }
     i8 = HEAP32[5552 >> 2] | 0;
     if (i16 >>> 0 < i8 >>> 0) {
      _abort();
     }
     i9 = i16 + i3 | 0;
     if (!(i16 >>> 0 < i9 >>> 0)) {
      _abort();
     }
     i15 = HEAP32[i16 + 24 >> 2] | 0;
     i17 = HEAP32[i16 + 12 >> 2] | 0;
     do {
      if ((i17 | 0) == (i16 | 0)) {
       i6 = i16 + 20 | 0;
       i11 = HEAP32[i6 >> 2] | 0;
       if ((i11 | 0) == 0) {
        i13 = i16 + 16 | 0;
        i12 = HEAP32[i13 >> 2] | 0;
        if ((i12 | 0) == 0) {
         i21 = 0;
         break;
        } else {
         i22 = i12;
         i23 = i13;
        }
       } else {
        i22 = i11;
        i23 = i6;
       }
       while (1) {
        i6 = i22 + 20 | 0;
        i11 = HEAP32[i6 >> 2] | 0;
        if ((i11 | 0) != 0) {
         i22 = i11;
         i23 = i6;
         continue;
        }
        i6 = i22 + 16 | 0;
        i11 = HEAP32[i6 >> 2] | 0;
        if ((i11 | 0) == 0) {
         break;
        } else {
         i22 = i11;
         i23 = i6;
        }
       }
       if (i23 >>> 0 < i8 >>> 0) {
        _abort();
       } else {
        HEAP32[i23 >> 2] = 0;
        i21 = i22;
        break;
       }
      } else {
       i6 = HEAP32[i16 + 8 >> 2] | 0;
       if (i6 >>> 0 < i8 >>> 0) {
        _abort();
       }
       i11 = i6 + 12 | 0;
       if ((HEAP32[i11 >> 2] | 0) != (i16 | 0)) {
        _abort();
       }
       i13 = i17 + 8 | 0;
       if ((HEAP32[i13 >> 2] | 0) == (i16 | 0)) {
        HEAP32[i11 >> 2] = i17;
        HEAP32[i13 >> 2] = i6;
        i21 = i17;
        break;
       } else {
        _abort();
       }
      }
     } while (0);
     do {
      if ((i15 | 0) != 0) {
       i17 = HEAP32[i16 + 28 >> 2] | 0;
       i8 = 5840 + (i17 << 2) | 0;
       if ((i16 | 0) == (HEAP32[i8 >> 2] | 0)) {
        HEAP32[i8 >> 2] = i21;
        if ((i21 | 0) == 0) {
         HEAP32[5540 >> 2] = HEAP32[5540 >> 2] & ~(1 << i17);
         break;
        }
       } else {
        if (i15 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
         _abort();
        }
        i17 = i15 + 16 | 0;
        if ((HEAP32[i17 >> 2] | 0) == (i16 | 0)) {
         HEAP32[i17 >> 2] = i21;
        } else {
         HEAP32[i15 + 20 >> 2] = i21;
        }
        if ((i21 | 0) == 0) {
         break;
        }
       }
       if (i21 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
        _abort();
       }
       HEAP32[i21 + 24 >> 2] = i15;
       i17 = HEAP32[i16 + 16 >> 2] | 0;
       do {
        if ((i17 | 0) != 0) {
         if (i17 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
          _abort();
         } else {
          HEAP32[i21 + 16 >> 2] = i17;
          HEAP32[i17 + 24 >> 2] = i21;
          break;
         }
        }
       } while (0);
       i17 = HEAP32[i16 + 20 >> 2] | 0;
       if ((i17 | 0) != 0) {
        if (i17 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
         _abort();
        } else {
         HEAP32[i21 + 20 >> 2] = i17;
         HEAP32[i17 + 24 >> 2] = i21;
         break;
        }
       }
      }
     } while (0);
     if (i5 >>> 0 < 16) {
      i15 = i5 + i3 | 0;
      HEAP32[i16 + 4 >> 2] = i15 | 3;
      i17 = i16 + (i15 + 4) | 0;
      HEAP32[i17 >> 2] = HEAP32[i17 >> 2] | 1;
     } else {
      HEAP32[i16 + 4 >> 2] = i3 | 3;
      HEAP32[i16 + (i3 | 4) >> 2] = i5 | 1;
      HEAP32[i16 + (i5 + i3) >> 2] = i5;
      i17 = HEAP32[5544 >> 2] | 0;
      if ((i17 | 0) != 0) {
       i15 = HEAP32[5556 >> 2] | 0;
       i8 = i17 >>> 3;
       i17 = i8 << 1;
       i6 = 5576 + (i17 << 2) | 0;
       i13 = HEAP32[1384] | 0;
       i11 = 1 << i8;
       if ((i13 & i11 | 0) != 0) {
        i8 = 5576 + (i17 + 2 << 2) | 0;
        i12 = HEAP32[i8 >> 2] | 0;
        if (i12 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
         _abort();
        } else {
         i24 = i8;
         i25 = i12;
        }
       } else {
        HEAP32[1384] = i13 | i11;
        i24 = 5576 + (i17 + 2 << 2) | 0;
        i25 = i6;
       }
       HEAP32[i24 >> 2] = i15;
       HEAP32[i25 + 12 >> 2] = i15;
       HEAP32[i15 + 8 >> 2] = i25;
       HEAP32[i15 + 12 >> 2] = i6;
      }
      HEAP32[5544 >> 2] = i5;
      HEAP32[5556 >> 2] = i9;
     }
     i14 = i16 + 8 | 0;
     STACKTOP = i2;
     return i14 | 0;
    } else {
     i26 = i3;
    }
   } else {
    i26 = i3;
   }
  } else {
   if (!(i1 >>> 0 > 4294967231)) {
    i6 = i1 + 11 | 0;
    i15 = i6 & -8;
    i17 = HEAP32[5540 >> 2] | 0;
    if ((i17 | 0) != 0) {
     i11 = 0 - i15 | 0;
     i13 = i6 >>> 8;
     if ((i13 | 0) != 0) {
      if (i15 >>> 0 > 16777215) {
       i27 = 31;
      } else {
       i6 = (i13 + 1048320 | 0) >>> 16 & 8;
       i12 = i13 << i6;
       i13 = (i12 + 520192 | 0) >>> 16 & 4;
       i8 = i12 << i13;
       i12 = (i8 + 245760 | 0) >>> 16 & 2;
       i7 = 14 - (i13 | i6 | i12) + (i8 << i12 >>> 15) | 0;
       i27 = i15 >>> (i7 + 7 | 0) & 1 | i7 << 1;
      }
     } else {
      i27 = 0;
     }
     i7 = HEAP32[5840 + (i27 << 2) >> 2] | 0;
     L126 : do {
      if ((i7 | 0) == 0) {
       i28 = i11;
       i29 = 0;
       i30 = 0;
      } else {
       if ((i27 | 0) == 31) {
        i31 = 0;
       } else {
        i31 = 25 - (i27 >>> 1) | 0;
       }
       i12 = i11;
       i8 = 0;
       i6 = i15 << i31;
       i13 = i7;
       i4 = 0;
       while (1) {
        i10 = HEAP32[i13 + 4 >> 2] & -8;
        i32 = i10 - i15 | 0;
        if (i32 >>> 0 < i12 >>> 0) {
         if ((i10 | 0) == (i15 | 0)) {
          i28 = i32;
          i29 = i13;
          i30 = i13;
          break L126;
         } else {
          i33 = i32;
          i34 = i13;
         }
        } else {
         i33 = i12;
         i34 = i4;
        }
        i32 = HEAP32[i13 + 20 >> 2] | 0;
        i13 = HEAP32[i13 + (i6 >>> 31 << 2) + 16 >> 2] | 0;
        i10 = (i32 | 0) == 0 | (i32 | 0) == (i13 | 0) ? i8 : i32;
        if ((i13 | 0) == 0) {
         i28 = i33;
         i29 = i10;
         i30 = i34;
         break;
        } else {
         i12 = i33;
         i8 = i10;
         i6 = i6 << 1;
         i4 = i34;
        }
       }
      }
     } while (0);
     if ((i29 | 0) == 0 & (i30 | 0) == 0) {
      i7 = 2 << i27;
      i11 = i17 & (i7 | 0 - i7);
      if ((i11 | 0) == 0) {
       i26 = i15;
       break;
      }
      i7 = (i11 & 0 - i11) + -1 | 0;
      i11 = i7 >>> 12 & 16;
      i16 = i7 >>> i11;
      i7 = i16 >>> 5 & 8;
      i9 = i16 >>> i7;
      i16 = i9 >>> 2 & 4;
      i5 = i9 >>> i16;
      i9 = i5 >>> 1 & 2;
      i4 = i5 >>> i9;
      i5 = i4 >>> 1 & 1;
      i35 = HEAP32[5840 + ((i7 | i11 | i16 | i9 | i5) + (i4 >>> i5) << 2) >> 2] | 0;
     } else {
      i35 = i29;
     }
     if ((i35 | 0) == 0) {
      i36 = i28;
      i37 = i30;
     } else {
      i5 = i28;
      i4 = i35;
      i9 = i30;
      while (1) {
       i16 = (HEAP32[i4 + 4 >> 2] & -8) - i15 | 0;
       i11 = i16 >>> 0 < i5 >>> 0;
       i7 = i11 ? i16 : i5;
       i16 = i11 ? i4 : i9;
       i11 = HEAP32[i4 + 16 >> 2] | 0;
       if ((i11 | 0) != 0) {
        i5 = i7;
        i4 = i11;
        i9 = i16;
        continue;
       }
       i4 = HEAP32[i4 + 20 >> 2] | 0;
       if ((i4 | 0) == 0) {
        i36 = i7;
        i37 = i16;
        break;
       } else {
        i5 = i7;
        i9 = i16;
       }
      }
     }
     if ((i37 | 0) != 0 ? i36 >>> 0 < ((HEAP32[5544 >> 2] | 0) - i15 | 0) >>> 0 : 0) {
      i9 = HEAP32[5552 >> 2] | 0;
      if (i37 >>> 0 < i9 >>> 0) {
       _abort();
      }
      i5 = i37 + i15 | 0;
      if (!(i37 >>> 0 < i5 >>> 0)) {
       _abort();
      }
      i4 = HEAP32[i37 + 24 >> 2] | 0;
      i17 = HEAP32[i37 + 12 >> 2] | 0;
      do {
       if ((i17 | 0) == (i37 | 0)) {
        i16 = i37 + 20 | 0;
        i7 = HEAP32[i16 >> 2] | 0;
        if ((i7 | 0) == 0) {
         i11 = i37 + 16 | 0;
         i6 = HEAP32[i11 >> 2] | 0;
         if ((i6 | 0) == 0) {
          i38 = 0;
          break;
         } else {
          i39 = i6;
          i40 = i11;
         }
        } else {
         i39 = i7;
         i40 = i16;
        }
        while (1) {
         i16 = i39 + 20 | 0;
         i7 = HEAP32[i16 >> 2] | 0;
         if ((i7 | 0) != 0) {
          i39 = i7;
          i40 = i16;
          continue;
         }
         i16 = i39 + 16 | 0;
         i7 = HEAP32[i16 >> 2] | 0;
         if ((i7 | 0) == 0) {
          break;
         } else {
          i39 = i7;
          i40 = i16;
         }
        }
        if (i40 >>> 0 < i9 >>> 0) {
         _abort();
        } else {
         HEAP32[i40 >> 2] = 0;
         i38 = i39;
         break;
        }
       } else {
        i16 = HEAP32[i37 + 8 >> 2] | 0;
        if (i16 >>> 0 < i9 >>> 0) {
         _abort();
        }
        i7 = i16 + 12 | 0;
        if ((HEAP32[i7 >> 2] | 0) != (i37 | 0)) {
         _abort();
        }
        i11 = i17 + 8 | 0;
        if ((HEAP32[i11 >> 2] | 0) == (i37 | 0)) {
         HEAP32[i7 >> 2] = i17;
         HEAP32[i11 >> 2] = i16;
         i38 = i17;
         break;
        } else {
         _abort();
        }
       }
      } while (0);
      do {
       if ((i4 | 0) != 0) {
        i17 = HEAP32[i37 + 28 >> 2] | 0;
        i9 = 5840 + (i17 << 2) | 0;
        if ((i37 | 0) == (HEAP32[i9 >> 2] | 0)) {
         HEAP32[i9 >> 2] = i38;
         if ((i38 | 0) == 0) {
          HEAP32[5540 >> 2] = HEAP32[5540 >> 2] & ~(1 << i17);
          break;
         }
        } else {
         if (i4 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
          _abort();
         }
         i17 = i4 + 16 | 0;
         if ((HEAP32[i17 >> 2] | 0) == (i37 | 0)) {
          HEAP32[i17 >> 2] = i38;
         } else {
          HEAP32[i4 + 20 >> 2] = i38;
         }
         if ((i38 | 0) == 0) {
          break;
         }
        }
        if (i38 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
         _abort();
        }
        HEAP32[i38 + 24 >> 2] = i4;
        i17 = HEAP32[i37 + 16 >> 2] | 0;
        do {
         if ((i17 | 0) != 0) {
          if (i17 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
           _abort();
          } else {
           HEAP32[i38 + 16 >> 2] = i17;
           HEAP32[i17 + 24 >> 2] = i38;
           break;
          }
         }
        } while (0);
        i17 = HEAP32[i37 + 20 >> 2] | 0;
        if ((i17 | 0) != 0) {
         if (i17 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
          _abort();
         } else {
          HEAP32[i38 + 20 >> 2] = i17;
          HEAP32[i17 + 24 >> 2] = i38;
          break;
         }
        }
       }
      } while (0);
      L204 : do {
       if (!(i36 >>> 0 < 16)) {
        HEAP32[i37 + 4 >> 2] = i15 | 3;
        HEAP32[i37 + (i15 | 4) >> 2] = i36 | 1;
        HEAP32[i37 + (i36 + i15) >> 2] = i36;
        i4 = i36 >>> 3;
        if (i36 >>> 0 < 256) {
         i17 = i4 << 1;
         i9 = 5576 + (i17 << 2) | 0;
         i16 = HEAP32[1384] | 0;
         i11 = 1 << i4;
         do {
          if ((i16 & i11 | 0) == 0) {
           HEAP32[1384] = i16 | i11;
           i41 = 5576 + (i17 + 2 << 2) | 0;
           i42 = i9;
          } else {
           i4 = 5576 + (i17 + 2 << 2) | 0;
           i7 = HEAP32[i4 >> 2] | 0;
           if (!(i7 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0)) {
            i41 = i4;
            i42 = i7;
            break;
           }
           _abort();
          }
         } while (0);
         HEAP32[i41 >> 2] = i5;
         HEAP32[i42 + 12 >> 2] = i5;
         HEAP32[i37 + (i15 + 8) >> 2] = i42;
         HEAP32[i37 + (i15 + 12) >> 2] = i9;
         break;
        }
        i17 = i36 >>> 8;
        if ((i17 | 0) != 0) {
         if (i36 >>> 0 > 16777215) {
          i43 = 31;
         } else {
          i11 = (i17 + 1048320 | 0) >>> 16 & 8;
          i16 = i17 << i11;
          i17 = (i16 + 520192 | 0) >>> 16 & 4;
          i7 = i16 << i17;
          i16 = (i7 + 245760 | 0) >>> 16 & 2;
          i4 = 14 - (i17 | i11 | i16) + (i7 << i16 >>> 15) | 0;
          i43 = i36 >>> (i4 + 7 | 0) & 1 | i4 << 1;
         }
        } else {
         i43 = 0;
        }
        i4 = 5840 + (i43 << 2) | 0;
        HEAP32[i37 + (i15 + 28) >> 2] = i43;
        HEAP32[i37 + (i15 + 20) >> 2] = 0;
        HEAP32[i37 + (i15 + 16) >> 2] = 0;
        i16 = HEAP32[5540 >> 2] | 0;
        i7 = 1 << i43;
        if ((i16 & i7 | 0) == 0) {
         HEAP32[5540 >> 2] = i16 | i7;
         HEAP32[i4 >> 2] = i5;
         HEAP32[i37 + (i15 + 24) >> 2] = i4;
         HEAP32[i37 + (i15 + 12) >> 2] = i5;
         HEAP32[i37 + (i15 + 8) >> 2] = i5;
         break;
        }
        i7 = HEAP32[i4 >> 2] | 0;
        if ((i43 | 0) == 31) {
         i44 = 0;
        } else {
         i44 = 25 - (i43 >>> 1) | 0;
        }
        L225 : do {
         if ((HEAP32[i7 + 4 >> 2] & -8 | 0) != (i36 | 0)) {
          i4 = i36 << i44;
          i16 = i7;
          while (1) {
           i45 = i16 + (i4 >>> 31 << 2) + 16 | 0;
           i11 = HEAP32[i45 >> 2] | 0;
           if ((i11 | 0) == 0) {
            break;
           }
           if ((HEAP32[i11 + 4 >> 2] & -8 | 0) == (i36 | 0)) {
            i46 = i11;
            break L225;
           } else {
            i4 = i4 << 1;
            i16 = i11;
           }
          }
          if (i45 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
           _abort();
          } else {
           HEAP32[i45 >> 2] = i5;
           HEAP32[i37 + (i15 + 24) >> 2] = i16;
           HEAP32[i37 + (i15 + 12) >> 2] = i5;
           HEAP32[i37 + (i15 + 8) >> 2] = i5;
           break L204;
          }
         } else {
          i46 = i7;
         }
        } while (0);
        i7 = i46 + 8 | 0;
        i9 = HEAP32[i7 >> 2] | 0;
        i4 = HEAP32[5552 >> 2] | 0;
        if (i46 >>> 0 < i4 >>> 0) {
         _abort();
        }
        if (i9 >>> 0 < i4 >>> 0) {
         _abort();
        } else {
         HEAP32[i9 + 12 >> 2] = i5;
         HEAP32[i7 >> 2] = i5;
         HEAP32[i37 + (i15 + 8) >> 2] = i9;
         HEAP32[i37 + (i15 + 12) >> 2] = i46;
         HEAP32[i37 + (i15 + 24) >> 2] = 0;
         break;
        }
       } else {
        i9 = i36 + i15 | 0;
        HEAP32[i37 + 4 >> 2] = i9 | 3;
        i7 = i37 + (i9 + 4) | 0;
        HEAP32[i7 >> 2] = HEAP32[i7 >> 2] | 1;
       }
      } while (0);
      i14 = i37 + 8 | 0;
      STACKTOP = i2;
      return i14 | 0;
     } else {
      i26 = i15;
     }
    } else {
     i26 = i15;
    }
   } else {
    i26 = -1;
   }
  }
 } while (0);
 i37 = HEAP32[5544 >> 2] | 0;
 if (!(i26 >>> 0 > i37 >>> 0)) {
  i36 = i37 - i26 | 0;
  i46 = HEAP32[5556 >> 2] | 0;
  if (i36 >>> 0 > 15) {
   HEAP32[5556 >> 2] = i46 + i26;
   HEAP32[5544 >> 2] = i36;
   HEAP32[i46 + (i26 + 4) >> 2] = i36 | 1;
   HEAP32[i46 + i37 >> 2] = i36;
   HEAP32[i46 + 4 >> 2] = i26 | 3;
  } else {
   HEAP32[5544 >> 2] = 0;
   HEAP32[5556 >> 2] = 0;
   HEAP32[i46 + 4 >> 2] = i37 | 3;
   i36 = i46 + (i37 + 4) | 0;
   HEAP32[i36 >> 2] = HEAP32[i36 >> 2] | 1;
  }
  i14 = i46 + 8 | 0;
  STACKTOP = i2;
  return i14 | 0;
 }
 i46 = HEAP32[5548 >> 2] | 0;
 if (i26 >>> 0 < i46 >>> 0) {
  i36 = i46 - i26 | 0;
  HEAP32[5548 >> 2] = i36;
  i46 = HEAP32[5560 >> 2] | 0;
  HEAP32[5560 >> 2] = i46 + i26;
  HEAP32[i46 + (i26 + 4) >> 2] = i36 | 1;
  HEAP32[i46 + 4 >> 2] = i26 | 3;
  i14 = i46 + 8 | 0;
  STACKTOP = i2;
  return i14 | 0;
 }
 do {
  if ((HEAP32[1502] | 0) == 0) {
   i46 = _sysconf(30) | 0;
   if ((i46 + -1 & i46 | 0) == 0) {
    HEAP32[6016 >> 2] = i46;
    HEAP32[6012 >> 2] = i46;
    HEAP32[6020 >> 2] = -1;
    HEAP32[6024 >> 2] = -1;
    HEAP32[6028 >> 2] = 0;
    HEAP32[5980 >> 2] = 0;
    HEAP32[1502] = (_time(0) | 0) & -16 ^ 1431655768;
    break;
   } else {
    _abort();
   }
  }
 } while (0);
 i46 = i26 + 48 | 0;
 i36 = HEAP32[6016 >> 2] | 0;
 i37 = i26 + 47 | 0;
 i45 = i36 + i37 | 0;
 i44 = 0 - i36 | 0;
 i36 = i45 & i44;
 if (!(i36 >>> 0 > i26 >>> 0)) {
  i14 = 0;
  STACKTOP = i2;
  return i14 | 0;
 }
 i43 = HEAP32[5976 >> 2] | 0;
 if ((i43 | 0) != 0 ? (i42 = HEAP32[5968 >> 2] | 0, i41 = i42 + i36 | 0, i41 >>> 0 <= i42 >>> 0 | i41 >>> 0 > i43 >>> 0) : 0) {
  i14 = 0;
  STACKTOP = i2;
  return i14 | 0;
 }
 L269 : do {
  if ((HEAP32[5980 >> 2] & 4 | 0) == 0) {
   i43 = HEAP32[5560 >> 2] | 0;
   L271 : do {
    if ((i43 | 0) != 0) {
     i41 = 5984 | 0;
     while (1) {
      i42 = HEAP32[i41 >> 2] | 0;
      if (!(i42 >>> 0 > i43 >>> 0) ? (i47 = i41 + 4 | 0, (i42 + (HEAP32[i47 >> 2] | 0) | 0) >>> 0 > i43 >>> 0) : 0) {
       break;
      }
      i42 = HEAP32[i41 + 8 >> 2] | 0;
      if ((i42 | 0) == 0) {
       i48 = 182;
       break L271;
      } else {
       i41 = i42;
      }
     }
     if ((i41 | 0) != 0) {
      i42 = i45 - (HEAP32[5548 >> 2] | 0) & i44;
      if (i42 >>> 0 < 2147483647) {
       i38 = _sbrk(i42 | 0) | 0;
       i39 = (i38 | 0) == ((HEAP32[i41 >> 2] | 0) + (HEAP32[i47 >> 2] | 0) | 0);
       i49 = i38;
       i50 = i42;
       i51 = i39 ? i38 : -1;
       i52 = i39 ? i42 : 0;
       i48 = 191;
      } else {
       i53 = 0;
      }
     } else {
      i48 = 182;
     }
    } else {
     i48 = 182;
    }
   } while (0);
   do {
    if ((i48 | 0) == 182) {
     i43 = _sbrk(0) | 0;
     if ((i43 | 0) != (-1 | 0)) {
      i15 = i43;
      i42 = HEAP32[6012 >> 2] | 0;
      i39 = i42 + -1 | 0;
      if ((i39 & i15 | 0) == 0) {
       i54 = i36;
      } else {
       i54 = i36 - i15 + (i39 + i15 & 0 - i42) | 0;
      }
      i42 = HEAP32[5968 >> 2] | 0;
      i15 = i42 + i54 | 0;
      if (i54 >>> 0 > i26 >>> 0 & i54 >>> 0 < 2147483647) {
       i39 = HEAP32[5976 >> 2] | 0;
       if ((i39 | 0) != 0 ? i15 >>> 0 <= i42 >>> 0 | i15 >>> 0 > i39 >>> 0 : 0) {
        i53 = 0;
        break;
       }
       i39 = _sbrk(i54 | 0) | 0;
       i15 = (i39 | 0) == (i43 | 0);
       i49 = i39;
       i50 = i54;
       i51 = i15 ? i43 : -1;
       i52 = i15 ? i54 : 0;
       i48 = 191;
      } else {
       i53 = 0;
      }
     } else {
      i53 = 0;
     }
    }
   } while (0);
   L291 : do {
    if ((i48 | 0) == 191) {
     i15 = 0 - i50 | 0;
     if ((i51 | 0) != (-1 | 0)) {
      i55 = i51;
      i56 = i52;
      i48 = 202;
      break L269;
     }
     do {
      if ((i49 | 0) != (-1 | 0) & i50 >>> 0 < 2147483647 & i50 >>> 0 < i46 >>> 0 ? (i43 = HEAP32[6016 >> 2] | 0, i39 = i37 - i50 + i43 & 0 - i43, i39 >>> 0 < 2147483647) : 0) {
       if ((_sbrk(i39 | 0) | 0) == (-1 | 0)) {
        _sbrk(i15 | 0) | 0;
        i53 = i52;
        break L291;
       } else {
        i57 = i39 + i50 | 0;
        break;
       }
      } else {
       i57 = i50;
      }
     } while (0);
     if ((i49 | 0) == (-1 | 0)) {
      i53 = i52;
     } else {
      i55 = i49;
      i56 = i57;
      i48 = 202;
      break L269;
     }
    }
   } while (0);
   HEAP32[5980 >> 2] = HEAP32[5980 >> 2] | 4;
   i58 = i53;
   i48 = 199;
  } else {
   i58 = 0;
   i48 = 199;
  }
 } while (0);
 if ((((i48 | 0) == 199 ? i36 >>> 0 < 2147483647 : 0) ? (i53 = _sbrk(i36 | 0) | 0, i36 = _sbrk(0) | 0, (i36 | 0) != (-1 | 0) & (i53 | 0) != (-1 | 0) & i53 >>> 0 < i36 >>> 0) : 0) ? (i57 = i36 - i53 | 0, i36 = i57 >>> 0 > (i26 + 40 | 0) >>> 0, i36) : 0) {
  i55 = i53;
  i56 = i36 ? i57 : i58;
  i48 = 202;
 }
 if ((i48 | 0) == 202) {
  i58 = (HEAP32[5968 >> 2] | 0) + i56 | 0;
  HEAP32[5968 >> 2] = i58;
  if (i58 >>> 0 > (HEAP32[5972 >> 2] | 0) >>> 0) {
   HEAP32[5972 >> 2] = i58;
  }
  i58 = HEAP32[5560 >> 2] | 0;
  L311 : do {
   if ((i58 | 0) != 0) {
    i57 = 5984 | 0;
    while (1) {
     i59 = HEAP32[i57 >> 2] | 0;
     i60 = i57 + 4 | 0;
     i61 = HEAP32[i60 >> 2] | 0;
     if ((i55 | 0) == (i59 + i61 | 0)) {
      i48 = 214;
      break;
     }
     i36 = HEAP32[i57 + 8 >> 2] | 0;
     if ((i36 | 0) == 0) {
      break;
     } else {
      i57 = i36;
     }
    }
    if (((i48 | 0) == 214 ? (HEAP32[i57 + 12 >> 2] & 8 | 0) == 0 : 0) ? i58 >>> 0 >= i59 >>> 0 & i58 >>> 0 < i55 >>> 0 : 0) {
     HEAP32[i60 >> 2] = i61 + i56;
     i36 = (HEAP32[5548 >> 2] | 0) + i56 | 0;
     i53 = i58 + 8 | 0;
     if ((i53 & 7 | 0) == 0) {
      i62 = 0;
     } else {
      i62 = 0 - i53 & 7;
     }
     i53 = i36 - i62 | 0;
     HEAP32[5560 >> 2] = i58 + i62;
     HEAP32[5548 >> 2] = i53;
     HEAP32[i58 + (i62 + 4) >> 2] = i53 | 1;
     HEAP32[i58 + (i36 + 4) >> 2] = 40;
     HEAP32[5564 >> 2] = HEAP32[6024 >> 2];
     break;
    }
    if (i55 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
     HEAP32[5552 >> 2] = i55;
    }
    i36 = i55 + i56 | 0;
    i53 = 5984 | 0;
    while (1) {
     if ((HEAP32[i53 >> 2] | 0) == (i36 | 0)) {
      i48 = 224;
      break;
     }
     i49 = HEAP32[i53 + 8 >> 2] | 0;
     if ((i49 | 0) == 0) {
      break;
     } else {
      i53 = i49;
     }
    }
    if ((i48 | 0) == 224 ? (HEAP32[i53 + 12 >> 2] & 8 | 0) == 0 : 0) {
     HEAP32[i53 >> 2] = i55;
     i36 = i53 + 4 | 0;
     HEAP32[i36 >> 2] = (HEAP32[i36 >> 2] | 0) + i56;
     i36 = i55 + 8 | 0;
     if ((i36 & 7 | 0) == 0) {
      i63 = 0;
     } else {
      i63 = 0 - i36 & 7;
     }
     i36 = i55 + (i56 + 8) | 0;
     if ((i36 & 7 | 0) == 0) {
      i64 = 0;
     } else {
      i64 = 0 - i36 & 7;
     }
     i36 = i55 + (i64 + i56) | 0;
     i57 = i63 + i26 | 0;
     i49 = i55 + i57 | 0;
     i52 = i36 - (i55 + i63) - i26 | 0;
     HEAP32[i55 + (i63 + 4) >> 2] = i26 | 3;
     L338 : do {
      if ((i36 | 0) != (HEAP32[5560 >> 2] | 0)) {
       if ((i36 | 0) == (HEAP32[5556 >> 2] | 0)) {
        i50 = (HEAP32[5544 >> 2] | 0) + i52 | 0;
        HEAP32[5544 >> 2] = i50;
        HEAP32[5556 >> 2] = i49;
        HEAP32[i55 + (i57 + 4) >> 2] = i50 | 1;
        HEAP32[i55 + (i50 + i57) >> 2] = i50;
        break;
       }
       i50 = i56 + 4 | 0;
       i37 = HEAP32[i55 + (i50 + i64) >> 2] | 0;
       if ((i37 & 3 | 0) == 1) {
        i46 = i37 & -8;
        i51 = i37 >>> 3;
        L346 : do {
         if (!(i37 >>> 0 < 256)) {
          i54 = HEAP32[i55 + ((i64 | 24) + i56) >> 2] | 0;
          i47 = HEAP32[i55 + (i56 + 12 + i64) >> 2] | 0;
          do {
           if ((i47 | 0) == (i36 | 0)) {
            i44 = i64 | 16;
            i45 = i55 + (i50 + i44) | 0;
            i15 = HEAP32[i45 >> 2] | 0;
            if ((i15 | 0) == 0) {
             i41 = i55 + (i44 + i56) | 0;
             i44 = HEAP32[i41 >> 2] | 0;
             if ((i44 | 0) == 0) {
              i65 = 0;
              break;
             } else {
              i66 = i44;
              i67 = i41;
             }
            } else {
             i66 = i15;
             i67 = i45;
            }
            while (1) {
             i45 = i66 + 20 | 0;
             i15 = HEAP32[i45 >> 2] | 0;
             if ((i15 | 0) != 0) {
              i66 = i15;
              i67 = i45;
              continue;
             }
             i45 = i66 + 16 | 0;
             i15 = HEAP32[i45 >> 2] | 0;
             if ((i15 | 0) == 0) {
              break;
             } else {
              i66 = i15;
              i67 = i45;
             }
            }
            if (i67 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
             _abort();
            } else {
             HEAP32[i67 >> 2] = 0;
             i65 = i66;
             break;
            }
           } else {
            i45 = HEAP32[i55 + ((i64 | 8) + i56) >> 2] | 0;
            if (i45 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
             _abort();
            }
            i15 = i45 + 12 | 0;
            if ((HEAP32[i15 >> 2] | 0) != (i36 | 0)) {
             _abort();
            }
            i41 = i47 + 8 | 0;
            if ((HEAP32[i41 >> 2] | 0) == (i36 | 0)) {
             HEAP32[i15 >> 2] = i47;
             HEAP32[i41 >> 2] = i45;
             i65 = i47;
             break;
            } else {
             _abort();
            }
           }
          } while (0);
          if ((i54 | 0) == 0) {
           break;
          }
          i47 = HEAP32[i55 + (i56 + 28 + i64) >> 2] | 0;
          i16 = 5840 + (i47 << 2) | 0;
          do {
           if ((i36 | 0) != (HEAP32[i16 >> 2] | 0)) {
            if (i54 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
             _abort();
            }
            i45 = i54 + 16 | 0;
            if ((HEAP32[i45 >> 2] | 0) == (i36 | 0)) {
             HEAP32[i45 >> 2] = i65;
            } else {
             HEAP32[i54 + 20 >> 2] = i65;
            }
            if ((i65 | 0) == 0) {
             break L346;
            }
           } else {
            HEAP32[i16 >> 2] = i65;
            if ((i65 | 0) != 0) {
             break;
            }
            HEAP32[5540 >> 2] = HEAP32[5540 >> 2] & ~(1 << i47);
            break L346;
           }
          } while (0);
          if (i65 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
           _abort();
          }
          HEAP32[i65 + 24 >> 2] = i54;
          i47 = i64 | 16;
          i16 = HEAP32[i55 + (i47 + i56) >> 2] | 0;
          do {
           if ((i16 | 0) != 0) {
            if (i16 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
             _abort();
            } else {
             HEAP32[i65 + 16 >> 2] = i16;
             HEAP32[i16 + 24 >> 2] = i65;
             break;
            }
           }
          } while (0);
          i16 = HEAP32[i55 + (i50 + i47) >> 2] | 0;
          if ((i16 | 0) == 0) {
           break;
          }
          if (i16 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
           _abort();
          } else {
           HEAP32[i65 + 20 >> 2] = i16;
           HEAP32[i16 + 24 >> 2] = i65;
           break;
          }
         } else {
          i16 = HEAP32[i55 + ((i64 | 8) + i56) >> 2] | 0;
          i54 = HEAP32[i55 + (i56 + 12 + i64) >> 2] | 0;
          i45 = 5576 + (i51 << 1 << 2) | 0;
          do {
           if ((i16 | 0) != (i45 | 0)) {
            if (i16 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
             _abort();
            }
            if ((HEAP32[i16 + 12 >> 2] | 0) == (i36 | 0)) {
             break;
            }
            _abort();
           }
          } while (0);
          if ((i54 | 0) == (i16 | 0)) {
           HEAP32[1384] = HEAP32[1384] & ~(1 << i51);
           break;
          }
          do {
           if ((i54 | 0) == (i45 | 0)) {
            i68 = i54 + 8 | 0;
           } else {
            if (i54 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
             _abort();
            }
            i47 = i54 + 8 | 0;
            if ((HEAP32[i47 >> 2] | 0) == (i36 | 0)) {
             i68 = i47;
             break;
            }
            _abort();
           }
          } while (0);
          HEAP32[i16 + 12 >> 2] = i54;
          HEAP32[i68 >> 2] = i16;
         }
        } while (0);
        i69 = i55 + ((i46 | i64) + i56) | 0;
        i70 = i46 + i52 | 0;
       } else {
        i69 = i36;
        i70 = i52;
       }
       i51 = i69 + 4 | 0;
       HEAP32[i51 >> 2] = HEAP32[i51 >> 2] & -2;
       HEAP32[i55 + (i57 + 4) >> 2] = i70 | 1;
       HEAP32[i55 + (i70 + i57) >> 2] = i70;
       i51 = i70 >>> 3;
       if (i70 >>> 0 < 256) {
        i50 = i51 << 1;
        i37 = 5576 + (i50 << 2) | 0;
        i45 = HEAP32[1384] | 0;
        i47 = 1 << i51;
        do {
         if ((i45 & i47 | 0) == 0) {
          HEAP32[1384] = i45 | i47;
          i71 = 5576 + (i50 + 2 << 2) | 0;
          i72 = i37;
         } else {
          i51 = 5576 + (i50 + 2 << 2) | 0;
          i41 = HEAP32[i51 >> 2] | 0;
          if (!(i41 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0)) {
           i71 = i51;
           i72 = i41;
           break;
          }
          _abort();
         }
        } while (0);
        HEAP32[i71 >> 2] = i49;
        HEAP32[i72 + 12 >> 2] = i49;
        HEAP32[i55 + (i57 + 8) >> 2] = i72;
        HEAP32[i55 + (i57 + 12) >> 2] = i37;
        break;
       }
       i50 = i70 >>> 8;
       do {
        if ((i50 | 0) == 0) {
         i73 = 0;
        } else {
         if (i70 >>> 0 > 16777215) {
          i73 = 31;
          break;
         }
         i47 = (i50 + 1048320 | 0) >>> 16 & 8;
         i45 = i50 << i47;
         i46 = (i45 + 520192 | 0) >>> 16 & 4;
         i41 = i45 << i46;
         i45 = (i41 + 245760 | 0) >>> 16 & 2;
         i51 = 14 - (i46 | i47 | i45) + (i41 << i45 >>> 15) | 0;
         i73 = i70 >>> (i51 + 7 | 0) & 1 | i51 << 1;
        }
       } while (0);
       i50 = 5840 + (i73 << 2) | 0;
       HEAP32[i55 + (i57 + 28) >> 2] = i73;
       HEAP32[i55 + (i57 + 20) >> 2] = 0;
       HEAP32[i55 + (i57 + 16) >> 2] = 0;
       i37 = HEAP32[5540 >> 2] | 0;
       i51 = 1 << i73;
       if ((i37 & i51 | 0) == 0) {
        HEAP32[5540 >> 2] = i37 | i51;
        HEAP32[i50 >> 2] = i49;
        HEAP32[i55 + (i57 + 24) >> 2] = i50;
        HEAP32[i55 + (i57 + 12) >> 2] = i49;
        HEAP32[i55 + (i57 + 8) >> 2] = i49;
        break;
       }
       i51 = HEAP32[i50 >> 2] | 0;
       if ((i73 | 0) == 31) {
        i74 = 0;
       } else {
        i74 = 25 - (i73 >>> 1) | 0;
       }
       L435 : do {
        if ((HEAP32[i51 + 4 >> 2] & -8 | 0) != (i70 | 0)) {
         i50 = i70 << i74;
         i37 = i51;
         while (1) {
          i75 = i37 + (i50 >>> 31 << 2) + 16 | 0;
          i45 = HEAP32[i75 >> 2] | 0;
          if ((i45 | 0) == 0) {
           break;
          }
          if ((HEAP32[i45 + 4 >> 2] & -8 | 0) == (i70 | 0)) {
           i76 = i45;
           break L435;
          } else {
           i50 = i50 << 1;
           i37 = i45;
          }
         }
         if (i75 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
          _abort();
         } else {
          HEAP32[i75 >> 2] = i49;
          HEAP32[i55 + (i57 + 24) >> 2] = i37;
          HEAP32[i55 + (i57 + 12) >> 2] = i49;
          HEAP32[i55 + (i57 + 8) >> 2] = i49;
          break L338;
         }
        } else {
         i76 = i51;
        }
       } while (0);
       i51 = i76 + 8 | 0;
       i50 = HEAP32[i51 >> 2] | 0;
       i16 = HEAP32[5552 >> 2] | 0;
       if (i76 >>> 0 < i16 >>> 0) {
        _abort();
       }
       if (i50 >>> 0 < i16 >>> 0) {
        _abort();
       } else {
        HEAP32[i50 + 12 >> 2] = i49;
        HEAP32[i51 >> 2] = i49;
        HEAP32[i55 + (i57 + 8) >> 2] = i50;
        HEAP32[i55 + (i57 + 12) >> 2] = i76;
        HEAP32[i55 + (i57 + 24) >> 2] = 0;
        break;
       }
      } else {
       i50 = (HEAP32[5548 >> 2] | 0) + i52 | 0;
       HEAP32[5548 >> 2] = i50;
       HEAP32[5560 >> 2] = i49;
       HEAP32[i55 + (i57 + 4) >> 2] = i50 | 1;
      }
     } while (0);
     i14 = i55 + (i63 | 8) | 0;
     STACKTOP = i2;
     return i14 | 0;
    }
    i57 = 5984 | 0;
    while (1) {
     i77 = HEAP32[i57 >> 2] | 0;
     if (!(i77 >>> 0 > i58 >>> 0) ? (i78 = HEAP32[i57 + 4 >> 2] | 0, i79 = i77 + i78 | 0, i79 >>> 0 > i58 >>> 0) : 0) {
      break;
     }
     i57 = HEAP32[i57 + 8 >> 2] | 0;
    }
    i57 = i77 + (i78 + -39) | 0;
    if ((i57 & 7 | 0) == 0) {
     i80 = 0;
    } else {
     i80 = 0 - i57 & 7;
    }
    i57 = i77 + (i78 + -47 + i80) | 0;
    i49 = i57 >>> 0 < (i58 + 16 | 0) >>> 0 ? i58 : i57;
    i57 = i49 + 8 | 0;
    i52 = i55 + 8 | 0;
    if ((i52 & 7 | 0) == 0) {
     i81 = 0;
    } else {
     i81 = 0 - i52 & 7;
    }
    i52 = i56 + -40 - i81 | 0;
    HEAP32[5560 >> 2] = i55 + i81;
    HEAP32[5548 >> 2] = i52;
    HEAP32[i55 + (i81 + 4) >> 2] = i52 | 1;
    HEAP32[i55 + (i56 + -36) >> 2] = 40;
    HEAP32[5564 >> 2] = HEAP32[6024 >> 2];
    HEAP32[i49 + 4 >> 2] = 27;
    HEAP32[i57 + 0 >> 2] = HEAP32[5984 >> 2];
    HEAP32[i57 + 4 >> 2] = HEAP32[5988 >> 2];
    HEAP32[i57 + 8 >> 2] = HEAP32[5992 >> 2];
    HEAP32[i57 + 12 >> 2] = HEAP32[5996 >> 2];
    HEAP32[5984 >> 2] = i55;
    HEAP32[5988 >> 2] = i56;
    HEAP32[5996 >> 2] = 0;
    HEAP32[5992 >> 2] = i57;
    i57 = i49 + 28 | 0;
    HEAP32[i57 >> 2] = 7;
    if ((i49 + 32 | 0) >>> 0 < i79 >>> 0) {
     i52 = i57;
     do {
      i57 = i52;
      i52 = i52 + 4 | 0;
      HEAP32[i52 >> 2] = 7;
     } while ((i57 + 8 | 0) >>> 0 < i79 >>> 0);
    }
    if ((i49 | 0) != (i58 | 0)) {
     i52 = i49 - i58 | 0;
     i57 = i58 + (i52 + 4) | 0;
     HEAP32[i57 >> 2] = HEAP32[i57 >> 2] & -2;
     HEAP32[i58 + 4 >> 2] = i52 | 1;
     HEAP32[i58 + i52 >> 2] = i52;
     i57 = i52 >>> 3;
     if (i52 >>> 0 < 256) {
      i36 = i57 << 1;
      i53 = 5576 + (i36 << 2) | 0;
      i50 = HEAP32[1384] | 0;
      i51 = 1 << i57;
      do {
       if ((i50 & i51 | 0) == 0) {
        HEAP32[1384] = i50 | i51;
        i82 = 5576 + (i36 + 2 << 2) | 0;
        i83 = i53;
       } else {
        i57 = 5576 + (i36 + 2 << 2) | 0;
        i16 = HEAP32[i57 >> 2] | 0;
        if (!(i16 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0)) {
         i82 = i57;
         i83 = i16;
         break;
        }
        _abort();
       }
      } while (0);
      HEAP32[i82 >> 2] = i58;
      HEAP32[i83 + 12 >> 2] = i58;
      HEAP32[i58 + 8 >> 2] = i83;
      HEAP32[i58 + 12 >> 2] = i53;
      break;
     }
     i36 = i52 >>> 8;
     if ((i36 | 0) != 0) {
      if (i52 >>> 0 > 16777215) {
       i84 = 31;
      } else {
       i51 = (i36 + 1048320 | 0) >>> 16 & 8;
       i50 = i36 << i51;
       i36 = (i50 + 520192 | 0) >>> 16 & 4;
       i49 = i50 << i36;
       i50 = (i49 + 245760 | 0) >>> 16 & 2;
       i16 = 14 - (i36 | i51 | i50) + (i49 << i50 >>> 15) | 0;
       i84 = i52 >>> (i16 + 7 | 0) & 1 | i16 << 1;
      }
     } else {
      i84 = 0;
     }
     i16 = 5840 + (i84 << 2) | 0;
     HEAP32[i58 + 28 >> 2] = i84;
     HEAP32[i58 + 20 >> 2] = 0;
     HEAP32[i58 + 16 >> 2] = 0;
     i50 = HEAP32[5540 >> 2] | 0;
     i49 = 1 << i84;
     if ((i50 & i49 | 0) == 0) {
      HEAP32[5540 >> 2] = i50 | i49;
      HEAP32[i16 >> 2] = i58;
      HEAP32[i58 + 24 >> 2] = i16;
      HEAP32[i58 + 12 >> 2] = i58;
      HEAP32[i58 + 8 >> 2] = i58;
      break;
     }
     i49 = HEAP32[i16 >> 2] | 0;
     if ((i84 | 0) == 31) {
      i85 = 0;
     } else {
      i85 = 25 - (i84 >>> 1) | 0;
     }
     L489 : do {
      if ((HEAP32[i49 + 4 >> 2] & -8 | 0) != (i52 | 0)) {
       i16 = i52 << i85;
       i50 = i49;
       while (1) {
        i86 = i50 + (i16 >>> 31 << 2) + 16 | 0;
        i51 = HEAP32[i86 >> 2] | 0;
        if ((i51 | 0) == 0) {
         break;
        }
        if ((HEAP32[i51 + 4 >> 2] & -8 | 0) == (i52 | 0)) {
         i87 = i51;
         break L489;
        } else {
         i16 = i16 << 1;
         i50 = i51;
        }
       }
       if (i86 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
        _abort();
       } else {
        HEAP32[i86 >> 2] = i58;
        HEAP32[i58 + 24 >> 2] = i50;
        HEAP32[i58 + 12 >> 2] = i58;
        HEAP32[i58 + 8 >> 2] = i58;
        break L311;
       }
      } else {
       i87 = i49;
      }
     } while (0);
     i49 = i87 + 8 | 0;
     i52 = HEAP32[i49 >> 2] | 0;
     i53 = HEAP32[5552 >> 2] | 0;
     if (i87 >>> 0 < i53 >>> 0) {
      _abort();
     }
     if (i52 >>> 0 < i53 >>> 0) {
      _abort();
     } else {
      HEAP32[i52 + 12 >> 2] = i58;
      HEAP32[i49 >> 2] = i58;
      HEAP32[i58 + 8 >> 2] = i52;
      HEAP32[i58 + 12 >> 2] = i87;
      HEAP32[i58 + 24 >> 2] = 0;
      break;
     }
    }
   } else {
    i52 = HEAP32[5552 >> 2] | 0;
    if ((i52 | 0) == 0 | i55 >>> 0 < i52 >>> 0) {
     HEAP32[5552 >> 2] = i55;
    }
    HEAP32[5984 >> 2] = i55;
    HEAP32[5988 >> 2] = i56;
    HEAP32[5996 >> 2] = 0;
    HEAP32[5572 >> 2] = HEAP32[1502];
    HEAP32[5568 >> 2] = -1;
    i52 = 0;
    do {
     i49 = i52 << 1;
     i53 = 5576 + (i49 << 2) | 0;
     HEAP32[5576 + (i49 + 3 << 2) >> 2] = i53;
     HEAP32[5576 + (i49 + 2 << 2) >> 2] = i53;
     i52 = i52 + 1 | 0;
    } while ((i52 | 0) != 32);
    i52 = i55 + 8 | 0;
    if ((i52 & 7 | 0) == 0) {
     i88 = 0;
    } else {
     i88 = 0 - i52 & 7;
    }
    i52 = i56 + -40 - i88 | 0;
    HEAP32[5560 >> 2] = i55 + i88;
    HEAP32[5548 >> 2] = i52;
    HEAP32[i55 + (i88 + 4) >> 2] = i52 | 1;
    HEAP32[i55 + (i56 + -36) >> 2] = 40;
    HEAP32[5564 >> 2] = HEAP32[6024 >> 2];
   }
  } while (0);
  i56 = HEAP32[5548 >> 2] | 0;
  if (i56 >>> 0 > i26 >>> 0) {
   i55 = i56 - i26 | 0;
   HEAP32[5548 >> 2] = i55;
   i56 = HEAP32[5560 >> 2] | 0;
   HEAP32[5560 >> 2] = i56 + i26;
   HEAP32[i56 + (i26 + 4) >> 2] = i55 | 1;
   HEAP32[i56 + 4 >> 2] = i26 | 3;
   i14 = i56 + 8 | 0;
   STACKTOP = i2;
   return i14 | 0;
  }
 }
 HEAP32[(___errno_location() | 0) >> 2] = 12;
 i14 = 0;
 STACKTOP = i2;
 return i14 | 0;
}
function _free(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0;
 i2 = STACKTOP;
 if ((i1 | 0) == 0) {
  STACKTOP = i2;
  return;
 }
 i3 = i1 + -8 | 0;
 i4 = HEAP32[5552 >> 2] | 0;
 if (i3 >>> 0 < i4 >>> 0) {
  _abort();
 }
 i5 = HEAP32[i1 + -4 >> 2] | 0;
 i6 = i5 & 3;
 if ((i6 | 0) == 1) {
  _abort();
 }
 i7 = i5 & -8;
 i8 = i1 + (i7 + -8) | 0;
 do {
  if ((i5 & 1 | 0) == 0) {
   i9 = HEAP32[i3 >> 2] | 0;
   if ((i6 | 0) == 0) {
    STACKTOP = i2;
    return;
   }
   i10 = -8 - i9 | 0;
   i11 = i1 + i10 | 0;
   i12 = i9 + i7 | 0;
   if (i11 >>> 0 < i4 >>> 0) {
    _abort();
   }
   if ((i11 | 0) == (HEAP32[5556 >> 2] | 0)) {
    i13 = i1 + (i7 + -4) | 0;
    if ((HEAP32[i13 >> 2] & 3 | 0) != 3) {
     i14 = i11;
     i15 = i12;
     break;
    }
    HEAP32[5544 >> 2] = i12;
    HEAP32[i13 >> 2] = HEAP32[i13 >> 2] & -2;
    HEAP32[i1 + (i10 + 4) >> 2] = i12 | 1;
    HEAP32[i8 >> 2] = i12;
    STACKTOP = i2;
    return;
   }
   i13 = i9 >>> 3;
   if (i9 >>> 0 < 256) {
    i9 = HEAP32[i1 + (i10 + 8) >> 2] | 0;
    i16 = HEAP32[i1 + (i10 + 12) >> 2] | 0;
    i17 = 5576 + (i13 << 1 << 2) | 0;
    if ((i9 | 0) != (i17 | 0)) {
     if (i9 >>> 0 < i4 >>> 0) {
      _abort();
     }
     if ((HEAP32[i9 + 12 >> 2] | 0) != (i11 | 0)) {
      _abort();
     }
    }
    if ((i16 | 0) == (i9 | 0)) {
     HEAP32[1384] = HEAP32[1384] & ~(1 << i13);
     i14 = i11;
     i15 = i12;
     break;
    }
    if ((i16 | 0) != (i17 | 0)) {
     if (i16 >>> 0 < i4 >>> 0) {
      _abort();
     }
     i17 = i16 + 8 | 0;
     if ((HEAP32[i17 >> 2] | 0) == (i11 | 0)) {
      i18 = i17;
     } else {
      _abort();
     }
    } else {
     i18 = i16 + 8 | 0;
    }
    HEAP32[i9 + 12 >> 2] = i16;
    HEAP32[i18 >> 2] = i9;
    i14 = i11;
    i15 = i12;
    break;
   }
   i9 = HEAP32[i1 + (i10 + 24) >> 2] | 0;
   i16 = HEAP32[i1 + (i10 + 12) >> 2] | 0;
   do {
    if ((i16 | 0) == (i11 | 0)) {
     i17 = i1 + (i10 + 20) | 0;
     i13 = HEAP32[i17 >> 2] | 0;
     if ((i13 | 0) == 0) {
      i19 = i1 + (i10 + 16) | 0;
      i20 = HEAP32[i19 >> 2] | 0;
      if ((i20 | 0) == 0) {
       i21 = 0;
       break;
      } else {
       i22 = i20;
       i23 = i19;
      }
     } else {
      i22 = i13;
      i23 = i17;
     }
     while (1) {
      i17 = i22 + 20 | 0;
      i13 = HEAP32[i17 >> 2] | 0;
      if ((i13 | 0) != 0) {
       i22 = i13;
       i23 = i17;
       continue;
      }
      i17 = i22 + 16 | 0;
      i13 = HEAP32[i17 >> 2] | 0;
      if ((i13 | 0) == 0) {
       break;
      } else {
       i22 = i13;
       i23 = i17;
      }
     }
     if (i23 >>> 0 < i4 >>> 0) {
      _abort();
     } else {
      HEAP32[i23 >> 2] = 0;
      i21 = i22;
      break;
     }
    } else {
     i17 = HEAP32[i1 + (i10 + 8) >> 2] | 0;
     if (i17 >>> 0 < i4 >>> 0) {
      _abort();
     }
     i13 = i17 + 12 | 0;
     if ((HEAP32[i13 >> 2] | 0) != (i11 | 0)) {
      _abort();
     }
     i19 = i16 + 8 | 0;
     if ((HEAP32[i19 >> 2] | 0) == (i11 | 0)) {
      HEAP32[i13 >> 2] = i16;
      HEAP32[i19 >> 2] = i17;
      i21 = i16;
      break;
     } else {
      _abort();
     }
    }
   } while (0);
   if ((i9 | 0) != 0) {
    i16 = HEAP32[i1 + (i10 + 28) >> 2] | 0;
    i17 = 5840 + (i16 << 2) | 0;
    if ((i11 | 0) == (HEAP32[i17 >> 2] | 0)) {
     HEAP32[i17 >> 2] = i21;
     if ((i21 | 0) == 0) {
      HEAP32[5540 >> 2] = HEAP32[5540 >> 2] & ~(1 << i16);
      i14 = i11;
      i15 = i12;
      break;
     }
    } else {
     if (i9 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
      _abort();
     }
     i16 = i9 + 16 | 0;
     if ((HEAP32[i16 >> 2] | 0) == (i11 | 0)) {
      HEAP32[i16 >> 2] = i21;
     } else {
      HEAP32[i9 + 20 >> 2] = i21;
     }
     if ((i21 | 0) == 0) {
      i14 = i11;
      i15 = i12;
      break;
     }
    }
    if (i21 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
     _abort();
    }
    HEAP32[i21 + 24 >> 2] = i9;
    i16 = HEAP32[i1 + (i10 + 16) >> 2] | 0;
    do {
     if ((i16 | 0) != 0) {
      if (i16 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
       _abort();
      } else {
       HEAP32[i21 + 16 >> 2] = i16;
       HEAP32[i16 + 24 >> 2] = i21;
       break;
      }
     }
    } while (0);
    i16 = HEAP32[i1 + (i10 + 20) >> 2] | 0;
    if ((i16 | 0) != 0) {
     if (i16 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
      _abort();
     } else {
      HEAP32[i21 + 20 >> 2] = i16;
      HEAP32[i16 + 24 >> 2] = i21;
      i14 = i11;
      i15 = i12;
      break;
     }
    } else {
     i14 = i11;
     i15 = i12;
    }
   } else {
    i14 = i11;
    i15 = i12;
   }
  } else {
   i14 = i3;
   i15 = i7;
  }
 } while (0);
 if (!(i14 >>> 0 < i8 >>> 0)) {
  _abort();
 }
 i3 = i1 + (i7 + -4) | 0;
 i21 = HEAP32[i3 >> 2] | 0;
 if ((i21 & 1 | 0) == 0) {
  _abort();
 }
 if ((i21 & 2 | 0) == 0) {
  if ((i8 | 0) == (HEAP32[5560 >> 2] | 0)) {
   i4 = (HEAP32[5548 >> 2] | 0) + i15 | 0;
   HEAP32[5548 >> 2] = i4;
   HEAP32[5560 >> 2] = i14;
   HEAP32[i14 + 4 >> 2] = i4 | 1;
   if ((i14 | 0) != (HEAP32[5556 >> 2] | 0)) {
    STACKTOP = i2;
    return;
   }
   HEAP32[5556 >> 2] = 0;
   HEAP32[5544 >> 2] = 0;
   STACKTOP = i2;
   return;
  }
  if ((i8 | 0) == (HEAP32[5556 >> 2] | 0)) {
   i4 = (HEAP32[5544 >> 2] | 0) + i15 | 0;
   HEAP32[5544 >> 2] = i4;
   HEAP32[5556 >> 2] = i14;
   HEAP32[i14 + 4 >> 2] = i4 | 1;
   HEAP32[i14 + i4 >> 2] = i4;
   STACKTOP = i2;
   return;
  }
  i4 = (i21 & -8) + i15 | 0;
  i22 = i21 >>> 3;
  do {
   if (!(i21 >>> 0 < 256)) {
    i23 = HEAP32[i1 + (i7 + 16) >> 2] | 0;
    i18 = HEAP32[i1 + (i7 | 4) >> 2] | 0;
    do {
     if ((i18 | 0) == (i8 | 0)) {
      i6 = i1 + (i7 + 12) | 0;
      i5 = HEAP32[i6 >> 2] | 0;
      if ((i5 | 0) == 0) {
       i16 = i1 + (i7 + 8) | 0;
       i9 = HEAP32[i16 >> 2] | 0;
       if ((i9 | 0) == 0) {
        i24 = 0;
        break;
       } else {
        i25 = i9;
        i26 = i16;
       }
      } else {
       i25 = i5;
       i26 = i6;
      }
      while (1) {
       i6 = i25 + 20 | 0;
       i5 = HEAP32[i6 >> 2] | 0;
       if ((i5 | 0) != 0) {
        i25 = i5;
        i26 = i6;
        continue;
       }
       i6 = i25 + 16 | 0;
       i5 = HEAP32[i6 >> 2] | 0;
       if ((i5 | 0) == 0) {
        break;
       } else {
        i25 = i5;
        i26 = i6;
       }
      }
      if (i26 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
       _abort();
      } else {
       HEAP32[i26 >> 2] = 0;
       i24 = i25;
       break;
      }
     } else {
      i6 = HEAP32[i1 + i7 >> 2] | 0;
      if (i6 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
       _abort();
      }
      i5 = i6 + 12 | 0;
      if ((HEAP32[i5 >> 2] | 0) != (i8 | 0)) {
       _abort();
      }
      i16 = i18 + 8 | 0;
      if ((HEAP32[i16 >> 2] | 0) == (i8 | 0)) {
       HEAP32[i5 >> 2] = i18;
       HEAP32[i16 >> 2] = i6;
       i24 = i18;
       break;
      } else {
       _abort();
      }
     }
    } while (0);
    if ((i23 | 0) != 0) {
     i18 = HEAP32[i1 + (i7 + 20) >> 2] | 0;
     i12 = 5840 + (i18 << 2) | 0;
     if ((i8 | 0) == (HEAP32[i12 >> 2] | 0)) {
      HEAP32[i12 >> 2] = i24;
      if ((i24 | 0) == 0) {
       HEAP32[5540 >> 2] = HEAP32[5540 >> 2] & ~(1 << i18);
       break;
      }
     } else {
      if (i23 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
       _abort();
      }
      i18 = i23 + 16 | 0;
      if ((HEAP32[i18 >> 2] | 0) == (i8 | 0)) {
       HEAP32[i18 >> 2] = i24;
      } else {
       HEAP32[i23 + 20 >> 2] = i24;
      }
      if ((i24 | 0) == 0) {
       break;
      }
     }
     if (i24 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
      _abort();
     }
     HEAP32[i24 + 24 >> 2] = i23;
     i18 = HEAP32[i1 + (i7 + 8) >> 2] | 0;
     do {
      if ((i18 | 0) != 0) {
       if (i18 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
        _abort();
       } else {
        HEAP32[i24 + 16 >> 2] = i18;
        HEAP32[i18 + 24 >> 2] = i24;
        break;
       }
      }
     } while (0);
     i18 = HEAP32[i1 + (i7 + 12) >> 2] | 0;
     if ((i18 | 0) != 0) {
      if (i18 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
       _abort();
      } else {
       HEAP32[i24 + 20 >> 2] = i18;
       HEAP32[i18 + 24 >> 2] = i24;
       break;
      }
     }
    }
   } else {
    i18 = HEAP32[i1 + i7 >> 2] | 0;
    i23 = HEAP32[i1 + (i7 | 4) >> 2] | 0;
    i12 = 5576 + (i22 << 1 << 2) | 0;
    if ((i18 | 0) != (i12 | 0)) {
     if (i18 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
      _abort();
     }
     if ((HEAP32[i18 + 12 >> 2] | 0) != (i8 | 0)) {
      _abort();
     }
    }
    if ((i23 | 0) == (i18 | 0)) {
     HEAP32[1384] = HEAP32[1384] & ~(1 << i22);
     break;
    }
    if ((i23 | 0) != (i12 | 0)) {
     if (i23 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
      _abort();
     }
     i12 = i23 + 8 | 0;
     if ((HEAP32[i12 >> 2] | 0) == (i8 | 0)) {
      i27 = i12;
     } else {
      _abort();
     }
    } else {
     i27 = i23 + 8 | 0;
    }
    HEAP32[i18 + 12 >> 2] = i23;
    HEAP32[i27 >> 2] = i18;
   }
  } while (0);
  HEAP32[i14 + 4 >> 2] = i4 | 1;
  HEAP32[i14 + i4 >> 2] = i4;
  if ((i14 | 0) == (HEAP32[5556 >> 2] | 0)) {
   HEAP32[5544 >> 2] = i4;
   STACKTOP = i2;
   return;
  } else {
   i28 = i4;
  }
 } else {
  HEAP32[i3 >> 2] = i21 & -2;
  HEAP32[i14 + 4 >> 2] = i15 | 1;
  HEAP32[i14 + i15 >> 2] = i15;
  i28 = i15;
 }
 i15 = i28 >>> 3;
 if (i28 >>> 0 < 256) {
  i21 = i15 << 1;
  i3 = 5576 + (i21 << 2) | 0;
  i4 = HEAP32[1384] | 0;
  i27 = 1 << i15;
  if ((i4 & i27 | 0) != 0) {
   i15 = 5576 + (i21 + 2 << 2) | 0;
   i8 = HEAP32[i15 >> 2] | 0;
   if (i8 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
    _abort();
   } else {
    i29 = i15;
    i30 = i8;
   }
  } else {
   HEAP32[1384] = i4 | i27;
   i29 = 5576 + (i21 + 2 << 2) | 0;
   i30 = i3;
  }
  HEAP32[i29 >> 2] = i14;
  HEAP32[i30 + 12 >> 2] = i14;
  HEAP32[i14 + 8 >> 2] = i30;
  HEAP32[i14 + 12 >> 2] = i3;
  STACKTOP = i2;
  return;
 }
 i3 = i28 >>> 8;
 if ((i3 | 0) != 0) {
  if (i28 >>> 0 > 16777215) {
   i31 = 31;
  } else {
   i30 = (i3 + 1048320 | 0) >>> 16 & 8;
   i29 = i3 << i30;
   i3 = (i29 + 520192 | 0) >>> 16 & 4;
   i21 = i29 << i3;
   i29 = (i21 + 245760 | 0) >>> 16 & 2;
   i27 = 14 - (i3 | i30 | i29) + (i21 << i29 >>> 15) | 0;
   i31 = i28 >>> (i27 + 7 | 0) & 1 | i27 << 1;
  }
 } else {
  i31 = 0;
 }
 i27 = 5840 + (i31 << 2) | 0;
 HEAP32[i14 + 28 >> 2] = i31;
 HEAP32[i14 + 20 >> 2] = 0;
 HEAP32[i14 + 16 >> 2] = 0;
 i29 = HEAP32[5540 >> 2] | 0;
 i21 = 1 << i31;
 L199 : do {
  if ((i29 & i21 | 0) != 0) {
   i30 = HEAP32[i27 >> 2] | 0;
   if ((i31 | 0) == 31) {
    i32 = 0;
   } else {
    i32 = 25 - (i31 >>> 1) | 0;
   }
   L205 : do {
    if ((HEAP32[i30 + 4 >> 2] & -8 | 0) != (i28 | 0)) {
     i3 = i28 << i32;
     i4 = i30;
     while (1) {
      i33 = i4 + (i3 >>> 31 << 2) + 16 | 0;
      i8 = HEAP32[i33 >> 2] | 0;
      if ((i8 | 0) == 0) {
       break;
      }
      if ((HEAP32[i8 + 4 >> 2] & -8 | 0) == (i28 | 0)) {
       i34 = i8;
       break L205;
      } else {
       i3 = i3 << 1;
       i4 = i8;
      }
     }
     if (i33 >>> 0 < (HEAP32[5552 >> 2] | 0) >>> 0) {
      _abort();
     } else {
      HEAP32[i33 >> 2] = i14;
      HEAP32[i14 + 24 >> 2] = i4;
      HEAP32[i14 + 12 >> 2] = i14;
      HEAP32[i14 + 8 >> 2] = i14;
      break L199;
     }
    } else {
     i34 = i30;
    }
   } while (0);
   i30 = i34 + 8 | 0;
   i3 = HEAP32[i30 >> 2] | 0;
   i8 = HEAP32[5552 >> 2] | 0;
   if (i34 >>> 0 < i8 >>> 0) {
    _abort();
   }
   if (i3 >>> 0 < i8 >>> 0) {
    _abort();
   } else {
    HEAP32[i3 + 12 >> 2] = i14;
    HEAP32[i30 >> 2] = i14;
    HEAP32[i14 + 8 >> 2] = i3;
    HEAP32[i14 + 12 >> 2] = i34;
    HEAP32[i14 + 24 >> 2] = 0;
    break;
   }
  } else {
   HEAP32[5540 >> 2] = i29 | i21;
   HEAP32[i27 >> 2] = i14;
   HEAP32[i14 + 24 >> 2] = i27;
   HEAP32[i14 + 12 >> 2] = i14;
   HEAP32[i14 + 8 >> 2] = i14;
  }
 } while (0);
 i14 = (HEAP32[5568 >> 2] | 0) + -1 | 0;
 HEAP32[5568 >> 2] = i14;
 if ((i14 | 0) == 0) {
  i35 = 5992 | 0;
 } else {
  STACKTOP = i2;
  return;
 }
 while (1) {
  i14 = HEAP32[i35 >> 2] | 0;
  if ((i14 | 0) == 0) {
   break;
  } else {
   i35 = i14 + 8 | 0;
  }
 }
 HEAP32[5568 >> 2] = -1;
 STACKTOP = i2;
 return;
}
function _aa_mktable(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, i42 = 0, i43 = 0, i44 = 0, i45 = 0, i46 = 0, i47 = 0, i48 = 0, i49 = 0, i50 = 0, i51 = 0;
 i2 = STACKTOP;
 i3 = HEAP32[i1 + 16 >> 2] | 0;
 i4 = HEAP32[i1 + 20 >> 2] | 0;
 i5 = _malloc(131072) | 0;
 i6 = _calloc(1, 25620) | 0;
 HEAP32[1366] = i6;
 i7 = _calloc(1, 131072) | 0;
 i8 = _calloc(1, 512) | 0;
 _memset(i7 | 0, 0, 131072) | 0;
 i9 = 0;
 do {
  HEAP16[i5 + (i9 << 1) >> 1] = i9;
  i9 = i9 + 1 | 0;
 } while ((i9 | 0) != 65536);
 ___aa_calcparams(i3, i6, i4, +HEAPF64[i1 + 64 >> 3], +HEAPF64[i1 + 72 >> 3]);
 i6 = (i4 & 256 | 0) == 0;
 i3 = (i4 & 128 | 0) == 0;
 i9 = -1;
 i10 = 0;
 i11 = -1;
 while (1) {
  i12 = i10 & 255;
  if (!((_isgraph(i12) | 0) != 0 | (i12 | 0) == 32) ? (i12 >>> 0 < 161 | i6) & (i3 | (i12 | 0) == 0) : 0) {
   i13 = i9;
   i14 = i11;
  } else {
   i15 = 6;
  }
  do {
   if ((i15 | 0) == 6) {
    i15 = 0;
    if ((1 << (i10 >> 8) & i4 | 0) != 0) {
     i12 = HEAP32[1366] | 0;
     i16 = HEAP32[i12 + (i10 * 20 | 0) >> 2] | 0;
     i17 = HEAP32[i12 + (i10 * 20 | 0) + 4 >> 2] | 0;
     i18 = HEAP32[i12 + (i10 * 20 | 0) + 8 >> 2] | 0;
     i19 = HEAP32[i12 + (i10 * 20 | 0) + 12 >> 2] | 0;
     i20 = i16 >> 4;
     i21 = i17 >> 4;
     i22 = i18 >> 4;
     i23 = i19 >> 4;
     i24 = i22 << 4;
     i25 = (i21 << 8) + (i20 << 12) + i24 + i23 | 0;
     i26 = i7 + (i25 << 1) | 0;
     i27 = HEAP16[i26 >> 1] | 0;
     if (!(i27 << 16 >> 16 == 0) ? (i28 = i21 * 17 | 0, i29 = i24 + i22 | 0, i22 = i23 * 17 | 0, i23 = i29 + ((i21 + i20 | 0) * 17 | 0) + i22 | 0, i21 = (Math_imul(i20, -17) | 0) + i16 | 0, i16 = i17 - i28 | 0, i17 = i18 - i29 | 0, i18 = i19 - i22 | 0, i19 = (Math_imul(i16, i16) | 0) + (Math_imul(i21, i21) | 0) + (Math_imul(i18, i18) | 0) + (Math_imul(i17, i17) | 0) << 1, i17 = (HEAP32[i12 + (i10 * 20 | 0) + 16 >> 2] | 0) - i23 | 0, i18 = (Math_imul(i17, i17) | 0) + i19 | 0, i19 = i27 & 65535, i27 = (HEAP32[i12 + (i19 * 20 | 0) >> 2] | 0) - i18 | 0, i17 = Math_imul(i27, i27) | 0, i27 = (HEAP32[i12 + (i19 * 20 | 0) + 4 >> 2] | 0) - i28 | 0, i21 = Math_imul(i27, i27) | 0, i27 = (HEAP32[i12 + (i19 * 20 | 0) + 8 >> 2] | 0) - i29 | 0, i29 = Math_imul(i27, i27) | 0, i27 = (HEAP32[i12 + (i19 * 20 | 0) + 12 >> 2] | 0) - i22 | 0, i22 = i17 + i21 + i29 + (Math_imul(i27, i27) | 0) << 1, i27 = (HEAP32[i12 + (i19 * 20 | 0) + 16 >> 2] | 0) - i23 | 0, i23 = i22 + (Math_imul(i27, i27) | 0) | 0, (i18 | 0) >= (i23 | 0)) : 0) {
      if ((i23 | 0) != (i28 | 0)) {
       i13 = i9;
       i14 = i11;
       break;
      }
      if ((HEAP32[5472 + (((i10 | 0) / 256 | 0) << 2) >> 2] | 0) <= (HEAP32[5472 + (i19 >>> 8 << 2) >> 2] | 0)) {
       i13 = i9;
       i14 = i11;
       break;
      }
     }
     HEAP16[i26 >> 1] = i10;
     if (!((i11 | 0) == (i25 | 0) ? 1 : (HEAPU16[i5 + (i25 << 1) >> 1] | 0 | 0) != (i25 | 0))) {
      if ((i11 | 0) == -1) {
       i13 = i25;
       i14 = i25;
      } else {
       HEAP16[i5 + (i11 << 1) >> 1] = i25;
       i13 = i9;
       i14 = i25;
      }
     } else {
      i13 = i9;
      i14 = i11;
     }
    } else {
     i13 = i9;
     i14 = i11;
    }
   }
  } while (0);
  i10 = i10 + 1 | 0;
  if ((i10 | 0) == 1280) {
   i30 = 0;
   break;
  } else {
   i9 = i13;
   i11 = i14;
  }
 }
 do {
  i11 = i30 << 2;
  i9 = i8 + (i30 << 1) | 0;
  i10 = 0;
  i25 = 2147483647;
  while (1) {
   i26 = i10 & 255;
   if (!((_isgraph(i26) | 0) != 0 | (i26 | 0) == 32) ? (i26 >>> 0 < 161 | i6) & (i3 | (i26 | 0) == 0) : 0) {
    i31 = i25;
   } else {
    i15 = 18;
   }
   do {
    if ((i15 | 0) == 18) {
     i15 = 0;
     if ((1 << (i10 >> 8) & i4 | 0) != 0 ? (i26 = HEAP32[1366] | 0, i19 = (HEAP32[i26 + (i10 * 20 | 0) >> 2] | 0) - i30 | 0, i28 = Math_imul(i19, i19) | 0, i19 = (HEAP32[i26 + (i10 * 20 | 0) + 4 >> 2] | 0) - i30 | 0, i23 = Math_imul(i19, i19) | 0, i19 = (HEAP32[i26 + (i10 * 20 | 0) + 8 >> 2] | 0) - i30 | 0, i18 = Math_imul(i19, i19) | 0, i19 = (HEAP32[i26 + (i10 * 20 | 0) + 12 >> 2] | 0) - i30 | 0, i27 = Math_imul(i19, i19) | 0, i19 = (HEAP32[i26 + (i10 * 20 | 0) + 16 >> 2] | 0) - i11 | 0, i26 = i23 + i28 + i18 + i27 + (Math_imul(i19 << 1, i19) | 0) | 0, (i26 | 0) <= (i25 | 0)) : 0) {
      if ((i26 | 0) == (i25 | 0) ? (HEAP32[5472 + (((i10 | 0) / 256 | 0) << 2) >> 2] | 0) <= (HEAP32[5472 + ((HEAPU16[i9 >> 1] | 0) >>> 8 << 2) >> 2] | 0) : 0) {
       i31 = i25;
       break;
      }
      HEAP16[i9 >> 1] = i10;
      i31 = i26;
     } else {
      i31 = i25;
     }
    }
   } while (0);
   i10 = i10 + 1 | 0;
   if ((i10 | 0) == 1280) {
    break;
   } else {
    i25 = i31;
   }
  }
  i30 = i30 + 1 | 0;
 } while ((i30 | 0) != 256);
 if ((i14 | 0) == -1) {
  i32 = i1 + 172 | 0;
  HEAP32[i32 >> 2] = i7;
  i33 = i1 + 176 | 0;
  HEAP32[i33 >> 2] = i8;
  i34 = HEAP32[1366] | 0;
  i35 = i1 + 180 | 0;
  HEAP32[i35 >> 2] = i34;
  _free(i5);
  STACKTOP = i2;
  return i7 | 0;
 }
 i30 = HEAP32[1366] | 0;
 i31 = i13;
 i13 = i14;
 while (1) {
  HEAP16[i5 + (i13 << 1) >> 1] = i13;
  if ((i31 | 0) == -1) {
   i15 = 45;
   break;
  } else {
   i36 = -1;
   i37 = i31;
   i38 = -1;
  }
  while (1) {
   i14 = HEAP16[i7 + (i37 << 1) >> 1] | 0;
   i4 = i37 >> 12;
   i3 = i37 >>> 8 & 15;
   i6 = i37 >>> 4 & 15;
   i25 = i37 & 15;
   i10 = i14 & 65535;
   i9 = i30 + (i10 * 20 | 0) | 0;
   i11 = i30 + (i10 * 20 | 0) + 4 | 0;
   i26 = i30 + (i10 * 20 | 0) + 8 | 0;
   i19 = i30 + (i10 * 20 | 0) + 12 | 0;
   i27 = i30 + (i10 * 20 | 0) + 16 | 0;
   i10 = 0;
   i18 = i36;
   i28 = i38;
   while (1) {
    i23 = i18;
    i22 = -1;
    i12 = i28;
    while (1) {
     if ((i10 | 0) == 0) {
      i29 = i22 + i4 | 0;
      if (i29 >>> 0 > 15) {
       i39 = i23;
       i40 = i12;
      } else {
       i41 = i29;
       i42 = i3;
       i43 = i6;
       i44 = i25;
       i15 = 35;
      }
     } else if ((i10 | 0) == 1) {
      i29 = i22 + i3 | 0;
      if (i29 >>> 0 > 15) {
       i39 = i23;
       i40 = i12;
      } else {
       i41 = i4;
       i42 = i29;
       i43 = i6;
       i44 = i25;
       i15 = 35;
      }
     } else if ((i10 | 0) == 2) {
      i29 = i22 + i6 | 0;
      if (i29 >>> 0 > 15) {
       i39 = i23;
       i40 = i12;
      } else {
       i41 = i4;
       i42 = i3;
       i43 = i29;
       i44 = i25;
       i15 = 35;
      }
     } else if ((i10 | 0) == 3) {
      i29 = i22 + i25 | 0;
      if (i29 >>> 0 > 15) {
       i39 = i23;
       i40 = i12;
      } else {
       i41 = i4;
       i42 = i3;
       i43 = i6;
       i44 = i29;
       i15 = 35;
      }
     } else {
      i41 = i4;
      i42 = i3;
      i43 = i6;
      i44 = i25;
      i15 = 35;
     }
     do {
      if ((i15 | 0) == 35) {
       i15 = 0;
       i29 = i43 << 4;
       i21 = i29 + i44 + (i42 << 8) + (i41 << 12) | 0;
       i17 = i7 + (i21 << 1) | 0;
       i16 = HEAP16[i17 >> 1] | 0;
       i20 = i16 & 65535;
       if (!((i21 | 0) == (i13 | 0) ? 1 : i16 << 16 >> 16 == i14 << 16 >> 16)) {
        if (!(i16 << 16 >> 16 == 0) ? (i16 = i41 * 17 | 0, i24 = i42 * 17 | 0, i45 = i29 + i43 | 0, i29 = i44 * 17 | 0, i46 = i45 + i29 + ((i41 + i42 | 0) * 17 | 0) | 0, i47 = i16 - (HEAP32[i9 >> 2] | 0) | 0, i48 = Math_imul(i47, i47) | 0, i47 = i24 - (HEAP32[i11 >> 2] | 0) | 0, i49 = Math_imul(i47, i47) | 0, i47 = i45 - (HEAP32[i26 >> 2] | 0) | 0, i50 = Math_imul(i47, i47) | 0, i47 = i29 - (HEAP32[i19 >> 2] | 0) | 0, i51 = i49 + i48 + i50 + (Math_imul(i47, i47) | 0) << 1, i47 = i46 - (HEAP32[i27 >> 2] | 0) | 0, i50 = i51 + (Math_imul(i47, i47) | 0) | 0, i47 = i16 - (HEAP32[i30 + (i20 * 20 | 0) >> 2] | 0) | 0, i16 = Math_imul(i47, i47) | 0, i47 = i24 - (HEAP32[i30 + (i20 * 20 | 0) + 4 >> 2] | 0) | 0, i24 = Math_imul(i47, i47) | 0, i47 = i45 - (HEAP32[i30 + (i20 * 20 | 0) + 8 >> 2] | 0) | 0, i45 = Math_imul(i47, i47) | 0, i47 = i29 - (HEAP32[i30 + (i20 * 20 | 0) + 12 >> 2] | 0) | 0, i29 = i24 + i16 + i45 + (Math_imul(i47, i47) | 0) << 1, i47 = i46 - (HEAP32[i30 + (i20 * 20 | 0) + 16 >> 2] | 0) | 0, (i50 | 0) >= (i29 + (Math_imul(i47, i47) | 0) | 0)) : 0) {
         i39 = i23;
         i40 = i12;
         break;
        }
        HEAP16[i17 >> 1] = i14;
        if (!((i12 | 0) == (i21 | 0) ? 1 : (HEAPU16[i5 + (i21 << 1) >> 1] | 0 | 0) != (i21 | 0))) {
         if ((i12 | 0) == -1) {
          i39 = i21;
          i40 = i21;
         } else {
          HEAP16[i5 + (i12 << 1) >> 1] = i21;
          i39 = i23;
          i40 = i21;
         }
        } else {
         i39 = i23;
         i40 = i12;
        }
       } else {
        i39 = i23;
        i40 = i12;
       }
      }
     } while (0);
     if ((i22 | 0) < 0) {
      i23 = i39;
      i22 = i22 + 2 | 0;
      i12 = i40;
     } else {
      break;
     }
    }
    i10 = i10 + 1 | 0;
    if ((i10 | 0) == 4) {
     break;
    } else {
     i18 = i39;
     i28 = i40;
    }
   }
   i28 = i5 + (i37 << 1) | 0;
   i18 = i37;
   i37 = HEAPU16[i28 >> 1] | 0;
   HEAP16[i28 >> 1] = i18;
   if ((i37 | 0) == (i18 | 0)) {
    break;
   } else {
    i36 = i39;
    i38 = i40;
   }
  }
  if ((i40 | 0) == -1) {
   i15 = 45;
   break;
  } else {
   i31 = i39;
   i13 = i40;
  }
 }
 if ((i15 | 0) == 45) {
  i32 = i1 + 172 | 0;
  HEAP32[i32 >> 2] = i7;
  i33 = i1 + 176 | 0;
  HEAP32[i33 >> 2] = i8;
  i34 = HEAP32[1366] | 0;
  i35 = i1 + 180 | 0;
  HEAP32[i35 >> 2] = i34;
  _free(i5);
  STACKTOP = i2;
  return i7 | 0;
 }
 return 0;
}
function _aa_renderpalette(i1, i2, i3, i4, i5, i6, i7) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 i7 = i7 | 0;
 var i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, i42 = 0, i43 = 0, i44 = 0, i45 = 0, i46 = 0, i47 = 0, i48 = 0, i49 = 0, i50 = 0, i51 = 0, i52 = 0, i53 = 0, i54 = 0, i55 = 0, i56 = 0, i57 = 0, i58 = 0, i59 = 0, i60 = 0, i61 = 0, i62 = 0, i63 = 0, i64 = 0, i65 = 0, i66 = 0, i67 = 0, i68 = 0, i69 = 0, i70 = 0;
 i8 = STACKTOP;
 STACKTOP = STACKTOP + 1040 | 0;
 i9 = i8 + 1024 | 0;
 i10 = i8;
 i11 = HEAP32[i1 + 152 >> 2] | 0;
 i12 = i3 + 8 | 0;
 i13 = +HEAPF32[i12 >> 2] != 1.0;
 i14 = HEAP32[i3 + 20 >> 2] | 0;
 i15 = HEAP32[i3 + 12 >> 2] | 0;
 if ((i7 | i6 | 0) < 0) {
  STACKTOP = i8;
  return;
 }
 i16 = i1 + 56 | 0;
 i17 = HEAP32[i16 >> 2] | 0;
 if ((i17 | 0) < (i4 | 0)) {
  STACKTOP = i8;
  return;
 }
 i18 = HEAP32[i1 + 60 >> 2] | 0;
 if ((i18 | 0) < (i5 | 0)) {
  STACKTOP = i8;
  return;
 }
 i19 = (i17 | 0) > (i6 | 0) ? i6 : i17;
 i20 = (i18 | 0) > (i7 | 0) ? i7 : i18;
 i21 = (i4 | 0) < 0 ? 0 : i4;
 i4 = (i5 | 0) < 0 ? 0 : i5;
 i5 = i1 + 172 | 0;
 if ((HEAP32[i5 >> 2] | 0) == 0) {
  _aa_mktable(i1) | 0;
 }
 if ((i15 | 0) == 2) {
  i22 = (i19 << 2) + 20 | 0;
  i23 = _calloc(1, i22) | 0;
  i24 = i23 + 12 | 0;
  HEAP32[i9 >> 2] = i24;
  i25 = _calloc(1, i22) | 0;
  i22 = i9 + 4 | 0;
  HEAP32[i22 >> 2] = i25;
  if ((i25 | 0) == 0) {
   _free(i24);
   i26 = 1;
  } else {
   i26 = (i23 | 0) == 0 ? 1 : 2;
  }
  HEAP32[i22 >> 2] = i25 + 12;
  i27 = i24;
  i28 = i26;
 } else {
  i27 = 0;
  i28 = i15;
 }
 i15 = HEAP32[i3 >> 2] | 0;
 i26 = HEAP32[i3 + 4 >> 2] | 0;
 i24 = (i26 | 0) == 0;
 i25 = (HEAP32[i3 + 16 >> 2] | 0) == 0;
 i3 = 256 - i26 | 0;
 i22 = 255 - (i26 << 1) | 0;
 i23 = 0;
 do {
  i29 = i15 + (HEAP32[i2 + (i23 << 2) >> 2] | 0) | 0;
  i30 = (i29 | 0) > 255 ? 255 : i29;
  i29 = (i30 | 0) < 0 ? 0 : i30;
  if (!i24) {
   if ((i29 | 0) >= (i26 | 0)) {
    if ((i29 | 0) > (i3 | 0)) {
     i31 = 255;
    } else {
     i31 = ((i29 - i26 | 0) * 255 | 0) / (i22 | 0) | 0;
    }
   } else {
    i31 = 0;
   }
  } else {
   i31 = i29;
  }
  if (i13) {
   i32 = ~~(+Math_pow(+(+(i31 | 0) / 255.0), +(+HEAPF32[i12 >> 2])) * 255.0 + .5);
  } else {
   i32 = i31;
  }
  i29 = i25 ? i32 : 255 - i32 | 0;
  if ((i29 | 0) > 255) {
   i33 = 255;
  } else {
   i33 = (i29 | 0) < 0 ? 0 : i29;
  }
  HEAP32[i10 + (i23 << 2) >> 2] = i33;
  i23 = i23 + 1 | 0;
 } while ((i23 | 0) != 256);
 if ((i14 | 0) == 0) {
  i34 = 0;
 } else {
  i34 = (i14 | 0) / 2 | 0;
 }
 i23 = i1 + 176 | 0;
 i33 = i1 + 180 | 0;
 i32 = HEAP32[(HEAP32[i33 >> 2] | 0) + ((HEAPU16[(HEAP32[i23 >> 2] | 0) + 510 >> 1] | 0) * 20 | 0) + 16 >> 2] | 0;
 if ((i4 | 0) < (i20 | 0)) {
  i20 = i11 << 1;
  i25 = (i21 | 0) < (i19 | 0);
  i31 = (i28 | 0) == 2;
  i12 = i19 + -1 | 0;
  i13 = (i12 | 0) > (i21 | 0);
  i22 = i19 + -2 | 0;
  i19 = i1 + 160 | 0;
  i26 = (i34 | 0) == 0;
  i3 = (i28 | 0) == 0;
  i24 = i1 + 168 | 0;
  i2 = i1 + 164 | 0;
  i1 = ~i17;
  i17 = ~i6;
  i6 = ~((i1 | 0) > (i17 | 0) ? i1 : i17);
  i17 = ~i18;
  i18 = ~i7;
  i7 = ~((i17 | 0) > (i18 | 0) ? i17 : i18);
  i18 = 0;
  i17 = i4;
  while (1) {
   if (i25) {
    i4 = i9 + (i18 << 2) | 0;
    i1 = i9 + ((i18 ^ 1) << 2) | 0;
    i15 = 0;
    i29 = Math_imul(i20, i17) | 0;
    i30 = Math_imul(HEAP32[i16 >> 2] | 0, i17) | 0;
    i35 = i21;
    while (1) {
     i36 = HEAP32[i19 >> 2] | 0;
     i37 = HEAP32[i10 + ((HEAPU8[i36 + i29 >> 0] | 0) << 2) >> 2] | 0;
     i38 = i29 + 1 | 0;
     i39 = HEAP32[i10 + ((HEAPU8[i36 + i38 >> 0] | 0) << 2) >> 2] | 0;
     i40 = HEAP32[i10 + ((HEAPU8[i36 + (i29 + i11) >> 0] | 0) << 2) >> 2] | 0;
     i41 = HEAP32[i10 + ((HEAPU8[i36 + (i38 + i11) >> 0] | 0) << 2) >> 2] | 0;
     if (!i26) {
      i38 = (Math_imul(HEAP32[56] | 0, 1103515245) | 0) + 12345 | 0;
      HEAP32[56] = i38;
      i36 = ((i38 | 0) % (i14 | 0) | 0) - i34 + i37 | 0;
      i42 = ((i38 >> 8 | 0) % (i14 | 0) | 0) - i34 + i39 | 0;
      i43 = ((i38 >> 16 | 0) % (i14 | 0) | 0) - i34 + i40 | 0;
      i44 = ((i38 >> 24 | 0) % (i14 | 0) | 0) - i34 + i41 | 0;
      if ((i42 | i36 | i43 | i44) >>> 0 > 255) {
       if ((i36 | 0) < 0) {
        i45 = 0;
       } else {
        i45 = (i36 | 0) > 255 ? 255 : i36;
       }
       if ((i42 | 0) < 0) {
        i46 = 0;
       } else {
        i46 = (i42 | 0) > 255 ? 255 : i42;
       }
       if ((i43 | 0) < 0) {
        i47 = 0;
       } else {
        i47 = (i43 | 0) > 255 ? 255 : i43;
       }
       if ((i44 | 0) < 0) {
        i48 = i45;
        i49 = i46;
        i50 = i47;
        i51 = 0;
       } else {
        i48 = i45;
        i49 = i46;
        i50 = i47;
        i51 = (i44 | 0) > 255 ? 255 : i44;
       }
      } else {
       i48 = i36;
       i49 = i42;
       i50 = i43;
       i51 = i44;
      }
     } else {
      i48 = i37;
      i49 = i39;
      i50 = i40;
      i51 = i41;
     }
     if ((i28 | 0) == 1) {
      i41 = i15 + 2 >> 2;
      i52 = i41;
      i53 = i48 + i41 | 0;
      i54 = i49 + i41 | 0;
      i55 = i50 + i41 | 0;
      i56 = i51 + i41 | 0;
     } else if ((i28 | 0) == 2 ? (i49 | i48 | i50 | i51 | 0) != 0 : 0) {
      i41 = HEAP32[i4 >> 2] | 0;
      i40 = i41 + (i35 + -2 << 2) | 0;
      HEAP32[i40 >> 2] = (HEAP32[i40 >> 2] | 0) + (i15 >> 4);
      i40 = i41 + (i35 + -1 << 2) | 0;
      HEAP32[i40 >> 2] = (HEAP32[i40 >> 2] | 0) + (i15 * 5 >> 4);
      HEAP32[i41 + (i35 << 2) >> 2] = i15 * 3 >> 4;
      i41 = (HEAP32[(HEAP32[i1 >> 2] | 0) + (i35 << 2) >> 2] | 0) + (i15 * 7 >> 4) | 0;
      i52 = i41;
      i53 = (i41 + 1 >> 2) + i48 | 0;
      i54 = (i41 >> 2) + i49 | 0;
      i55 = (i41 + 3 >> 2) + i50 | 0;
      i56 = (i41 + 2 >> 2) + i51 | 0;
     } else {
      i52 = i15;
      i53 = i48;
      i54 = i49;
      i55 = i50;
      i56 = i51;
     }
     i41 = i54 + i53 + i55 + i56 | 0;
     i40 = i41 >> 2;
     i39 = i53 - i40 | 0;
     i37 = (((i39 | 0) > -1 ? i39 : 0 - i39 | 0) | 0) < 13;
     do {
      if (i3) {
       if (((i37 ? (i39 = i54 - i40 | 0, (((i39 | 0) > -1 ? i39 : 0 - i39 | 0) | 0) < 13) : 0) ? (i39 = i55 - i40 | 0, (((i39 | 0) > -1 ? i39 : 0 - i39 | 0) | 0) < 13) : 0) ? (i39 = i56 - i40 | 0, (((i39 | 0) > -1 ? i39 : 0 - i39 | 0) | 0) < 13) : 0) {
        i57 = i52;
        i58 = HEAPU16[(HEAP32[i23 >> 2] | 0) + (i40 << 1) >> 1] | 0;
        break;
       }
       i57 = i52;
       i58 = HEAPU16[(HEAP32[i5 >> 2] | 0) + ((i54 >>> 4 << 12) + (i53 >>> 4 << 8) + (i55 >> 4) + (i56 & -16) << 1) >> 1] | 0;
      } else {
       if (((i37 ? (i39 = i54 - i40 | 0, (((i39 | 0) > -1 ? i39 : 0 - i39 | 0) | 0) < 13) : 0) ? (i39 = i55 - i40 | 0, (((i39 | 0) > -1 ? i39 : 0 - i39 | 0) | 0) < 13) : 0) ? (i39 = i56 - i40 | 0, (((i39 | 0) > -1 ? i39 : 0 - i39 | 0) | 0) < 13) : 0) {
        i39 = (i41 | 0) > 1023;
        i44 = i39 ? 255 : i40;
        i59 = (HEAP32[i23 >> 2] | 0) + (((i44 | 0) < 0 ? 0 : i44) << 1) | 0;
        i60 = i39 ? 1023 : i41;
       } else {
        do {
         if ((i54 | i53 | i55 | i56) >>> 0 > 255) {
          if ((i53 | 0) < 0) {
           i61 = 0;
          } else {
           i61 = (i53 | 0) > 255 ? 255 : i53;
          }
          if ((i54 | 0) < 0) {
           i62 = 0;
          } else {
           i62 = (i54 | 0) > 255 ? 255 : i54;
          }
          if ((i55 | 0) < 0) {
           i63 = 0;
          } else {
           i63 = (i55 | 0) > 255 ? 255 : i55;
          }
          if ((i56 | 0) < 0) {
           i64 = i61;
           i65 = i62;
           i66 = i63;
           i67 = 0;
           break;
          }
          i64 = i61;
          i65 = i62;
          i66 = i63;
          i67 = (i56 | 0) > 255 ? 255 : i56;
         } else {
          i64 = i53;
          i65 = i54;
          i66 = i55;
          i67 = i56;
         }
        } while (0);
        i59 = (HEAP32[i5 >> 2] | 0) + ((i65 >>> 4 << 12) + (i64 >>> 4 << 8) + (i66 >> 4) + (i67 & -16) << 1) | 0;
        i60 = i65 + i64 + i66 + i67 | 0;
       }
       i39 = HEAPU16[i59 >> 1] | 0;
       i57 = i60 - ((((HEAP32[(HEAP32[i33 >> 2] | 0) + (i39 * 20 | 0) + 16 >> 2] | 0) * 1020 | 0) >>> 0) / (i32 >>> 0) | 0) | 0;
       i58 = i39;
      }
     } while (0);
     HEAP8[(HEAP32[i24 >> 2] | 0) + i30 >> 0] = i58 >>> 8;
     HEAP8[(HEAP32[i2 >> 2] | 0) + i30 >> 0] = i58;
     i35 = i35 + 1 | 0;
     if ((i35 | 0) == (i6 | 0)) {
      i68 = i57;
      break;
     } else {
      i15 = i57;
      i29 = i29 + 2 | 0;
      i30 = i30 + 1 | 0;
     }
    }
   } else {
    i68 = 0;
   }
   if (i31) {
    if (i13) {
     i30 = (HEAP32[i9 + (i18 << 2) >> 2] | 0) + (i22 << 2) | 0;
     HEAP32[i30 >> 2] = (HEAP32[i30 >> 2] | 0) + (i68 >> 4);
    }
    if (i25) {
     i30 = HEAP32[i9 + (i18 << 2) >> 2] | 0;
     i29 = i30 + (i12 << 2) | 0;
     HEAP32[i29 >> 2] = (HEAP32[i29 >> 2] | 0) + (i68 * 5 >> 4);
     i69 = i30;
    } else {
     i69 = HEAP32[i9 + (i18 << 2) >> 2] | 0;
    }
    i30 = i18 ^ 1;
    HEAP32[(HEAP32[i9 + (i30 << 2) >> 2] | 0) + (i21 << 2) >> 2] = 0;
    HEAP32[i69 + -4 >> 2] = 0;
    i70 = i30;
   } else {
    i70 = i18;
   }
   i17 = i17 + 1 | 0;
   if ((i17 | 0) == (i7 | 0)) {
    break;
   } else {
    i18 = i70;
   }
  }
 }
 if ((i28 | 0) != 2) {
  STACKTOP = i8;
  return;
 }
 _free(i27 + -12 | 0);
 _free((HEAP32[i9 + 4 >> 2] | 0) + -12 | 0);
 STACKTOP = i8;
 return;
}
function _aa_init(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 var i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, d23 = 0.0, i24 = 0;
 i4 = STACKTOP;
 i5 = _calloc(1, 232) | 0;
 i6 = i5 + 216 | 0;
 HEAP32[i6 >> 2] = 0;
 HEAP32[i5 + 224 >> 2] = 0;
 HEAP32[i5 + 220 >> 2] = 0;
 if ((i5 | 0) == 0) {
  i7 = 0;
  STACKTOP = i4;
  return i7 | 0;
 }
 i8 = i5 + 80 | 0;
 if ((FUNCTION_TABLE_iiiii[HEAP32[i1 + 8 >> 2] & 1](i2, i3, i8, i6) | 0) == 0) {
  _free(i5);
  i7 = 0;
  STACKTOP = i4;
  return i7 | 0;
 }
 HEAP32[i5 >> 2] = i1;
 HEAP32[i5 + 4 >> 2] = 0;
 HEAP32[i5 + 8 >> 2] = 0;
 i3 = HEAP32[i5 + 84 >> 2] | 0;
 i9 = HEAP32[i2 + 4 >> 2] & i3;
 i10 = i5 + 16 | 0;
 i11 = i5 + 20 | 0;
 HEAP32[i11 >> 2] = i9;
 i12 = HEAP32[i2 >> 2] | 0;
 i13 = (i12 | 0) == 0;
 if (i13) {
  i14 = HEAP32[i8 >> 2] | 0;
  HEAP32[i10 >> 2] = i14;
  if ((i14 | 0) == 0) {
   HEAP32[i10 >> 2] = i13 ? 5448 : i12;
  }
 } else {
  HEAP32[i10 >> 2] = i12;
 }
 if ((i9 | 0) == 0) {
  HEAP32[i11 >> 2] = i3;
 }
 HEAP32[i5 + 144 >> 2] = 2;
 HEAP32[i5 + 148 >> 2] = 2;
 HEAP32[i5 + 196 >> 2] = 0;
 HEAP32[i5 + 200 >> 2] = 0;
 HEAP32[i5 + 204 >> 2] = 0;
 i3 = i5 + 172 | 0;
 i11 = i2 + 40 | 0;
 HEAP32[i3 + 0 >> 2] = 0;
 HEAP32[i3 + 4 >> 2] = 0;
 HEAP32[i3 + 8 >> 2] = 0;
 HEAP32[i3 + 12 >> 2] = 0;
 HEAP32[i3 + 16 >> 2] = 0;
 i3 = HEAP32[i11 >> 2] | 0;
 do {
  if ((i3 | 0) == 0) {
   i9 = HEAP32[i5 + 120 >> 2] | 0;
   if ((i9 | 0) != 0) {
    HEAP32[i5 + 56 >> 2] = i9;
    break;
   }
   i9 = HEAP32[i2 + 24 >> 2] | 0;
   if ((i9 | 0) != 0) {
    HEAP32[i5 + 40 >> 2] = i9;
    break;
   }
   i9 = HEAP32[i5 + 104 >> 2] | 0;
   if ((i9 | 0) == 0) {
    HEAP32[i5 + 56 >> 2] = 80;
    break;
   } else {
    HEAP32[i5 + 40 >> 2] = i9;
    break;
   }
  } else {
   HEAP32[i5 + 56 >> 2] = i3;
  }
 } while (0);
 i3 = i2 + 8 | 0;
 i9 = HEAP32[i3 >> 2] | 0;
 i12 = i5 + 56 | 0;
 i10 = HEAP32[i12 >> 2] | 0;
 if ((i9 | 0) > (i10 | 0)) {
  HEAP32[i12 >> 2] = i9;
  i15 = i9;
 } else {
  i15 = i10;
 }
 i10 = HEAP32[i5 + 88 >> 2] | 0;
 if ((i10 | 0) > (i15 | 0)) {
  HEAP32[i12 >> 2] = i10;
  i16 = i10;
 } else {
  i16 = i15;
 }
 i15 = i2 + 16 | 0;
 i10 = HEAP32[i15 >> 2] | 0;
 if ((i10 | 0) != 0 & (i10 | 0) > (i16 | 0)) {
  HEAP32[i12 >> 2] = i10;
  i17 = i10;
 } else {
  i17 = i16;
 }
 i16 = HEAP32[i5 + 96 >> 2] | 0;
 if ((i16 | 0) != 0 & (i16 | 0) > (i17 | 0)) {
  HEAP32[i12 >> 2] = i16;
  i18 = i16;
 } else {
  i18 = i17;
 }
 i17 = i2 + 44 | 0;
 i16 = HEAP32[i17 >> 2] | 0;
 do {
  if ((i16 | 0) == 0) {
   i10 = HEAP32[i5 + 124 >> 2] | 0;
   if ((i10 | 0) != 0) {
    HEAP32[i5 + 60 >> 2] = i10;
    break;
   }
   i10 = HEAP32[i2 + 28 >> 2] | 0;
   if ((i10 | 0) != 0) {
    HEAP32[i5 + 44 >> 2] = i10;
    break;
   }
   i10 = HEAP32[i5 + 108 >> 2] | 0;
   if ((i10 | 0) == 0) {
    HEAP32[i5 + 60 >> 2] = 25;
    break;
   } else {
    HEAP32[i5 + 44 >> 2] = i10;
    break;
   }
  } else {
   HEAP32[i5 + 60 >> 2] = i16;
  }
 } while (0);
 i16 = i2 + 12 | 0;
 i10 = HEAP32[i16 >> 2] | 0;
 i9 = i5 + 60 | 0;
 i13 = HEAP32[i9 >> 2] | 0;
 if ((i10 | 0) > (i13 | 0)) {
  HEAP32[i9 >> 2] = i10;
  i19 = i10;
 } else {
  i19 = i13;
 }
 i13 = HEAP32[i5 + 92 >> 2] | 0;
 if ((i13 | 0) > (i19 | 0)) {
  HEAP32[i9 >> 2] = i13;
  i20 = i13;
 } else {
  i20 = i19;
 }
 i19 = i2 + 20 | 0;
 i13 = HEAP32[i19 >> 2] | 0;
 if ((i13 | 0) != 0 & (i13 | 0) > (i20 | 0)) {
  HEAP32[i9 >> 2] = i13;
  i21 = i13;
 } else {
  i21 = i20;
 }
 i20 = HEAP32[i5 + 100 >> 2] | 0;
 if ((i20 | 0) != 0 & (i20 | 0) > (i21 | 0)) {
  HEAP32[i9 >> 2] = i20;
  i22 = i20;
 } else {
  i22 = i21;
 }
 HEAP32[i12 >> 2] = 0 - i18;
 HEAP32[i9 >> 2] = 0 - i22;
 i22 = i5 + 64 | 0;
 HEAPF64[i22 >> 3] = 5.3;
 i18 = i5 + 72 | 0;
 HEAPF64[i18 >> 3] = 2.7;
 d23 = +HEAPF64[i5 + 128 >> 3];
 if (d23 != 0.0) {
  HEAPF64[i22 >> 3] = d23;
 }
 d23 = +HEAPF64[i5 + 136 >> 3];
 if (d23 != 0.0) {
  HEAPF64[i18 >> 3] = d23;
 }
 d23 = +HEAPF64[i2 + 48 >> 3];
 if (d23 != 0.0) {
  HEAPF64[i22 >> 3] = d23;
 }
 d23 = +HEAPF64[i2 + 56 >> 3];
 if (d23 != 0.0) {
  HEAPF64[i18 >> 3] = d23;
 }
 HEAP32[i5 + 160 >> 2] = 0;
 HEAP32[i5 + 164 >> 2] = 0;
 HEAP32[i5 + 168 >> 2] = 0;
 HEAP32[i5 + 212 >> 2] = 0;
 if ((_aa_resize(i5) | 0) == 0) {
  FUNCTION_TABLE_vi[HEAP32[i1 + 12 >> 2] & 3](i5);
  i1 = HEAP32[i6 >> 2] | 0;
  if ((i1 | 0) != 0) {
   _free(i1);
  }
  _free(i5);
  _puts(152) | 0;
  i7 = 0;
  STACKTOP = i4;
  return i7 | 0;
 }
 i1 = HEAP32[i3 >> 2] | 0;
 i3 = (i1 | 0) == 0;
 do {
  if (i3) {
   if ((HEAP32[i15 >> 2] | 0) != 0) {
    i24 = 59;
    break;
   }
   i6 = HEAP32[i11 >> 2] | 0;
   if ((i6 | 0) == 0 ? 1 : (i6 | 0) == (HEAP32[i12 >> 2] | 0)) {
    i24 = 59;
   }
  } else {
   i24 = 59;
  }
 } while (0);
 L88 : do {
  if ((i24 | 0) == 59) {
   i11 = HEAP32[i16 >> 2] | 0;
   i6 = (i11 | 0) == 0;
   do {
    if (i6) {
     if ((HEAP32[i19 >> 2] | 0) != 0) {
      break;
     }
     i18 = HEAP32[i17 >> 2] | 0;
     if (!((i18 | 0) == 0 ? 1 : (i18 | 0) == (HEAP32[i9 >> 2] | 0))) {
      break L88;
     }
    }
   } while (0);
   if (!i3 ? (i1 | 0) > (HEAP32[i12 >> 2] | 0) : 0) {
    break;
   }
   if (!i6 ? (i11 | 0) > (HEAP32[i12 >> 2] | 0) : 0) {
    break;
   }
   i18 = HEAP32[i15 >> 2] | 0;
   if ((i18 | 0) != 0 ? (i18 | 0) < (HEAP32[i12 >> 2] | 0) : 0) {
    break;
   }
   i18 = HEAP32[i19 >> 2] | 0;
   if ((i18 | 0) == 0) {
    i7 = i5;
    STACKTOP = i4;
    return i7 | 0;
   }
   if ((i18 | 0) < (HEAP32[i12 >> 2] | 0)) {
    break;
   } else {
    i7 = i5;
   }
   STACKTOP = i4;
   return i7 | 0;
  }
 } while (0);
 _aa_close(i5);
 i7 = 0;
 STACKTOP = i4;
 return i7 | 0;
}
function _aa_flush(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + 80 | 0;
 i3 = i2;
 i4 = HEAP32[i1 >> 2] | 0;
 if (((((HEAP32[i4 + 24 >> 2] | 0) != 0 ? (i5 = HEAP32[i1 + 152 >> 2] | 0, i6 = HEAP32[i1 + 156 >> 2] | 0, i7 = i1 + 208 | 0, i8 = HEAP32[i7 >> 2] | 0, (i6 | i5 | 0) >= 0) : 0) ? (i9 = i1 + 56 | 0, i10 = HEAP32[i9 >> 2] | 0, (i10 | 0) >= 0) : 0) ? (i11 = HEAP32[i1 + 60 >> 2] | 0, (i11 | 0) >= 0) : 0) ? (i12 = (i10 | 0) > (i5 | 0) ? i5 : i10, (((i11 | 0) > (i6 | 0) ? i6 : i11) | 0) > 0) : 0) {
  i5 = (i12 | 0) > 0;
  i13 = i1 + 184 | 0;
  i14 = i1 + 188 | 0;
  i15 = i1 + 168 | 0;
  i16 = (i8 | 0) == 0;
  i8 = i1 + 8 | 0;
  i17 = i1 + 164 | 0;
  i18 = ~i11;
  i11 = ~i6;
  i6 = ~((i18 | 0) > (i11 | 0) ? i18 : i11);
  i11 = i4;
  i4 = i10;
  i10 = 0;
  i18 = 0;
  while (1) {
   FUNCTION_TABLE_viii[HEAP32[i11 + 28 >> 2] & 3](i1, 0, i18);
   if (i5) {
    i19 = i10;
    i20 = Math_imul(i18, i4) | 0;
    i21 = 0;
    while (1) {
     i22 = HEAP32[i15 >> 2] | 0;
     i23 = HEAP8[i22 + i20 >> 0] | 0;
     i24 = i23 & 255;
     L13 : do {
      if ((i21 | 0) < (i12 | 0)) {
       i25 = HEAP32[i17 >> 2] | 0;
       i26 = 0;
       i27 = i20;
       i28 = i21;
       while (1) {
        HEAP8[i3 + i26 >> 0] = HEAP8[i25 + i27 >> 0] | 0;
        i29 = i27 + 1 | 0;
        i30 = i26 + 1 | 0;
        i31 = i28 + 1 | 0;
        if (!((i30 | 0) < 79 & (i31 | 0) < (i12 | 0))) {
         i32 = i30;
         i33 = i29;
         i34 = i31;
         break L13;
        }
        if ((HEAP8[i22 + i29 >> 0] | 0) == i23 << 24 >> 24) {
         i26 = i30;
         i27 = i29;
         i28 = i31;
        } else {
         i32 = i30;
         i33 = i29;
         i34 = i31;
         break;
        }
       }
      } else {
       i32 = 0;
       i33 = i20;
       i34 = i21;
      }
     } while (0);
     HEAP8[i3 + i32 >> 0] = 0;
     if (!((i19 | 0) != 0 | i16)) {
      i23 = HEAP32[i8 >> 2] | 0;
      if ((i23 | 0) != 0 ? (HEAP32[i23 + 8 >> 2] & 8 | 0) != 0 : 0) {
       if ((HEAP32[i7 >> 2] | 0) != 0 ? (HEAP32[i7 >> 2] = 0, i22 = HEAP32[i23 + 24 >> 2] | 0, (i22 | 0) != 0) : 0) {
        FUNCTION_TABLE_vii[i22 & 3](i1, 0);
        i35 = 1;
       } else {
        i35 = 1;
       }
      } else {
       i35 = 0;
      }
     } else {
      i35 = i19;
     }
     FUNCTION_TABLE_vii[HEAP32[(HEAP32[i1 >> 2] | 0) + 20 >> 2] & 3](i1, i24);
     FUNCTION_TABLE_vii[HEAP32[(HEAP32[i1 >> 2] | 0) + 24 >> 2] & 3](i1, i3);
     if ((i34 | 0) < (i12 | 0)) {
      i19 = i35;
      i20 = i33;
      i21 = i34;
     } else {
      i36 = i35;
      break;
     }
    }
   } else {
    i36 = i10;
   }
   FUNCTION_TABLE_viii[HEAP32[(HEAP32[i1 >> 2] | 0) + 28 >> 2] & 3](i1, HEAP32[i13 >> 2] | 0, HEAP32[i14 >> 2] | 0);
   i21 = i18 + 1 | 0;
   if ((i21 | 0) == (i6 | 0)) {
    break;
   }
   i11 = HEAP32[i1 >> 2] | 0;
   i4 = HEAP32[i9 >> 2] | 0;
   i10 = i36;
   i18 = i21;
  }
  if (((!((i36 | 0) == 0 | i16) ? (HEAP32[i7 >> 2] | 0) == 0 : 0) ? (HEAP32[i7 >> 2] = 1, i7 = HEAP32[i8 >> 2] | 0, (i7 | 0) != 0) : 0) ? (i8 = HEAP32[i7 + 24 >> 2] | 0, (i8 | 0) != 0) : 0) {
   FUNCTION_TABLE_vii[i8 & 3](i1, 1);
  }
 }
 i8 = HEAP32[i1 >> 2] | 0;
 i7 = HEAP32[i8 + 32 >> 2] | 0;
 if ((i7 | 0) == 0) {
  STACKTOP = i2;
  return;
 }
 i16 = i1 + 208 | 0;
 if ((HEAP32[i16 >> 2] | 0) == 0) {
  FUNCTION_TABLE_vi[i7 & 3](i1);
  STACKTOP = i2;
  return;
 }
 i7 = i1 + 8 | 0;
 i36 = HEAP32[i7 >> 2] | 0;
 if (((i36 | 0) != 0 ? (HEAP32[i36 + 8 >> 2] & 8 | 0) != 0 : 0) ? (HEAP32[i16 >> 2] = 0, i18 = HEAP32[i36 + 24 >> 2] | 0, (i18 | 0) != 0) : 0) {
  FUNCTION_TABLE_vii[i18 & 3](i1, 0);
  i37 = HEAP32[i1 >> 2] | 0;
 } else {
  i37 = i8;
 }
 FUNCTION_TABLE_vi[HEAP32[i37 + 32 >> 2] & 3](i1);
 i37 = HEAP32[i7 >> 2] | 0;
 if ((i37 | 0) == 0) {
  STACKTOP = i2;
  return;
 }
 if ((HEAP32[i37 + 8 >> 2] & 8 | 0) == 0) {
  STACKTOP = i2;
  return;
 }
 if ((HEAP32[i16 >> 2] | 0) != 0) {
  STACKTOP = i2;
  return;
 }
 HEAP32[i16 >> 2] = 1;
 i16 = HEAP32[i37 + 24 >> 2] | 0;
 if ((i16 | 0) == 0) {
  STACKTOP = i2;
  return;
 }
 FUNCTION_TABLE_vii[i16 & 3](i1, 1);
 STACKTOP = i2;
 return;
}
function _values(i1, i2, i3, i4, i5) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 var i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, d16 = 0.0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0;
 i6 = STACKTOP;
 i7 = (i1 | 0) / 256 | 0;
 i8 = HEAP32[1382] | 0;
 i9 = HEAP32[i8 >> 2] | 0;
 i10 = i8 + 4 | 0;
 i8 = Math_imul(HEAP32[i10 >> 2] | 0, (i1 | 0) % 256 | 0) | 0;
 HEAP32[i2 >> 2] = 0;
 HEAP32[i3 >> 2] = 0;
 HEAP32[i4 >> 2] = 0;
 HEAP32[i5 >> 2] = 0;
 i1 = HEAP32[i10 >> 2] | 0;
 if ((i1 | 0) > 1) {
  i11 = 0;
  while (1) {
   i12 = i9 + (i11 + i8) | 0;
   i13 = HEAPU8[i12 >> 0] | 0;
   HEAP32[i2 >> 2] = (i13 & 1) + (HEAP32[i2 >> 2] | 0) + (i13 >>> 1 & 1) + (i13 >>> 2 & 1) + (i13 >>> 3 & 1);
   i13 = HEAPU8[i12 >> 0] | 0;
   HEAP32[i3 >> 2] = (i13 >>> 7) + (HEAP32[i3 >> 2] | 0) + (i13 >>> 5 & 1) + (i13 >>> 4 & 1) + (i13 >>> 6 & 1);
   i13 = i11 + 1 | 0;
   i12 = HEAP32[i10 >> 2] | 0;
   if ((i13 | 0) < ((i12 | 0) / 2 | 0 | 0)) {
    i11 = i13;
   } else {
    i14 = i12;
    i15 = i13;
    break;
   }
  }
 } else {
  i14 = i1;
  i15 = 0;
 }
 if ((i15 | 0) < (i14 | 0)) {
  i14 = i15;
  do {
   i15 = i9 + (i14 + i8) | 0;
   i1 = HEAPU8[i15 >> 0] | 0;
   HEAP32[i4 >> 2] = (i1 & 1) + (HEAP32[i4 >> 2] | 0) + (i1 >>> 1 & 1) + (i1 >>> 2 & 1) + (i1 >>> 3 & 1);
   i1 = HEAPU8[i15 >> 0] | 0;
   HEAP32[i5 >> 2] = (i1 >>> 7) + (HEAP32[i5 >> 2] | 0) + (i1 >>> 5 & 1) + (i1 >>> 4 & 1) + (i1 >>> 6 & 1);
   i14 = i14 + 1 | 0;
  } while ((i14 | 0) < (HEAP32[i10 >> 2] | 0));
 }
 HEAP32[i2 >> 2] = HEAP32[i2 >> 2] << 3;
 HEAP32[i3 >> 2] = HEAP32[i3 >> 2] << 3;
 HEAP32[i4 >> 2] = HEAP32[i4 >> 2] << 3;
 HEAP32[i5 >> 2] = HEAP32[i5 >> 2] << 3;
 if ((i7 | 0) == 2) {
  d16 = +HEAPF64[690];
  HEAP32[i2 >> 2] = ~~(+(HEAP32[i2 >> 2] | 0) * d16);
  HEAP32[i3 >> 2] = ~~(+(HEAP32[i3 >> 2] | 0) * d16);
  HEAP32[i4 >> 2] = ~~(+(HEAP32[i4 >> 2] | 0) * d16);
  HEAP32[i5 >> 2] = ~~(+(HEAP32[i5 >> 2] | 0) * d16);
  STACKTOP = i6;
  return;
 } else if ((i7 | 0) == 1) {
  d16 = +HEAPF64[689];
  HEAP32[i2 >> 2] = ~~(+((HEAP32[i2 >> 2] | 0) + 1 | 0) / d16);
  HEAP32[i3 >> 2] = ~~(+((HEAP32[i3 >> 2] | 0) + 1 | 0) / d16);
  HEAP32[i4 >> 2] = ~~(+((HEAP32[i4 >> 2] | 0) + 1 | 0) / d16);
  HEAP32[i5 >> 2] = ~~(+((HEAP32[i5 >> 2] | 0) + 1 | 0) / d16);
  STACKTOP = i6;
  return;
 } else if ((i7 | 0) == 4) {
  HEAP32[i2 >> 2] = (HEAP32[i10 >> 2] << 4) - (HEAP32[i2 >> 2] | 0);
  HEAP32[i3 >> 2] = (HEAP32[i10 >> 2] << 4) - (HEAP32[i3 >> 2] | 0);
  HEAP32[i4 >> 2] = (HEAP32[i10 >> 2] << 4) - (HEAP32[i4 >> 2] | 0);
  HEAP32[i5 >> 2] = (HEAP32[i10 >> 2] << 4) - (HEAP32[i5 >> 2] | 0);
  STACKTOP = i6;
  return;
 } else if ((i7 | 0) == 3) {
  i7 = HEAP32[i10 >> 2] | 0;
  if ((i7 | 0) > 1) {
   i14 = 0;
   while (1) {
    i1 = i9 + (i14 + i8) | 0;
    i15 = HEAPU8[i1 >> 0] | 0;
    if ((i15 & 8 | 0) == 0) {
     i17 = (i15 & 4 | 0) != 0;
    } else {
     i17 = 0;
    }
    HEAP32[i2 >> 2] = (((i15 & 3 | 0) == 1 & 1) + (i15 & 1) + ((i15 & 6 | 0) == 2 & 1) + (i17 & 1) << 3) + (HEAP32[i2 >> 2] | 0);
    i15 = HEAPU8[i1 >> 0] | 0;
    if ((i15 & 128 | 0) == 0) {
     i18 = (i15 & 64 | 0) != 0;
    } else {
     i18 = 0;
    }
    HEAP32[i3 >> 2] = (((i15 & 48 | 0) == 16 & 1) + (i15 >>> 4 & 1) + ((i15 & 96 | 0) == 32 & 1) + (i18 & 1) << 3) + (HEAP32[i3 >> 2] | 0);
    i15 = i14 + 1 | 0;
    i1 = HEAP32[i10 >> 2] | 0;
    if ((i15 | 0) < ((i1 | 0) / 2 | 0 | 0)) {
     i14 = i15;
    } else {
     i19 = i1;
     i20 = i15;
     break;
    }
   }
  } else {
   i19 = i7;
   i20 = 0;
  }
  if ((i20 | 0) < (i19 | 0)) {
   i21 = i20;
  } else {
   STACKTOP = i6;
   return;
  }
  do {
   i20 = i9 + (i21 + i8) | 0;
   i19 = HEAPU8[i20 >> 0] | 0;
   if ((i19 & 8 | 0) == 0) {
    i22 = (i19 & 4 | 0) != 0;
   } else {
    i22 = 0;
   }
   HEAP32[i4 >> 2] = (((i19 & 3 | 0) == 1 & 1) + (i19 & 1) + ((i19 & 6 | 0) == 2 & 1) + (i22 & 1) << 3) + (HEAP32[i4 >> 2] | 0);
   i19 = HEAPU8[i20 >> 0] | 0;
   if ((i19 & 128 | 0) == 0) {
    i23 = (i19 & 64 | 0) != 0;
   } else {
    i23 = 0;
   }
   HEAP32[i5 >> 2] = (((i19 & 48 | 0) == 16 & 1) + (i19 >>> 4 & 1) + ((i19 & 96 | 0) == 32 & 1) + (i23 & 1) << 3) + (HEAP32[i5 >> 2] | 0);
   i21 = i21 + 1 | 0;
  } while ((i21 | 0) < (HEAP32[i10 >> 2] | 0));
  STACKTOP = i6;
  return;
 } else {
  STACKTOP = i6;
  return;
 }
}
function ___aa_calcparams(i1, i2, i3, d4, d5) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 d4 = +d4;
 d5 = +d5;
 var i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0;
 i6 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i7 = i6 + 12 | 0;
 i8 = i6 + 8 | 0;
 i9 = i6 + 4 | 0;
 i10 = i6;
 HEAPF64[689] = d4;
 HEAPF64[690] = d5;
 HEAP32[1382] = i1;
 i1 = (i3 & 256 | 0) == 0;
 i11 = (i3 & 128 | 0) == 0;
 i12 = 0;
 i13 = 5e4;
 i14 = 0;
 while (1) {
  i15 = i12 & 255;
  if (!((_isgraph(i15) | 0) != 0 | (i15 | 0) == 32) ? (i15 >>> 0 < 161 | i1) & (i11 | (i15 | 0) == 0) : 0) {
   i16 = i13;
   i17 = i14;
  } else {
   if ((1 << (i12 >> 8) & i3 | 0) == 0) {
    i16 = i13;
    i17 = i14;
   } else {
    _values(i12, i7, i8, i9, i10);
    i15 = (HEAP32[i8 >> 2] | 0) + (HEAP32[i7 >> 2] | 0) + (HEAP32[i9 >> 2] | 0) + (HEAP32[i10 >> 2] | 0) | 0;
    i16 = (i15 | 0) < (i13 | 0) ? i15 : i13;
    i17 = (i15 | 0) > (i14 | 0) ? i15 : i14;
   }
  }
  i12 = i12 + 1 | 0;
  if ((i12 | 0) == 1280) {
   break;
  } else {
   i13 = i16;
   i14 = i17;
  }
 }
 i14 = i17 - i16 | 0;
 i17 = (i16 | 0) / 4 | 0;
 d5 = 1020.0 / +(i14 | 0);
 d4 = 255.0 / +((i14 | 0) / 4 | 0 | 0);
 i14 = 0;
 do {
  _values(i14, i7, i8, i9, i10);
  i13 = HEAP32[i7 >> 2] | 0;
  i12 = HEAP32[i8 >> 2] | 0;
  i3 = HEAP32[i9 >> 2] | 0;
  i11 = HEAP32[i10 >> 2] | 0;
  i1 = ~~(+(i13 - i17 | 0) * d4 + .5);
  HEAP32[i7 >> 2] = i1;
  i15 = ~~(d4 * +(i12 - i17 | 0) + .5);
  HEAP32[i8 >> 2] = i15;
  i18 = ~~(d4 * +(i3 - i17 | 0) + .5);
  HEAP32[i9 >> 2] = i18;
  i19 = ~~(d4 * +(i11 - i17 | 0) + .5);
  HEAP32[i10 >> 2] = i19;
  if ((i1 | 0) > 255) {
   HEAP32[i7 >> 2] = 255;
   i20 = 255;
  } else {
   i20 = i1;
  }
  if ((i15 | 0) > 255) {
   HEAP32[i8 >> 2] = 255;
   i21 = 255;
  } else {
   i21 = i15;
  }
  if ((i18 | 0) > 255) {
   HEAP32[i9 >> 2] = 255;
   i22 = 255;
  } else {
   i22 = i18;
  }
  if ((i19 | 0) > 255) {
   HEAP32[i10 >> 2] = 255;
   i23 = 255;
  } else {
   i23 = i19;
  }
  if ((i20 | 0) < 0) {
   HEAP32[i7 >> 2] = 0;
   i24 = 0;
  } else {
   i24 = i20;
  }
  if ((i21 | 0) < 0) {
   HEAP32[i8 >> 2] = 0;
   i25 = 0;
  } else {
   i25 = i21;
  }
  if ((i22 | 0) < 0) {
   HEAP32[i9 >> 2] = 0;
   i26 = 0;
  } else {
   i26 = i22;
  }
  if ((i23 | 0) < 0) {
   HEAP32[i10 >> 2] = 0;
   i27 = 0;
  } else {
   i27 = i23;
  }
  HEAP32[i2 + (i14 * 20 | 0) >> 2] = i24;
  HEAP32[i2 + (i14 * 20 | 0) + 4 >> 2] = i25;
  HEAP32[i2 + (i14 * 20 | 0) + 8 >> 2] = i26;
  HEAP32[i2 + (i14 * 20 | 0) + 12 >> 2] = i27;
  HEAP32[i2 + (i14 * 20 | 0) + 16 >> 2] = ~~(d5 * +(i13 - i16 + i12 + i3 + i11 | 0) + .5);
  i14 = i14 + 1 | 0;
 } while ((i14 | 0) != 1280);
 STACKTOP = i6;
 return;
}
function _aa_resize(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i3 = i2 + 4 | 0;
 i4 = i2;
 i5 = i1 + 56 | 0;
 i6 = HEAP32[i5 >> 2] | 0;
 HEAP32[i3 >> 2] = (i6 | 0) > -1 ? i6 : 0 - i6 | 0;
 i6 = i1 + 60 | 0;
 i7 = HEAP32[i6 >> 2] | 0;
 HEAP32[i4 >> 2] = (i7 | 0) > -1 ? i7 : 0 - i7 | 0;
 FUNCTION_TABLE_viii[HEAP32[(HEAP32[i1 >> 2] | 0) + 16 >> 2] & 3](i1, i3, i4);
 i7 = HEAP32[i3 >> 2] | 0;
 if ((i7 | 0) < 1) {
  _puts(128) | 0;
  _exit(-1);
 }
 i8 = HEAP32[i4 >> 2] | 0;
 if ((i8 | 0) < 1) {
  _puts(128) | 0;
  _exit(-1);
 }
 if ((i7 | 0) == (HEAP32[i5 >> 2] | 0) ? (i8 | 0) == (HEAP32[i1 + 156 >> 2] | 0) : 0) {
  i9 = i7;
 } else {
  i7 = i1 + 160 | 0;
  i8 = HEAP32[i7 >> 2] | 0;
  if ((i8 | 0) != 0) {
   _free(i8);
  }
  i8 = i1 + 164 | 0;
  i10 = HEAP32[i8 >> 2] | 0;
  if ((i10 | 0) != 0) {
   _free(i10);
  }
  i10 = i1 + 168 | 0;
  i11 = HEAP32[i10 >> 2] | 0;
  if ((i11 | 0) != 0) {
   _free(i11);
  }
  i11 = HEAP32[i3 >> 2] | 0;
  HEAP32[i5 >> 2] = i11;
  i5 = HEAP32[i4 >> 2] | 0;
  HEAP32[i6 >> 2] = i5;
  i4 = HEAP32[i1 + 144 >> 2] | 0;
  i3 = Math_imul(i4, i11) | 0;
  HEAP32[i1 + 152 >> 2] = i3;
  i12 = Math_imul(i4, i5) | 0;
  HEAP32[i1 + 156 >> 2] = i12;
  i4 = _calloc(1, Math_imul(i3, i12) | 0) | 0;
  HEAP32[i7 >> 2] = i4;
  if ((i4 | 0) == 0) {
   i13 = 0;
   STACKTOP = i2;
   return i13 | 0;
  }
  i7 = Math_imul(i5, i11) | 0;
  i5 = _calloc(1, i7) | 0;
  HEAP32[i8 >> 2] = i5;
  if ((i5 | 0) == 0) {
   _free(i4);
   i13 = 0;
   STACKTOP = i2;
   return i13 | 0;
  }
  _memset(i5 | 0, 32, i7 | 0) | 0;
  i5 = _calloc(1, i7) | 0;
  HEAP32[i10 >> 2] = i5;
  if ((i5 | 0) == 0) {
   _free(i4);
   _free(HEAP32[i8 >> 2] | 0);
   i13 = 0;
   STACKTOP = i2;
   return i13 | 0;
  } else {
   i9 = i11;
  }
 }
 i11 = HEAP32[i1 + 112 >> 2] | 0;
 HEAP32[i1 + 48 >> 2] = (i11 | 0) == 0 ? 290 : i11;
 i11 = HEAP32[i1 + 116 >> 2] | 0;
 HEAP32[i1 + 52 >> 2] = (i11 | 0) == 0 ? 215 : i11;
 i11 = HEAP32[i1 + 88 >> 2] | 0;
 HEAP32[i1 + 24 >> 2] = (i11 | 0) == 0 ? i9 : i11;
 i11 = HEAP32[i1 + 92 >> 2] | 0;
 if ((i11 | 0) == 0) {
  HEAP32[i1 + 28 >> 2] = HEAP32[i6 >> 2];
 } else {
  HEAP32[i1 + 28 >> 2] = i11;
 }
 i11 = HEAP32[i1 + 96 >> 2] | 0;
 HEAP32[i1 + 32 >> 2] = (i11 | 0) == 0 ? i9 : i11;
 i11 = HEAP32[i1 + 100 >> 2] | 0;
 if ((i11 | 0) == 0) {
  HEAP32[i1 + 36 >> 2] = HEAP32[i6 >> 2];
  i13 = 1;
  STACKTOP = i2;
  return i13 | 0;
 } else {
  HEAP32[i1 + 36 >> 2] = i11;
  i13 = 1;
  STACKTOP = i2;
  return i13 | 0;
 }
 return 0;
}
function _aa_autoinit(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i3 = i2;
 i4 = 0;
 L1 : while (1) {
  i5 = (i4 | 0) == 0;
  do {
   i6 = _aa_getfirst(5504) | 0;
   if ((i6 | 0) == 0) {
    break L1;
   }
  } while (!i5);
  if ((_strcmp(i6, HEAP32[1284 >> 2] | 0) | 0) != 0 ? (_strcmp(i6, HEAP32[320] | 0) | 0) != 0 : 0) {
   HEAP32[i3 >> 2] = i6;
   _printf(176, i3 | 0) | 0;
   i7 = 0;
  } else {
   i7 = _aa_init(1280, i1, 0) | 0;
  }
  _free(i6);
  i4 = i7;
 }
 if (i5) {
  i8 = 0;
 } else {
  i9 = i4;
  STACKTOP = i2;
  return i9 | 0;
 }
 while (1) {
  if ((i8 | 0) == 1) {
   i9 = 0;
   i10 = 13;
   break;
  }
  i4 = _aa_init(HEAP32[168 + (i8 << 2) >> 2] | 0, i1, 0) | 0;
  if ((i4 | 0) == 0) {
   i8 = i8 + 1 | 0;
  } else {
   i9 = i4;
   i10 = 13;
   break;
  }
 }
 if ((i10 | 0) == 13) {
  STACKTOP = i2;
  return i9 | 0;
 }
 return 0;
}
function _aa_recommendlow(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0, i5 = 0, i6 = 0;
 i3 = STACKTOP;
 i4 = HEAP32[i1 >> 2] | 0;
 L1 : do {
  if ((i4 | 0) != 0) {
   i5 = i4;
   while (1) {
    if ((_strcmp(HEAP32[i5 >> 2] | 0, i2) | 0) == 0) {
     break;
    }
    i6 = HEAP32[i5 + 4 >> 2] | 0;
    if ((i6 | 0) == (i4 | 0)) {
     break L1;
    } else {
     i5 = i6;
    }
   }
   if ((i5 | 0) != 0) {
    STACKTOP = i3;
    return;
   }
  }
 } while (0);
 i4 = _malloc(12) | 0;
 HEAP32[i4 >> 2] = ___strdup(i2) | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 i6 = i4 + 4 | 0;
 if ((i2 | 0) == 0) {
  HEAP32[i6 >> 2] = i4;
  HEAP32[i4 + 8 >> 2] = i4;
  HEAP32[i1 >> 2] = i4;
  STACKTOP = i3;
  return;
 } else {
  HEAP32[i6 >> 2] = i2;
  i6 = i2 + 8 | 0;
  i2 = i4 + 8 | 0;
  HEAP32[i2 >> 2] = HEAP32[i6 >> 2];
  HEAP32[i6 >> 2] = i4;
  HEAP32[(HEAP32[i2 >> 2] | 0) + 4 >> 2] = i4;
  STACKTOP = i3;
  return;
 }
}
function _aa_close(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0;
 i2 = STACKTOP;
 if ((HEAP32[i1 + 192 >> 2] | 0) < 0 ? (i3 = HEAP32[(HEAP32[i1 >> 2] | 0) + 36 >> 2] | 0, (i3 | 0) != 0) : 0) {
  FUNCTION_TABLE_vii[i3 & 3](i1, 1);
 }
 if ((HEAP32[i1 + 4 >> 2] | 0) != 0) {
  _aa_uninitkbd(i1);
 }
 FUNCTION_TABLE_vi[HEAP32[(HEAP32[i1 >> 2] | 0) + 12 >> 2] & 3](i1);
 _aa_invalidate(i1);
 i3 = HEAP32[i1 + 160 >> 2] | 0;
 if ((i3 | 0) != 0) {
  _free(i3);
 }
 i3 = HEAP32[i1 + 164 >> 2] | 0;
 if ((i3 | 0) != 0) {
  _free(i3);
 }
 i3 = HEAP32[i1 + 168 >> 2] | 0;
 if ((i3 | 0) != 0) {
  _free(i3);
 }
 i3 = HEAP32[i1 + 216 >> 2] | 0;
 if ((i3 | 0) == 0) {
  _free(i1);
  STACKTOP = i2;
  return;
 }
 _free(i3);
 _free(i1);
 STACKTOP = i2;
 return;
}
function _memcpy(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 var i4 = 0;
 if ((i3 | 0) >= 4096) return _emscripten_memcpy_big(i1 | 0, i2 | 0, i3 | 0) | 0;
 i4 = i1 | 0;
 if ((i1 & 3) == (i2 & 3)) {
  while (i1 & 3) {
   if ((i3 | 0) == 0) return i4 | 0;
   HEAP8[i1 >> 0] = HEAP8[i2 >> 0] | 0;
   i1 = i1 + 1 | 0;
   i2 = i2 + 1 | 0;
   i3 = i3 - 1 | 0;
  }
  while ((i3 | 0) >= 4) {
   HEAP32[i1 >> 2] = HEAP32[i2 >> 2];
   i1 = i1 + 4 | 0;
   i2 = i2 + 4 | 0;
   i3 = i3 - 4 | 0;
  }
 }
 while ((i3 | 0) > 0) {
  HEAP8[i1 >> 0] = HEAP8[i2 >> 0] | 0;
  i1 = i1 + 1 | 0;
  i2 = i2 + 1 | 0;
  i3 = i3 - 1 | 0;
 }
 return i4 | 0;
}
function runPostSets() {}
function _memset(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 var i4 = 0, i5 = 0, i6 = 0, i7 = 0;
 i4 = i1 + i3 | 0;
 if ((i3 | 0) >= 20) {
  i2 = i2 & 255;
  i5 = i1 & 3;
  i6 = i2 | i2 << 8 | i2 << 16 | i2 << 24;
  i7 = i4 & ~3;
  if (i5) {
   i5 = i1 + 4 - i5 | 0;
   while ((i1 | 0) < (i5 | 0)) {
    HEAP8[i1 >> 0] = i2;
    i1 = i1 + 1 | 0;
   }
  }
  while ((i1 | 0) < (i7 | 0)) {
   HEAP32[i1 >> 2] = i6;
   i1 = i1 + 4 | 0;
  }
 }
 while ((i1 | 0) < (i4 | 0)) {
  HEAP8[i1 >> 0] = i2;
  i1 = i1 + 1 | 0;
 }
 return i1 - i3 | 0;
}
function _aa_getfirst(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0;
 i2 = STACKTOP;
 i3 = HEAP32[i1 >> 2] | 0;
 if ((i3 | 0) == 0) {
  i4 = 0;
  STACKTOP = i2;
  return i4 | 0;
 }
 i5 = i3 + 8 | 0;
 i6 = i3 + 4 | 0;
 HEAP32[(HEAP32[i6 >> 2] | 0) + 8 >> 2] = HEAP32[i5 >> 2];
 HEAP32[(HEAP32[i5 >> 2] | 0) + 4 >> 2] = HEAP32[i6 >> 2];
 if ((HEAP32[i1 >> 2] | 0) == (i3 | 0)) {
  i5 = HEAP32[i6 >> 2] | 0;
  HEAP32[i1 >> 2] = (i5 | 0) == (i3 | 0) ? 0 : i5;
 }
 i5 = HEAP32[i3 >> 2] | 0;
 _free(i3);
 i4 = i5;
 STACKTOP = i2;
 return i4 | 0;
}
function _strcmp(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0;
 i3 = STACKTOP;
 i4 = HEAP8[i1 >> 0] | 0;
 i5 = HEAP8[i2 >> 0] | 0;
 if (i4 << 24 >> 24 == 0 ? 1 : i4 << 24 >> 24 != i5 << 24 >> 24) {
  i6 = i4;
  i7 = i5;
 } else {
  i5 = i1;
  i1 = i2;
  do {
   i5 = i5 + 1 | 0;
   i1 = i1 + 1 | 0;
   i2 = HEAP8[i5 >> 0] | 0;
   i4 = HEAP8[i1 >> 0] | 0;
  } while (!(i2 << 24 >> 24 == 0 ? 1 : i2 << 24 >> 24 != i4 << 24 >> 24));
  i6 = i2;
  i7 = i4;
 }
 STACKTOP = i3;
 return (i6 & 255) - (i7 & 255) | 0;
}
function _aa_uninitkbd(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0;
 i2 = STACKTOP;
 i3 = i1 + 4 | 0;
 i4 = HEAP32[i3 >> 2] | 0;
 if ((i4 | 0) == 0) {
  STACKTOP = i2;
  return;
 }
 if ((HEAP32[i1 + 8 >> 2] | 0) == 0) {
  i5 = i4;
 } else {
  _aa_uninitmouse(i1);
  i5 = HEAP32[i3 >> 2] | 0;
 }
 HEAP32[i1 + 224 >> 2] = 0;
 FUNCTION_TABLE_vi[HEAP32[i5 + 16 >> 2] & 3](i1);
 i5 = i1 + 220 | 0;
 i1 = HEAP32[i5 >> 2] | 0;
 if ((i1 | 0) != 0) {
  _free(i1);
 }
 HEAP32[i5 >> 2] = 0;
 HEAP32[i3 >> 2] = 0;
 STACKTOP = i2;
 return;
}
function _calloc(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0, i5 = 0;
 i3 = STACKTOP;
 if ((i1 | 0) != 0) {
  i4 = Math_imul(i2, i1) | 0;
  if ((i2 | i1) >>> 0 > 65535) {
   i5 = ((i4 >>> 0) / (i1 >>> 0) | 0 | 0) == (i2 | 0) ? i4 : -1;
  } else {
   i5 = i4;
  }
 } else {
  i5 = 0;
 }
 i4 = _malloc(i5) | 0;
 if ((i4 | 0) == 0) {
  STACKTOP = i3;
  return i4 | 0;
 }
 if ((HEAP32[i4 + -4 >> 2] & 3 | 0) == 0) {
  STACKTOP = i3;
  return i4 | 0;
 }
 _memset(i4 | 0, 0, i5 | 0) | 0;
 STACKTOP = i3;
 return i4 | 0;
}
function _aa_getrenderparams() {
 var i1 = 0, i2 = 0, i3 = 0;
 i1 = STACKTOP;
 i2 = _calloc(1, 24) | 0;
 if ((i2 | 0) == 0) {
  i3 = 0;
  STACKTOP = i1;
  return i3 | 0;
 }
 HEAP32[i2 + 0 >> 2] = HEAP32[200 >> 2];
 HEAP32[i2 + 4 >> 2] = HEAP32[204 >> 2];
 HEAP32[i2 + 8 >> 2] = HEAP32[208 >> 2];
 HEAP32[i2 + 12 >> 2] = HEAP32[212 >> 2];
 HEAP32[i2 + 16 >> 2] = HEAP32[216 >> 2];
 HEAP32[i2 + 20 >> 2] = HEAP32[220 >> 2];
 i3 = i2;
 STACKTOP = i1;
 return i3 | 0;
}
function copyTempDouble(i1) {
 i1 = i1 | 0;
 HEAP8[tempDoublePtr >> 0] = HEAP8[i1 >> 0];
 HEAP8[tempDoublePtr + 1 >> 0] = HEAP8[i1 + 1 >> 0];
 HEAP8[tempDoublePtr + 2 >> 0] = HEAP8[i1 + 2 >> 0];
 HEAP8[tempDoublePtr + 3 >> 0] = HEAP8[i1 + 3 >> 0];
 HEAP8[tempDoublePtr + 4 >> 0] = HEAP8[i1 + 4 >> 0];
 HEAP8[tempDoublePtr + 5 >> 0] = HEAP8[i1 + 5 >> 0];
 HEAP8[tempDoublePtr + 6 >> 0] = HEAP8[i1 + 6 >> 0];
 HEAP8[tempDoublePtr + 7 >> 0] = HEAP8[i1 + 7 >> 0];
}
function _aa_invalidate(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0;
 i2 = STACKTOP;
 i3 = i1 + 172 | 0;
 i4 = HEAP32[i3 >> 2] | 0;
 if ((i4 | 0) != 0) {
  _free(i4);
 }
 i4 = i1 + 176 | 0;
 i5 = HEAP32[i4 >> 2] | 0;
 if ((i5 | 0) != 0) {
  _free(i5);
 }
 i5 = i1 + 180 | 0;
 i1 = HEAP32[i5 >> 2] | 0;
 if ((i1 | 0) != 0) {
  _free(i1);
 }
 HEAP32[i3 >> 2] = 0;
 HEAP32[i4 >> 2] = 0;
 HEAP32[i5 >> 2] = 0;
 STACKTOP = i2;
 return;
}
function _aa_uninitmouse(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0;
 i2 = STACKTOP;
 i3 = i1 + 8 | 0;
 i4 = HEAP32[i3 >> 2] | 0;
 if ((i4 | 0) == 0) {
  STACKTOP = i2;
  return;
 }
 FUNCTION_TABLE_vi[HEAP32[i4 + 16 >> 2] & 3](i1);
 i4 = i1 + 224 | 0;
 i5 = HEAP32[i4 >> 2] | 0;
 if ((i5 | 0) != 0) {
  _free(i5);
 }
 HEAP32[i4 >> 2] = 0;
 HEAP32[i3 >> 2] = 0;
 HEAP32[i1 + 208 >> 2] = 0;
 STACKTOP = i2;
 return;
}
function _init() {
 var i1 = 0, i2 = 0;
 i1 = STACKTOP;
 i2 = _aa_autoinit(64) | 0;
 HEAP32[2] = i2;
 if ((i2 | 0) == 0) {
  _puts(32) | 0;
  _exit(1);
 } else {
  i2 = _aa_getrenderparams() | 0;
  HEAP32[4] = i2;
  HEAP32[i2 >> 2] = 0;
  HEAP32[i2 + 4 >> 2] = 63;
  HEAPF32[i2 + 8 >> 2] = 1.0;
  i2 = HEAP32[2] | 0;
  HEAP32[6] = HEAP32[i2 + 160 >> 2];
  _aa_hidecursor(i2);
  STACKTOP = i1;
  return;
 }
}
function _aa_render(i1, i2, i3, i4, i5, i6) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 var i7 = 0, i8 = 0;
 i7 = STACKTOP;
 if ((HEAP32[1252 >> 2] | 0) != 255) {
  i8 = 0;
  do {
   HEAP32[232 + (i8 << 2) >> 2] = i8;
   i8 = i8 + 1 | 0;
  } while ((i8 | 0) != 256);
 }
 _aa_renderpalette(i1, 232, i2, i3, i4, i5, i6);
 STACKTOP = i7;
 return;
}
function _aa_hidecursor(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0;
 i2 = STACKTOP;
 i3 = i1 + 192 | 0;
 i4 = HEAP32[i3 >> 2] | 0;
 HEAP32[i3 >> 2] = i4 + -1;
 if ((i4 | 0) != 0) {
  STACKTOP = i2;
  return;
 }
 i4 = HEAP32[(HEAP32[i1 >> 2] | 0) + 36 >> 2] | 0;
 if ((i4 | 0) == 0) {
  STACKTOP = i2;
  return;
 }
 FUNCTION_TABLE_vii[i4 & 3](i1, 0);
 STACKTOP = i2;
 return;
}
function ___strdup(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0;
 i2 = STACKTOP;
 i3 = (_strlen(i1 | 0) | 0) + 1 | 0;
 i4 = _malloc(i3) | 0;
 if ((i4 | 0) == 0) {
  i5 = 0;
  STACKTOP = i2;
  return i5 | 0;
 }
 _memcpy(i4 | 0, i1 | 0, i3 | 0) | 0;
 i5 = i4;
 STACKTOP = i2;
 return i5 | 0;
}
function copyTempFloat(i1) {
 i1 = i1 | 0;
 HEAP8[tempDoublePtr >> 0] = HEAP8[i1 >> 0];
 HEAP8[tempDoublePtr + 1 >> 0] = HEAP8[i1 + 1 >> 0];
 HEAP8[tempDoublePtr + 2 >> 0] = HEAP8[i1 + 2 >> 0];
 HEAP8[tempDoublePtr + 3 >> 0] = HEAP8[i1 + 3 >> 0];
}
function _web_init(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i4 = STACKTOP;
 HEAP32[i3 >> 2] = 0;
 HEAP32[i3 + 4 >> 2] = 31;
 _aa_recommendlow(5496, 1256);
 _aaweb_init();
 STACKTOP = i4;
 return 1;
}
function _render() {
 var i1 = 0, i2 = 0;
 i1 = STACKTOP;
 i2 = HEAP32[2] | 0;
 _aa_render(i2, HEAP32[4] | 0, 0, 0, HEAP32[i2 + 56 >> 2] | 0, HEAP32[i2 + 60 >> 2] | 0);
 _aa_flush(HEAP32[2] | 0);
 STACKTOP = i1;
 return;
}
function _web_getsize(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i1 = STACKTOP;
 HEAP32[i2 >> 2] = _aaweb_get_width() | 0;
 HEAP32[i3 >> 2] = _aaweb_get_height() | 0;
 STACKTOP = i1;
 return;
}
function dynCall_iiiii(i1, i2, i3, i4, i5) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 return FUNCTION_TABLE_iiiii[i1 & 1](i2 | 0, i3 | 0, i4 | 0, i5 | 0) | 0;
}
function dynCall_viii(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 FUNCTION_TABLE_viii[i1 & 3](i2 | 0, i3 | 0, i4 | 0);
}
function _web_gotoxy(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i1 = STACKTOP;
 _aaweb_gotoxy(i2 | 0, i3 | 0);
 STACKTOP = i1;
 return;
}
function stackAlloc(i1) {
 i1 = i1 | 0;
 var i2 = 0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + i1 | 0;
 STACKTOP = STACKTOP + 7 & -8;
 return i2 | 0;
}
function _strlen(i1) {
 i1 = i1 | 0;
 var i2 = 0;
 i2 = i1;
 while (HEAP8[i2 >> 0] | 0) {
  i2 = i2 + 1 | 0;
 }
 return i2 - i1 | 0;
}
function _web_setattr(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i1 = STACKTOP;
 _aaweb_setattr(i2 | 0);
 STACKTOP = i1;
 return;
}
function setThrew(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 if ((__THREW__ | 0) == 0) {
  __THREW__ = i1;
  threwValue = i2;
 }
}
function dynCall_vii(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 FUNCTION_TABLE_vii[i1 & 3](i2 | 0, i3 | 0);
}
function _web_print(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i1 = STACKTOP;
 _aaweb_print(i2 | 0);
 STACKTOP = i1;
 return;
}
function b0(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 abort(0);
 return 0;
}
function dynCall_vi(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 FUNCTION_TABLE_vi[i1 & 3](i2 | 0);
}
function _set_contrast(i1) {
 i1 = i1 | 0;
 HEAP32[(HEAP32[4] | 0) + 4 >> 2] = i1;
 return;
}
function _set_gamma(d1) {
 d1 = +d1;
 HEAPF32[(HEAP32[4] | 0) + 8 >> 2] = d1;
 return;
}
function _set_brightness(i1) {
 i1 = i1 | 0;
 HEAP32[HEAP32[4] >> 2] = i1;
 return;
}
function b3(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 abort(3);
}
function _isgraph(i1) {
 i1 = i1 | 0;
 return (i1 + -33 | 0) >>> 0 < 94 | 0;
}
function _get_img_height() {
 return HEAP32[(HEAP32[2] | 0) + 156 >> 2] | 0;
}
function _get_img_width() {
 return HEAP32[(HEAP32[2] | 0) + 152 >> 2] | 0;
}
function _web_cursor(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 return;
}
function b2(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 abort(2);
}
function stackRestore(i1) {
 i1 = i1 | 0;
 STACKTOP = i1;
}
function setTempRet0(i1) {
 i1 = i1 | 0;
 tempRet0 = i1;
}
function _web_uninit(i1) {
 i1 = i1 | 0;
 return;
}
function _web_flush(i1) {
 i1 = i1 | 0;
 return;
}
function _get_buffer() {
 return HEAP32[6] | 0;
}
function getTempRet0() {
 return tempRet0 | 0;
}
function stackSave() {
 return STACKTOP | 0;
}
function b1(i1) {
 i1 = i1 | 0;
 abort(1);
}

// EMSCRIPTEN_END_FUNCS
  var FUNCTION_TABLE_iiiii = [b0,_web_init];
  var FUNCTION_TABLE_vi = [b1,_web_uninit,_web_flush,b1];
  var FUNCTION_TABLE_vii = [b2,_web_setattr,_web_print,_web_cursor];
  var FUNCTION_TABLE_viii = [b3,_web_getsize,_web_gotoxy,b3];

    return { _malloc: _malloc, _strlen: _strlen, _free: _free, _get_buffer: _get_buffer, _set_contrast: _set_contrast, _get_img_width: _get_img_width, _init: _init, _memset: _memset, _set_brightness: _set_brightness, _render: _render, _memcpy: _memcpy, _get_img_height: _get_img_height, _calloc: _calloc, _set_gamma: _set_gamma, runPostSets: runPostSets, stackAlloc: stackAlloc, stackSave: stackSave, stackRestore: stackRestore, setThrew: setThrew, setTempRet0: setTempRet0, getTempRet0: getTempRet0, dynCall_iiiii: dynCall_iiiii, dynCall_vi: dynCall_vi, dynCall_vii: dynCall_vii, dynCall_viii: dynCall_viii };
  
// EMSCRIPTEN_END_ASM

})({
 "Math": Math,
 "Int8Array": Int8Array,
 "Int16Array": Int16Array,
 "Int32Array": Int32Array,
 "Uint8Array": Uint8Array,
 "Uint16Array": Uint16Array,
 "Uint32Array": Uint32Array,
 "Float32Array": Float32Array,
 "Float64Array": Float64Array
}, {
 "abort": abort,
 "assert": assert,
 "asmPrintInt": asmPrintInt,
 "asmPrintFloat": asmPrintFloat,
 "min": Math_min,
 "invoke_iiiii": invoke_iiiii,
 "invoke_vi": invoke_vi,
 "invoke_vii": invoke_vii,
 "invoke_viii": invoke_viii,
 "_llvm_pow_f64": _llvm_pow_f64,
 "_send": _send,
 "_aaweb_get_height": _aaweb_get_height,
 "_aaweb_setattr": _aaweb_setattr,
 "___setErrNo": ___setErrNo,
 "_fflush": _fflush,
 "_pwrite": _pwrite,
 "__reallyNegative": __reallyNegative,
 "_sbrk": _sbrk,
 "_emscripten_memcpy_big": _emscripten_memcpy_big,
 "_fileno": _fileno,
 "_sysconf": _sysconf,
 "_aaweb_get_width": _aaweb_get_width,
 "_printf": _printf,
 "_puts": _puts,
 "_aaweb_print": _aaweb_print,
 "_write": _write,
 "_aaweb_init": _aaweb_init,
 "___errno_location": ___errno_location,
 "_aaweb_gotoxy": _aaweb_gotoxy,
 "_fputc": _fputc,
 "_mkport": _mkport,
 "__exit": __exit,
 "_abort": _abort,
 "_fwrite": _fwrite,
 "_time": _time,
 "_fprintf": _fprintf,
 "__formatString": __formatString,
 "_fputs": _fputs,
 "_exit": _exit,
 "STACKTOP": STACKTOP,
 "STACK_MAX": STACK_MAX,
 "tempDoublePtr": tempDoublePtr,
 "ABORT": ABORT,
 "NaN": NaN,
 "Infinity": Infinity
}, buffer);
var _malloc = Module["_malloc"] = asm["_malloc"];
var _strlen = Module["_strlen"] = asm["_strlen"];
var _free = Module["_free"] = asm["_free"];
var _get_buffer = Module["_get_buffer"] = asm["_get_buffer"];
var _set_contrast = Module["_set_contrast"] = asm["_set_contrast"];
var _get_img_width = Module["_get_img_width"] = asm["_get_img_width"];
var _init = Module["_init"] = asm["_init"];
var _memset = Module["_memset"] = asm["_memset"];
var _set_brightness = Module["_set_brightness"] = asm["_set_brightness"];
var _render = Module["_render"] = asm["_render"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _get_img_height = Module["_get_img_height"] = asm["_get_img_height"];
var _calloc = Module["_calloc"] = asm["_calloc"];
var _set_gamma = Module["_set_gamma"] = asm["_set_gamma"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_iiiii = Module["dynCall_iiiii"] = asm["dynCall_iiiii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
Runtime.stackAlloc = asm["stackAlloc"];
Runtime.stackSave = asm["stackSave"];
Runtime.stackRestore = asm["stackRestore"];
Runtime.setTempRet0 = asm["setTempRet0"];
Runtime.getTempRet0 = asm["getTempRet0"];
var i64Math = null;
if (memoryInitializer) {
 if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
  var data = Module["readBinary"](memoryInitializer);
  HEAPU8.set(data, STATIC_BASE);
 } else {
  addRunDependency("memory initializer");
  Browser.asyncLoad(memoryInitializer, (function(data) {
   HEAPU8.set(data, STATIC_BASE);
   removeRunDependency("memory initializer");
  }), (function(data) {
   throw "could not load memory initializer " + memoryInitializer;
  }));
 }
}
function ExitStatus(status) {
 this.name = "ExitStatus";
 this.message = "Program terminated with exit(" + status + ")";
 this.status = status;
}
ExitStatus.prototype = new Error;
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
dependenciesFulfilled = function runCaller() {
 if (!Module["calledRun"] && shouldRunNow) run();
 if (!Module["calledRun"]) dependenciesFulfilled = runCaller;
};
Module["callMain"] = Module.callMain = function callMain(args) {
 assert(runDependencies == 0, "cannot call main when async dependencies remain! (listen on __ATMAIN__)");
 assert(__ATPRERUN__.length == 0, "cannot call main when preRun functions remain to be called");
 args = args || [];
 ensureInitRuntime();
 var argc = args.length + 1;
 function pad() {
  for (var i = 0; i < 4 - 1; i++) {
   argv.push(0);
  }
 }
 var argv = [ allocate(intArrayFromString(Module["thisProgram"] || "/bin/this.program"), "i8", ALLOC_NORMAL) ];
 pad();
 for (var i = 0; i < argc - 1; i = i + 1) {
  argv.push(allocate(intArrayFromString(args[i]), "i8", ALLOC_NORMAL));
  pad();
 }
 argv.push(0);
 argv = allocate(argv, "i32", ALLOC_NORMAL);
 initialStackTop = STACKTOP;
 try {
  var ret = Module["_main"](argc, argv, 0);
  if (!Module["noExitRuntime"]) {
   exit(ret);
  }
 } catch (e) {
  if (e instanceof ExitStatus) {
   return;
  } else if (e == "SimulateInfiniteLoop") {
   Module["noExitRuntime"] = true;
   return;
  } else {
   if (e && typeof e === "object" && e.stack) Module.printErr("exception thrown: " + [ e, e.stack ]);
   throw e;
  }
 } finally {
  calledMain = true;
 }
};
function run(args) {
 args = args || Module["arguments"];
 if (preloadStartTime === null) preloadStartTime = Date.now();
 if (runDependencies > 0) {
  Module.printErr("run() called, but dependencies remain, so not running");
  return;
 }
 preRun();
 if (runDependencies > 0) return;
 if (Module["calledRun"]) return;
 function doRun() {
  if (Module["calledRun"]) return;
  Module["calledRun"] = true;
  if (ABORT) return;
  ensureInitRuntime();
  preMain();
  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
   Module.printErr("pre-main prep time: " + (Date.now() - preloadStartTime) + " ms");
  }
  if (Module["_main"] && shouldRunNow) {
   Module["callMain"](args);
  }
  postRun();
 }
 if (Module["setStatus"]) {
  Module["setStatus"]("Running...");
  setTimeout((function() {
   setTimeout((function() {
    Module["setStatus"]("");
   }), 1);
   doRun();
  }), 1);
 } else {
  doRun();
 }
}
Module["run"] = Module.run = run;
function exit(status) {
 ABORT = true;
 EXITSTATUS = status;
 STACKTOP = initialStackTop;
 exitRuntime();
 throw new ExitStatus(status);
}
Module["exit"] = Module.exit = exit;
function abort(text) {
 if (text) {
  Module.print(text);
  Module.printErr(text);
 }
 ABORT = true;
 EXITSTATUS = 1;
 var extra = "\nIf this abort() is unexpected, build with -s ASSERTIONS=1 which can give more information.";
 throw "abort() at " + stackTrace() + extra;
}
Module["abort"] = Module.abort = abort;
if (Module["preInit"]) {
 if (typeof Module["preInit"] == "function") Module["preInit"] = [ Module["preInit"] ];
 while (Module["preInit"].length > 0) {
  Module["preInit"].pop()();
 }
}
var shouldRunNow = true;
if (Module["noInitialRun"]) {
 shouldRunNow = false;
}
run();




