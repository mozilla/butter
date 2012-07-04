define([], function(){

  return function( butter ){

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

    var eventFunction = function() {

      if ( !changed ) {

        changed = true;
        window.onbeforeunload = areYouSure;
      }
    };

    butter.listen( "ready", function() {

      for ( var i = 0, el = events.length; i < el; i++ ) {

        butter.listen( events[ i ], eventFunction );
      }
    });

    butter.listen( "projectsaved", function() {

      changed = false;
      window.onbeforeunload = null;
    });
  };
});

