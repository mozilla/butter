/**
 * Build profile for Butter Embed. Replaces the use of requirejs with an AMD
 * loader shim, almond.js, since the built file does not need to use
 * all of requirejs.
 */
({
  // Where to find the module names listed below.
  baseUrl: '../src',

  paths: {
    'text': '../external/require/text'
  },

  // Target the AMD loader shim as the main module to optimize,
  // so it shows up first in the built file,
  // since the embed modules use the define/require APIs that the almond
  // provides. Path is relative to baseUrl.
  name: '../tools/almond',

  // Strip extra licenses
  preserveLicenseComments: false,

  // Files to include along with almond. Their nested dependencies will also be
  // included.
  include: [ 'embed' ],

  // Wraps Butter in a closure and adds license information
  wrap: {
    startFile: '../tools/wrap.start',
    endFile: '../tools/wrap.end'
  },

  // The built embed.js file for use by web sites.
  out: '../dist/src/embed.js'
})
