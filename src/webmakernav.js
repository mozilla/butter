function init( window, document ) {
  var require = requirejs.config({
    context: "webmakernav",
    baseUrl: "/src",
    paths: {
      text: "../external/require/text"
    }
  });

  require( [ "ui/webmakernav/webmakernav" ], function( WebmakerNav ) {
    WebmakerNav.call({}, {
      hideLogin: true,
      hideFeedback: true,
      container: document.getElementById( 'webmaker-nav' ),
      feedbackCallback: function() {}
    });
  });
}

document.addEventListener( "DOMContentLoaded", function() {
  // Source tree case vs. require-built case.
  if ( typeof require === "undefined" ) {
    var requireScript = document.createElement( "script" );
    requireScript.src = "../../external/require/require.js";
    requireScript.onload = function() {
      init( window, window.document );
    };
    document.head.appendChild( requireScript );
  } else {
    init( window, window.document );
  }
}, false );