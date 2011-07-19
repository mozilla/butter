(function( window, document, undefined, Butter ) {

  Butter.registerModule( "eventeditor", (function() {

    var editorTarget,
        binding,
        commServer,
    
    constructEditor = function( trackEvent ) {
     
      var editorWindow,
        butter = this
        editorSrc = trackEvent.manifest.customEditor || "defaultEditor.html";
        
      editorTarget && clearTarget()
        
      if ( binding === "bindWindow" ) {
        editorWindow = window.open( editorSrc, "", "width=400,height=400" );
      } else if ( binding === "bindFrame" ) {
        editorWindow = document.createElement( "iframe" );
        editorWindow.src = editorSrc;
        editorTarget.appendChild( editorWindow );
      }

      commServer[ binding ]( "editorCommLink", editorWindow, function() {
        butter.listen( "targetadded", function() {
          commServer.send( "editorCommLink", butter.getTargets(), "updatedomtargets" );
        });
        commServer.listen( "editorCommLink", "okayclicked", function( newOptions ){
          trackEvent.popcornOptions = newOptions;
          editorWindow.close && editorWindow.close();
          editorWindow && editorWindow.parentNode && removeChild( editorWindow );
          butter.trigger( "trackeditclosed" );
          butter.trigger( "trackeventedited" );
        });
        commServer.listen( "editorCommLink", "applyclicked", function( newOptions ) {
          trackEvent.popcornOptions = newOptions;
          butter.trigger( "trackeventedited" );
        });
        commServer.listen( "editorCommLink", "deleteclicked", function() {
          butter.removeTrackEvent( trackEvent );
          editorWindow.close && editorWindow.close();
          editorWindow && editorWindow.parentNode && removeChild( editorWindow );
          butter.trigger( "trackeditclosed" );
        });
        commServer.listen( "editorCommLink", "cancelclicked", function() {
          editorWindow.close && editorWindow.close();
          editorWindow && editorWindow.parentNode && removeChild( editorWindow );
          butter.trigger( "trackeditclosed" );
        });
        commServer.send( "editorCommLink", { trackEvent: trackEvent, targets: butter.getTargets() }, "edittrackevent");
      });
      
    },

    clearTarget = function() {

      while ( editorTarget.firstChild ) {
        editorTarget.removeChild( editorTarget.firstChild );
      }
    },

    updateTrackData = function( trackEvent ) {
      // update information in the editor if a track changes on the timeline.
      return false;
    }

    return {
    
      setup: function( options ) {

        if ( options.target && typeof options.target === "string" ) {

          editorTarget = document.getElementById( options.target ) || {};
        } else if ( options.target ) {

          editorTarget = options.target;
        }

        if ( editorTarget ) {

          binding = "bindFrame"
        } else {

          binding = "bindWindow";
        }
        
        commServer = new Butter.CommServer();
      },

      extend: {

        editTrackEvent: function( trackEvent ) {
        
           this.trigger( "trackeditstarted" );
           constructEditor.call( this, trackEvent );
        },

        updateEditor: function( trackEvent ) {
          
          updateTrackData.call( this, trackEvent );
        }
      }
    }
  })());

})( window, document, undefined, Butter );

