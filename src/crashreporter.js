/*! This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

/**
 * Module: CrashReporter
 *
 * Provides backend and UI for the crash reporter
 */
define( [ "dialog/dialog", "util/xhr", "util/uri" ], function( Dialog, XHR, URI ) {

  var STATE_EVENT_QUEUE_LENGTH = 10;

  var __stateEventNames = [
    "ready",
    "mediacontentchanged",
    "mediaready",
    "trackeventadded",
    "trackeventremoved",
    "trackadded",
    "trackremoved"
  ];

  var __stateEventQueue = [];

  // Only deal with errors we cause (i.e., same origin scripts).
  function shouldHandle( url ) {
    var uriScript = URI.parse( url );
    return uriScript.host === window.location.hostname;
  }

  // Wrap DOM accessor methods so we can track when nulls are returned.  This helps
  // when trying to sort out what happened with crashes.
  function overrideDomMembers( doc, elemProtos, nullList ) {

    // Wrap a function that returns a single node
    function wrappedFnNode( id, fn, obj ) {
      var elem = fn.call( obj, id );
      if( !elem && nullList[ nullList.length -1 ] !== id ) {
        nullList.push( id );
      }
      return elem;
    }

    // Wrap a function that returns a node list
    function wrappedFnNodeList( id, fn, obj ) {
      var list = fn.call( obj, id );
      if( !list.length && nullList[ nullList.length -1 ] !== id ) {
        nullList.push( id );
      }
      return list;
    }

    // Wrap Document functions
    var getElementById$ = doc.getElementById;
    doc.getElementById = function( id ) {
      return wrappedFnNode( id, getElementById$, doc );
    };

    var querySelector$doc = doc.querySelector;
    doc.querySelector = function( selectors ) {
      return wrappedFnNode( selectors, querySelector$doc, doc );
    };

    var querySelectorAll$doc = doc.querySelectorAll;
    doc.querySelectorAll = function( selectors ) {
      return wrappedFnNodeList( selectors, querySelectorAll$doc, doc );
    };

    // Wrap various HTML Element prototype functions. We have to do this
    // multiple times due to how some browsers implement the type hierarchy.
    elemProtos.forEach( function( proto ) {
      var querySelector$elem = proto.querySelector;
      proto.querySelector = function( selectors ) {
        return wrappedFnNode( selectors, querySelector$elem, this );
      };

      var querySelectorAll$elem = proto.querySelectorAll;
      proto.querySelectorAll = function( selectors ) {
        return wrappedFnNodeList( selectors, querySelectorAll$elem, this );
      };
    });
  }

  // Record a handfull of recently-triggered state-changing events.
  function butterStateChangedOnEvent( e ) {
    __stateEventQueue.push( e.type );
    if ( __stateEventQueue.length > STATE_EVENT_QUEUE_LENGTH ) {
      __stateEventQueue.shift();
    }
  }

  return {

    init: function( butter, config ) {

      __stateEventNames.forEach( function( eventName ) {
        butter.listen( eventName, butterStateChangedOnEvent );
      });

      // Don't start the crash reporter if told not to. If you want to debug
      // you can do ?crashReporter=0 to disable it in the current page.
      if( !config.value( "crashReporter" ) ||
          URI.parse( window.location.href ).queryKey.crashReporter === "0" ) {
        return;
      }

      // Cache existing window.onerror
      var _onerror = window.onerror ? window.onerror : function(){ return true; },
          _dialog, _nullDomList = [];

      // Keep track of DOM accessors that get back null nodes.  We wrap
      // Document, as well as a few HTML Elements, in order to deal with impl
      // differences across browsers.
      overrideDomMembers( window.document,
                          [
                            window.HTMLElement.prototype,
                            window.HTMLDivElement.prototype,
                            window.DocumentFragment.prototype
                          ],
                          _nullDomList );

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
            currentMedia = butter.currentMedia || { url: "unknown" },
            crashReport = {
              date: (new Date()).toDateString(),
              message: message,
              appUrl: window.location.href,
              scriptUrl: url,
              lineno: lineno,
              mediaUrl: currentMedia.url,
              stateList: __stateEventQueue,
              userAgent: navigator.userAgent,
              popcornVersion: popcornVersion,
              butterVersion: butterVersion,
              // Grab the last 5 null dom nodes, if any
              nullDomNodes: _nullDomList.slice( -5 ).join( ", " ) || "N/A",
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
