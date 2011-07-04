/**
  Butter.js Event Editor Module API
  Author: Christopher De Cairos
**/

(function( Butter ) {

  Butter.registerModule( "eventeditor", function( options ) {

    var EventEditor = function( options ) {

      var editorTarget = options.target && document.getElementById( options.target ) || document.createElement( "div" ),

      toggleVisibility = function( attr ) {

        if ( editorTarget && attr ) {
          editorTarget.style.visibility = attr;
        }
      },
      
      useCustomEditor = function() {
        //use a custom editor
      },
      // call when no custom editor markup/source has been provided
      constructDefaultEditor = function( trackEvent, manifest ) {

        var options = manifest.options,
          prop,
          opt,
          elemType,
          elemLabel,
          elem,
          label;

        //set-up UI:
        for ( prop in options ) {

          opt = options[ prop ];
          if ( typeof opt === "object" && prop !== "target-object" ) {

            elemType = opt.elem;
            elemLabel = opt.label;

            elem = document.createElement( elemType );
            elem.setAttribute( "className", "butter-editor-element" );

            label = document.createElement( "label" );
            label.setAttribute( "for", elemLabel );
            label.setAttribute( "text", elemLabel );

            if ( elemType === "input" ) {

              var rounded = trackEvent[ prop ];

              //  Round displayed times to nearest quarter of a second
              if ( typeof +rounded === "number" && [ "start", "end" ].indexOf( prop ) > -1 ) {

                rounded = Math.round( rounded * 4 ) / 4;
              }

              elem.setAttribute( "value", rounded );
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
            editorTarget.appendChild( label );

            toggleVisibility( "visible" );

          }
        }

        //when submit is pressed, call applyChanges( newTrackEvent );

        //if delete pressed call deleteTrack( TrackEvent );

        //if cancel pressed call cancelEdit();
      },

      cancelEdit = function() {

        closeEditor();
      },

      deleteTrack =  function( trackEvent ) {

        Butter.removeTrackEvent( trackEvent );
        closeEditor();
      },

      closeEditor = function() {

        while ( editorTarget.firstChild ) {
          editorTarget.removeChild( editorTarget.firstChild );
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

        manifest = manifest || {};

        if ( !manifest ) {

          return;
        }

        if ( !manifest.customEditor ) {

          constructDefaultEditor( trackEvent, manifest );
        } else {

          useCustomEditor()
        }

      };

      Butter.listen ( "trackeventremoved", function( trackEvent ) {

        closeEditor();
      });

      Butter.listen ( "trackeventchanged", function( trackEvent ) {

        updateTrackData( trackEvent );
      });

      Butter.listen ( "editTrackEvent", function( trackEvent, manifest ) {

        beginEditing( trackEvent, manifest );
      });

    };

    return new EventEditor();

  });

}( Butter ));

