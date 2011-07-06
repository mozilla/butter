/**
  Butter.js Event Editor Module API
  Author: Christopher De Cairos
**/

(function( window, document, undefined, Butter ) {

  Butter.registerModule( "eventeditor", (function() {
    var editorTarget,
      targetType;
      
      toggleVisibility = function( attr ) {

        if ( editorTarget && editorTarget.style && attr ) {
          editorTarget.style.visibility = attr;
        } else if ( editorTarget && editorTarget.frameElement && attr ) {
          editorTarget.frameElement.style.visibility = attr;
        }
      },

      useCustomEditor = function( trackEvent, manifest ) {
        //use a custom editor
        typeof manifest.customEditor === "function" && manifest.customEditor( trackEvent, manifest, editorTarget );
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
          fragment = document.createDocumentFragment();

        //set-up UI:
        for ( prop in options ) {

          opt = options[ prop ];
          if ( typeof opt === "object" && prop !== "target-object" ) {

            elemType = opt.elem;
            elemLabel = opt.label;

            elem = document.createElement( elemType );
            elem.setAttribute( "className", "butter-editor-element" );

            label = document.createElement( "label" );
            label.innerHTML = elemLabel;
            label.setAttribute( "for", elemLabel );
            label.setAttribute( "text", elemLabel );

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
            fragment.appendChild( label );
          }
        }
        
        
        openBtn = document.createElement ("input");
        openBtn.type = "button";
        openBtn.addEventListener( "click", closeEditor, false );
        openBtn.value = "Close";
        fragment.appendChild( openBtn );
        
        if ( targetType === "element" ) {
          
          editorTarget.appendChild( fragment );
        } else if ( targetType === "iframe" ) {
        
          editorTarget.document.body.appendChild( fragment );
        }
        
        toggleVisibility( "visible" );
      },

      cancelEdit = function() {

        closeEditor();
      },

      deleteTrack =  function( trackEvent ) {

        Butter.removeTrackEvent( trackEvent );
        closeEditor();
      },

      closeEditor = function() {
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
        
        

        toggleVisibility( "hidden" );
      },

      updateTrackData = function( trackEvent ) {
        // update information in the editor if a track changes on the timeline.
      },

      applyChanges = function( trackEvent ) {

        Butter.trackEventChanged( trackEvent );
        closeEditor();
      },

      beginEditing = function( trackEvent, manifest ) {
        
        if (  !trackEvent || !manifest ) {

          return;
        }

        if ( !manifest.customEditor ) {

          constructDefaultEditor( trackEvent, manifest );
        } else {

          useCustomEditor( trackEvent, manifest );
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
    
        this.listen ( "trackeventremoved", function( trackEvent ) {

          closeEditor();
        });

        this.listen ( "trackeventchanged", function( trackEvent ) {

          updateTrackData( trackEvent );
        });

        this.listen ( "editTrackEvent", function( options ) {

          beginEditing( options.trackEvent, options.manifest );
        });

      }
    }
  })());

})( window, document, undefined, Butter );

