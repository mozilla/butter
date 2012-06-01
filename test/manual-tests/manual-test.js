
(function() {

  document.addEventListener( "DOMContentLoaded", function setup( e ){
    document.removeEventListener( "DOMContentLoaded", setup, false );

    var result,
        data = {};

    // Make sure we have a place to stick the Pass / Fail buttons
    var buttonDiv = document.getElementById( "manual-test-buttons" );
    if ( !buttonDiv ) {
      console.log("Error: couldn't find 'manual-test-buttons' DIV in test page!");
      return;
    }

    function getInfo() {
      return {
        ua: navigator.userAgent,
        popcornVersion: Popcorn.version,
        butterVersion: Butter.version,
        testTitle: document.title,
        testURL: /[^\/]+$/.exec(location.pathname)[ 0 ],
        result: result
      };
    }

    function passFn() {
      result = true;
      data = getInfo();
      console.log(data);

      _butter.cornfield.saveresult( data, function( e ) {
        console.log("OMG WE MADE IT TO TEH CALLBACKS LOLZ - PASS", e);
      });

      parent.postMessage("PASS", "*");
    }

    function failFn() {
      result = false;
      data = getInfo();

      _butter.cornfield.saveresult( data, function( e ) {
        console.log("OMG WE MADE IT TO TEH CALLBACKS LOLZ - FAIL", e);
      });

      parent.postMessage("FAIL", "*");
    }

    function createButton( text, clickFn ) {
      var button = document.createElement( "button" );
      button.innerHTML = text;
      button.style.cursor = "pointer";
      button.onclick = clickFn;

      return button;
    }

    buttonDiv.appendChild( createButton( "PASS", passFn ) );
    buttonDiv.appendChild( createButton( "FAIL", failFn ) );

  }, false );

})();
