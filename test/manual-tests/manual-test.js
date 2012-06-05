
(function() {

  document.addEventListener( "DOMContentLoaded", function setup( e ){
    document.removeEventListener( "DOMContentLoaded", setup, false );

    var result,
        server = location.protocol + "//" + location.hostname + ( location.port ? ":" + location.port : "" );

    // Make sure we have a place to stick the Pass / Fail buttons
    var buttonDiv = document.getElementById( "manual-test-buttons" );
    if ( !buttonDiv ) {
      console.log( "Error: couldn't find 'manual-test-buttons' DIV in test page!" );
      return;
    }

    function getInfo() {
      return {
        testTitle: document.title,
        butterVersion: Butter.version,
        popcornVersion: Popcorn.version,
        ua: navigator.userAgent,
        result: result,
        testURL: /[^\/]+$/.exec( location.pathname )[ 0 ]
      };
    }

    function postResults( data ) {
      var xhr = XMLHttpRequest();

      xhr.open( "POST", server + "/api/tests/", false );

      xhr.onreadystatechange = function() {
        if ( this.readyState === 4 ) {
          var response;
          try {
            response = JSON.parse( this.responseText );
          } catch ( err ) {
            console.error( "failed to parse data from server: \n" + err );
          }
        }
      };

      xhr.setRequestHeader( "Content-Type", "application/json" );
      xhr.send( data );
    }

    function passFn() {
      result = true;
      var data = JSON.stringify( getInfo() );

      postResults( data );

      parent.postMessage( "PASS", "*" );
      disableButtons();
    }

    function failFn() {
      result = false;
      var data = JSON.stringify( getInfo() );

      postResults( data );

      parent.postMessage( "FAIL", "*" );
      disableButtons();
    }

    function disableButtons() {
      document.getElementById( "PASS" ).disabled = true;
      document.getElementById( "FAIL" ).disabled = true;
    }

    function createButton( text, clickFn ) {
      var button = document.createElement( "button" );
      button.innerHTML = text;
      button.style.cursor = "pointer";
      button.onclick = clickFn;
      button.id = text;

      return button;
    }

    buttonDiv.appendChild( createButton( "PASS", passFn ) );
    buttonDiv.appendChild( createButton( "FAIL", failFn ) );

  }, false );

})();
