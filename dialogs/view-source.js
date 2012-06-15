/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

Dialog.ready(function(){
  var jsonButton = document.getElementById( "json-button" ),
      htmlButton = document.getElementById( "html-button" ),
      jsonExport = document.getElementById( "json-export" ),
      htmlExport = document.getElementById( "html-export" ),
      title = document.getElementById( "title" );

  title.innerHTML = "HTML Export";

  Dialog.disableElements( "json-button", "html-button" );

  jsonButton.addEventListener( "click", function( e ){
    title.innerHTML = "Project JSON Data";
    htmlExport.style.display = "none";
    jsonExport.style.display = "block";
    Dialog.disableElements( "json-button" );
    Dialog.enableElements( "html-button" );
  }, false );

  htmlButton.addEventListener( "click", function( e ){
    title.innerHTML = "HTML Export";
    htmlExport.style.display = "block";
    jsonExport.style.display = "none";
    Dialog.disableElements( "html-button" );
    Dialog.enableElements( "json-button" );
  }, false );

  Dialog.wait( "export", function( e ){
    try{
      jsonExport.value = JSON.stringify( e.data.json, null, 2 );
    }
    catch( e ){
      jsonExport.value = "There was an error trying to parse the JSON for this project. Please file a bug at https://webmademovies.lighthouseapp.com/projects/65733-butter/ and let us know.";
    }
    htmlExport.value = e.data.html;
    Dialog.enableCloseButton();
    Dialog.assignEscapeKey( "default-close" );
    Dialog.assignEnterKey( "default-close" );
    Dialog.enableElements( "json-button" );
  });
});
