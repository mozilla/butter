/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function(scope) {

var thisFile = 'custom-elements.js';

// NOTE: use attributes on the script tag for this file as directives

// exportAs="[name]"		exports polyfill scope into window as 'name'
// shadow="shim"        use shim version of ShadowDOM (otherwise native)

// NOTE: uses 'window' and 'document' globals

// acquire directives and base path from script element

var source, base = '';

(function() {
  var s$ = document.querySelectorAll('[src]');
  Array.prototype.forEach.call(s$, function(s) {
    var src = s.getAttribute('src');
    if (src.slice(-thisFile.length) === thisFile) {
      source = s;
      base = src.slice(0, -thisFile.length);
    }
  });
  source = source || {
    getAttribute: function() {}
  };
})();

// flags

var flags = {};

// acquire flags from script tag attributes

for (var i=0, a; (a=source.attributes[i]); i++) {
  flags[a.name] = a.value || true;
}

// acquire flags from url

if (!flags.noOpts) {
  var opts = location.search.slice(1).split('&');
  for (var i=0, o; (o=opts[i]); i++) {
    o = o.split('=');
    flags[o[0]] = o[1] || true;
  }
}

// process log flags

var logFlags = {};
if (flags.log) {
  var logs = flags.log.split(',');
  for (var i=0, f; (f=logs[i]); i++) {
    logFlags[f] = true;
  }
}
window.logFlags = logFlags;

// support exportas directive

scope = scope || {};

if (flags.exportas) {
  window[flags.exportas] = scope;
}
window.__exported_components_polyfill_scope__ = scope;

// module exports

scope.flags = flags;

// write script tags for dependencies

[
  'src/CustomElements.js',
  'src/HTMLElementElement.js',
  'src/Parser.js'
].forEach(function(inSrc) {
  document.write('<script src="' + base + inSrc + '"></script>');
});

})(window.__exported_components_polyfill_scope__);
