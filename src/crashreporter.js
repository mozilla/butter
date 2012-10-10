/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

/**
 * Module: CrashReporter
 *
 * Provides backend and UI for the crash reporter
 */
define( [ "dialog/dialog", "util/xhr", "util/uri" ], function( Dialog, XHR, URI ) {

  // Only deal with errors we cause (i.e., same origin scripts).
  function shouldHandle( url ) {
    var uriScript = URI.parse( url );
    return uriScript.host === window.location.hostname;
  }

  return {

    init: function( config ) {

      // Don't start the crash reporter if told not to. If you want to debug
      // you can do ?crashReporter=0 to disable it in the current page.
      if( !config.value( "crashReporter" ) ||
          URI.parse( window.location.href ).queryKey.crashReporter === "0" ) {
        return;
      }

      // Cache existing window.onerror
      var _onerror = window.onerror ? window.onerror : function(){ return true; },
          _dialog;

      window.onerror = function( message, url, lineno ) {
        if ( !window.XMLHttpRequest ) {
          return _onerror();
        }

        // Only handle cases we care about, since things like YouTube embeds can
        // (and do!) throw dozens of cross-origin errors which aren't fatal.
        if ( !shouldHandle( url ) ) {
          return _onerror();
        }

        // Only show the reporter once, even if there are multiple errors
        if ( _dialog ) {
          return _onerror();
        }

        // Once report is sent, force a reload of the page.
        function attemptRecovery() {
          // Remove the "Are you sure?" navigation check, since we have to reload
          window.onbeforeunload = null;
          window.location.reload( true );
        }

        // If the user agrees, post anonymous details of the error back to Mozilla
        function sendErrorReport( comments ) {
          delete crashReport.onSendReport;
          delete crashReport.onNoReport;
          crashReport.comments = comments;
          XHR.post( "/crash", JSON.stringify( crashReport, null, 4 ),
                    attemptRecovery, "text/json" );
        }

        // Be careful about trusting our objects if we've crashed.
        var popcornVersion = window.Popcorn ? window.Popcorn.version : "unknown",
            butterVersion = window.Butter ? window.Butter.version : "unknown",
            crashReport = {
              message: message,
              url: url,
              lineno: lineno,
              userAgent: navigator.userAgent,
              popcornVersion: popcornVersion,
              butterVersion: butterVersion,
              onSendReport: sendErrorReport,
              onNoReport: attemptRecovery
            };

        try {
          _dialog = Dialog.spawn( "crash", { data: crashReport } );
          _dialog.listen( "close", function() { _dialog = null; } );
          _dialog.open();
        } catch( e ) {
          attemptRecovery();
        }

        return _onerror();
      };
    },

    // Testing API for simulating a top-level error
    simulateError: function() {
      // If crashReporter=false|0, we won't have initialized, so bail.
      if( !window.onerror ) {
        return;
      }
      window.onerror( "Simulated error via crashReporter.simulateError()", window.location.href, 0 );
    }

  };
});
