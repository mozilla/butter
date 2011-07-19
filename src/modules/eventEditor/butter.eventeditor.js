(function( window, document, undefined, Butter ) {

  Butter.registerModule( "eventeditor", (function() {

    var editorTarget,
        defaultEditor,
        binding,
        commServer,
        customEditors = {},
    
    constructEditor = function( trackEvent ) {
     
      var editorWindow,
        butter = this
        editorSrc =  customEditors[ trackEvent.type ] || trackEvent.manifest.customEditor || defaultEditor,
        updateEditor = function( trackEvent ){
          commServer.send( "editorCommLink", trackEvent.popcornOptions, "updatetrackevent" );
        };
        
      editorTarget && clearTarget()
        
      if ( binding === "bindWindow" ) {
        editorWindow = window.open( editorSrc, "", "width=400,height=400" );
        editorWindow.addEventListener( "unload", function() {
          butter.unlisten ( "trackeventupdated", updateEditor );
          butter.trigger( "trackeditforcedclosed" );
        }, false );
      } else if ( binding === "bindFrame" ) {
        editorWindow = document.createElement( "iframe" );
        editorWindow.src = editorSrc;
        editorTarget.appendChild( editorWindow );
      }
      
      commServer[ binding ]( "editorCommLink", editorWindow, function() {      
        butter.listen( "trackeventupdated", updateEditor );
        butter.listen( "targetadded", function() {
          commServer.send( "editorCommLink", butter.getTargets(), "updatedomtargets" );
        });
        commServer.listen( "editorCommLink", "okayclicked", function( newOptions ){
          trackEvent.popcornOptions = newOptions;
          editorWindow.close && editorWindow.close();
          editorWindow && editorWindow.parentNode && removeChild( editorWindow );
          butter.unlisten ( "trackeventupdated", updateEditor );
          butter.trigger( "trackeditclosed" );
          butter.trigger( "trackeventupdated" );
        });
        commServer.listen( "editorCommLink", "applyclicked", function( newOptions ) {
          trackEvent.popcornOptions = newOptions;
          butter.trigger( "trackeventupdated" );
        });
        commServer.listen( "editorCommLink", "deleteclicked", function() {
          butter.removeTrackEvent( trackEvent );
          editorWindow.close && editorWindow.close();
          editorWindow && editorWindow.parentNode && removeChild( editorWindow );
          butter.unlisten ( "trackeventupdated", updateEditor );
          butter.trigger( "trackeditclosed" );
        });
        commServer.listen( "editorCommLink", "cancelclicked", function() {
          editorWindow.close && editorWindow.close();
          editorWindow && editorWindow.parentNode && removeChild( editorWindow );
          butter.unlisten ( "trackeventupdated", updateEditor );
          butter.trigger( "trackeditclosed" );
        });
        commServer.send( "editorCommLink", { trackEvent: trackEvent, targets: butter.getTargets() }, "edittrackevent");
      });
      
    },

    clearTarget = function() {

      while ( editorTarget.firstChild ) {
        editorTarget.removeChild( editorTarget.firstChild );
      }
    }

    return {
    
      setup: function( options ) {

        if ( options && options.target && typeof options.target === "string" ) {

          editorTarget = document.getElementById( options.target ) || {};
        } else if ( options && options.target ) {

          editorTarget = options.target;
        }

        if ( editorTarget ) {

          binding = "bindFrame"
        } else {

          binding = "bindWindow";
        }
        
        defaultEditor = options && options.defaultEditor || "defaultEditor.html";
        
        commServer = new Butter.CommServer();
      },

      extend: {

        editTrackEvent: function( trackEvent ) {
        
           this.trigger( "trackeditstarted" );
           constructEditor.call( this, trackEvent );
        },
        
        addCustomEditor: function( editorSource, pluginType ) {
          
          if ( !pluginType || !editorSource ) {
            return;
          }
          
          customEditors[ pluginType ] = editorSource;
        } 
      }
    }
  })());

})( window, document, undefined, Butter );

