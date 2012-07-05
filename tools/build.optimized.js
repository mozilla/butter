/**
 * Build profile for butter. Replaces the use of requirejs with an AMD
 * loader shim, almond.js, since the built file does not need to use
 * all of requirejs.
 */
({
  // Where to find the module names listed below.
  baseUrl: '../src',

  paths: {
    'text': '../external/require/text'
  },

  // Use has branch trimming in the build to remove the document.write
  // code in src/butter.js after a minification is done.
  has: {
    'source-config': false
  },

  // Target the AMD loader shim as the main module to optimize,
  // so it shows up first in the built file,
  // since the butter modules use the define/require APIs that the almond
  // provides. Path is relative to baseUrl.
  name: '../tools/almond',

  // Files to include along with almond. Their nested dependencies will also be
  // included. Subsystems are listed explicitly because butter-src.js does not
  // have explicit dependencies for them, but uses them on demand. Also,
  // butter.js references butter-src in a document.write string, so it will
  // not be found by the AST analysis done in the optimizer.
  include: [
            'butter',
            'main'
           ],

  // Wraps Butter in a closure and adds license information
  wrap: {
    startFile: '../tools/wrap.start',
    endFile: '../tools/wrap.end'
  },

  // The built butter.min.js file for use by web sites.
  out: '../dist/butter.min.js'
})
