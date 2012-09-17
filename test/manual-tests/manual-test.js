
(function() {

  document.addEventListener( "DOMContentLoaded", function setup( e ){
    document.removeEventListener( "DOMContentLoaded", setup, false );

    var result,
        now;

    // Make sure we have a place to stick the Pass / Fail buttons
    var buttonDiv = document.getElementById( "manual-test-buttons" );
    if ( !buttonDiv ) {
      console.log( "Error: couldn't find 'manual-test-buttons' DIV in test page!" );
      return;
    }

    function getInfo() {
      return {
        testTitle: document.title,
        butterVersion: Butter.version === "@VERSION@" ? Butter.version + " - " + now : Butter.version,
        popcornVersion: Popcorn.version === "@VERSION" ? Popcorn.version + " - " + now : Popcorn.version,
        ua: navigator.userAgent,
        result: result ? "Passed" : "Failed",
        testURL: /[^\/]+$/.exec( location.pathname )[ 0 ]
      };
    }

    function passFn() {
      result = true;
      now = new Date();
      now = now.toDateString();
      parent.postMessage( getInfo(), "*" );
    }

    function failFn() {
      result = false;
      now = new Date();
      now = now.toDateString();
      parent.postMessage( getInfo(), "*" );
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
