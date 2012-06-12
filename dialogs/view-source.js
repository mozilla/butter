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
  }, false );

  htmlButton.addEventListener( "click", function( e ){
    title.innerHTML = "HTML Export";
    htmlExport.style.display = "block";
    jsonExport.style.display = "none";
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
    Dialog.enableElements( "json-button", "html-button" );
  });
});
