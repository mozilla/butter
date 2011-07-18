/**********************************************************************************

Copyright (C) 2011 by Mozilla Foundation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

**********************************************************************************/

(function( window, document, undefined, Butter ) {

  Butter.registerModule( "eventeditor", (function() {

    var editorTarget,
      targetType,
      commServer,

      setVisibility = function( attr ) {

        if ( editorTarget && editorTarget.style && attr ) {
          editorTarget.style.visibility = attr;
        } else if ( editorTarget && editorTarget.frameElement && attr ) {
          editorTarget.frameElement.style.visibility = attr;
        }
      },

      useCustomEditor = function( trackEvent ) {

        //use a custom editor
        var butter = this,
          editor = trackEvent.popcornEvent._natives.manifest.customEditor || trackEvent.customEditor;
        clearTarget();
        setVisibility( "visible" );
        typeof editor === "function" && editor.call( this, {
          trackEvent: trackEvent || {},
          target: editorTarget || {},
          okay: function( trackEvent, popcornOptions ){
            applyChanges.call( butter, trackEvent, popcornOptions );
            clearTarget();
            setVisibility( "hidden" );
          },
          apply: function( trackEvent, popcornOptions, updateRemote ) {
            trackEvent = applyChanges( butter, trackEvent, popcornOptions );
            //update remote passes the reference to the latest trackEvent object back to the editor
            updateRemote && updateRemote( trackEvent );
          },
          cancel: function() {
            clearTarget();
            setVisibility("hidden");
          },
          remove: function( trackEvent ) {
            butter.removeTrackEvent( trackEvent.track, trackEvent );
            clearTarget();
            setVisibility( "hidden" );
          }
        });
      },

      // call when no custom editor markup/source has been provided
      constructDefaultEditor = function( trackEvent ) {
        var w = window.open("defaultEditor.html", "", "width=400,height=400");
        
        w.addEventListener( "load",function(){
        commServer.bindClientWindow( "defaultEditor", w, function(e) {
         //do something
        });
          commServer.send("defaultEditor", "This is a test", "test");
        }, false);
        
        
        console.log("before test");
        
        
      },

      clearTarget = function() {
        if ( targetType === "element" ) {
          while ( editorTarget.firstChild ) {
            editorTarget.removeChild( editorTarget.firstChild );
          }
        } else if ( targetType === "iframe" ){

          var ifrm = editorTarget.document.body;
          while ( ifrm.firstChild ) {

            ifrm.removeChild( ifrm.firstChild );
          }
        }

      },

      updateTrackData = function( trackEvent ) {
        // update information in the editor if a track changes on the timeline.
        return false;
      },

      applyChanges = function( trackEvent, popcornOptions ) {

        var newEvent = {};

        this.extendObj( newEvent, trackEvent );
        newEvent.popcornOptions = popcornOptions;

        this.removeTrackEvent( trackEvent.track, trackEvent );

        return this.addTrackEvent( newEvent.track, newEvent );

      },

      beginEditing = function( trackEvent ) {

        if ( !trackEvent ) {

          return;
        }

        if ( trackEvent.popcornEvent._natives.manifest.customEditor || trackEvent.customEditor ) {
          
          useCustomEditor.call( this, trackEvent );
        } else {

          constructDefaultEditor.call( this, trackEvent );
        }

      }

    return {
      setup: function( options ) {

        var target;

        if ( options.target && typeof options.target === "string" ) {

          target = document.getElementById( options.target || "butter-editor-target" ) || {};
        } else if ( options.target ) {

          target = options.target;
        } else {

          throw new Error( "ERROR - setup: options.target invalid" );
        }

        editorTarget = ((target.contentWindow) ? target.contentWindow : (target.contentDocument && target.contentDocument.document) ? target.contentDocument.document : target.contentDocument) || target;

        if ( target.nodeName && target.nodeName === "IFRAME" ) {

          targetType = "iframe"
        } else {

          editorTarget = target;
          targetType = "element";
        }
        
        commServer = new Butter.CommServer();
      },

      extend: {

        editTrackEvent: function( trackEvent ) {
        
           this.trigger( "trackeditstarted" );
           beginEditing.call( this, trackEvent );
        },

        updateEditor: function( trackEvent ) {
          
          updateTrackData.call( this, trackEvent );
        },

        extendObj: function( obj ) {
          var dest = obj, src = [].slice.call( arguments, 1 );

          src.forEach( function( copy ) {
            for ( var prop in copy ) {
              dest[ prop ] = copy[ prop ];
            }
          });
        }
      }
    }
  })());

})( window, document, undefined, Butter );

