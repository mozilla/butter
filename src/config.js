/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define(function( require, exports, module ){

  //Use the global requirejs to create a new context.
  var ctx = requirejs.config({
    context: "butter",
    baseUrl: module.uri.substring(0, module.uri.lastIndexOf('/')),
    // Paths are relative to the baseUrl
    paths: {
      'text': '../external/require/text',
      'jsSHA': '../external/jsSHA',
      'UAParser': '../external/ua-parser'
    }
  });

  ctx( [ "main" ] );
});
