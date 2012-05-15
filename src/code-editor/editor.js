/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define([ 'codemirror' ], function(){

  setTimeout(function(){
  var myCodeMirror = CodeMirror(function(element){
      document.body.appendChild(element);
    },
    {
      value: document.body.innerHTML,
      mode: "javascript"
    });
  }, 2000);
});