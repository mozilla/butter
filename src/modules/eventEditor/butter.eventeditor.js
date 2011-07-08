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
      
      toggleVisibility = function( attr ) {

        if ( editorTarget && editorTarget.style && attr ) {
          editorTarget.style.visibility = attr;
        } else if ( editorTarget && editorTarget.frameElement && attr ) {
          editorTarget.frameElement.style.visibility = attr;
        }
      },

      useCustomEditor = function( trackEvent, manifest ) {
        //use a custom editor
        var butter = this;
        toggleVisibility( "visible" );
        typeof manifest.customEditor === "function" && manifest.customEditor.call( this, { 
          trackEvent: trackEvent || {}, 
          manifest: manifest || {}, 
          target: editorTarget || {}, 
          callback: function( trackEvent, attributes ){
            applyChanges.call( butter, trackEvent, attributes );
          }
        });
      },
      
      // call when no custom editor markup/source has been provided
      constructDefaultEditor = function( trackEvent, manifest ) {

        var options = manifest.options,
          prop,
          opt,
          elemType,
          elemLabel,
          elem,
          label,
          attr,
          surroundingDiv = document.createElement("div"),
          style = surroundingDiv.style;
          
        style.margin = "0.5em 0 0";
        style.padding = "0.3em 1em 0.5em 0.4em";  
        style.background = "none repeat scroll 0 0 #FFFFFF";
        style.border = "1px solid #DDDDDD";
        style.color = "#333333";
        style.backgroundImage = "none";
        style.borderWidth = "1px 0 0";
        style.textAlign = "left";
        style.verticalAlign = "baseline";
        style.lineHeight = "1.5";

        //set-up UI:
        
        clearTarget();
        
        for ( prop in options ) {

          opt = options[ prop ];
          if ( typeof opt === "object" && prop !== "target-object" ) {

            elemType = opt.elem;
            elemLabel = opt.label;

            elem = document.createElement( elemType );
            elem.setAttribute( "className", "butter-editor-element" );
            elem.setAttribute( "id", elemLabel + "-input-element" );

            label = document.createElement( "label" );
            label.innerHTML = elemLabel;
            label.setAttribute( "for", elemLabel );
            label.setAttribute( "text", elemLabel );
            label.setAttribute( "className", "butter-editor-label butter-editor-element" );

            if ( elemType === "input" ) {

              attr = trackEvent.popcornEvent[ prop ];

              //  Round displayed times to nearest quarter of a second
              if ( typeof +attr === "number" && [ "start", "end" ].indexOf( prop ) > -1 ) {

                attr = Math.round( attr * 4 ) / 4;
              }

              elem.setAttribute( "value", attr );
            }

            if ( elemType === "select" ) {

              opt.options.forEach( function( type ) {

                var selectItem = document.createElement( "option" );
                selectItem.setAttribute( "value", type );
                selectItem.setAttribute( "text", type.charAt( 0 ).toUpperCase() + type.substring( 1 ).toLowerCase() );
                elem.appendChild( selectItem );
              });
            }

            label.appendChild( elem );
            surroundingDiv.appendChild( label );
            surroundingDiv.appendChild( document.createElement("br"));
          }
        }
        
        
        openBtn = document.createElement ("input");
        openBtn.type = "button";
        openBtn.addEventListener( "click", function() {
          clearTarget();
          toggleVisibility( "hidden" );
        }, false );
        openBtn.value = "Close";
        surroundingDiv.appendChild( openBtn );
        
        if ( targetType === "element" ) {
          
          editorTarget.appendChild( surroundingDiv );
        } else if ( targetType === "iframe" ) {
        
          editorTarget.document.body.appendChild( surroundingDiv );
        }
        
        toggleVisibility( "visible" );
      },

      cancelEdit = function() {

        clearTarget();
        toggleVisibility( "hidden" );
      },

      deleteTrack =  function( trackEvent ) {

        Butter.removeTrackEvent( trackEvent );
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
        return undefined;
      },

      applyChanges = function( trackEvent, attributes ) {
      
        //this.removeTrackEvent( trackEvent );
        trackEvent.attributes = attributes;
        //this.addTrackEvent( trackEvent );
        clearTarget();
        toggleVisibility("hidden");
        
        alert( "Information recieved from the custom Editor: \n\n Latitude: " + trackEvent.popcornEvent.lat + "\n Longitude: " + 
          trackEvent.popcornEvent.lng + "\n Map Type: " + trackEvent.popcornEvent.type +
          "\n Zoom: " + trackEvent.popcornEvent.zoom + "\n yay :)" );
      },

      beginEditing = function( trackEvent, manifest ) {
        
        if (  !trackEvent || !manifest ) {

          return;
        }

        if ( !manifest.customEditor ) {

          constructDefaultEditor.call( this, trackEvent, manifest );
        } else {

          useCustomEditor.call( this, trackEvent, manifest );
        }

      };
  
    return { 
      setup: function( options ) {
         
        var target = options.target || {};
         
        if ( target.nodeName && target.nodeName === "IFRAME" ) {
        
          editorTarget = (target.contentWindow) ? target.contentWindow : (target.contentDocument.document) ? target.contentDocument.document : target.contentDocument;;
          targetType = "iframe"
        } else {
        
          editorTarget = document.getElementById( options.target || "default-editor-target" );
          targetType = "element";
        }

      },
      
      extend: {
        
        editTrackEvent: function( options ) {
           
           beginEditing.call( this, options.trackEvent, options.manifest );
        },
        
        updateEditor: function( trackEvent ) {
        
          updateTrackData.call( this, trackEvent );
        }
      }
    }
  })());

})( window, document, undefined, Butter );

