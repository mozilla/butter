define([], function() {

  return function( butter ) {

    var changed = false,
        events = [
          "mediacontentchanged",
          "mediatargetchanged",
          "trackadded",
          "trackremoved",
          "tracktargetchanged",
          "trackeventadded",
          "trackeventremoved",
          "trackeventupdated"
        ];

    var areYouSure = function() {
      return "You have unsaved project data.";
    };

    var mediaReady = function() {
      butter.unlisten( "mediaready", mediaReady );
      for ( var i = 0, el = events.length; i < el; i++ ) {
        butter.listen( events[ i ], eventFunction );
      }
    };

    var eventFunction = function() {
      if ( !changed ) {
        changed = true;
        window.onbeforeunload = areYouSure;
      }
    };

    butter.listen( "mediaready", mediaReady );

    butter.listen( "projectsaved", function() {
      changed = false;
      window.onbeforeunload = null;
    });
  };
});

