define([], function(){

  return function( butter ){

    var changed = false,
        events = [
          "mediacontentchanged",
          "mediadurationchanged",
          "mediatargetchanged",
          "trackadded",
          "trackremoved",
          "tracktargetchanged",
          "trackeventadded",
          "trackeventremoved",
          "trackeventupdated"
        ];

    for ( var i = 0, el = events.length; i < el; i++ ) {

      butter.listen( events[ i ], function() {

        if ( !changed ) {

          changed = true;
          window.onbeforeunload = function() {

            return "You have unsaved project data.";
          };
        }
      });
    }

    butter.listen( "projectsaved", function() {

      changed = false;
      window.onbeforeunload = null;
    });
  };
});

