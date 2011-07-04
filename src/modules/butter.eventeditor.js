/**
  Butter.js Event Editor Module API
  Author: Christopher De Cairos
**/

(function( Butter ) {

  Butter.modules.register( "eventeditor", function( options ) {

    var EventEditor = function() {
      
      // call when no custom editor markup/source has been provided
      var constructDefaultEditor = function() {
        //set-up UI:

        //when submit is pressed, call applyChanges( newTrackEvent );

        //if delete pressed call deleteTrack( TrackEvent );

        //if cancel pressed call cancelEdit();
      },

      cancelEdit = function() {
        // cancels changes to the track
      },

      deleteTrack =  function( trackEvent ) {
        // send message to to Core that a track is to be Deleted ( Core would forward message to Timeline module ).
      },

      closeEditor = function() {
        // destroys editor
      },

      updateTrackData = function( trackEvent ) {
        // update information in the editor if a track changes on the timeline.
      },

      applyChanges = function( trackEvent ) {

        Butter.trackEventChanged( trackEvent );
        closeEditorWindow();
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

  };

}( Butter ));

