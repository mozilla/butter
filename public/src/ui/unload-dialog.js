define([], function() {

  return function( butter ) {

    // We only want to nag users about this if they've never saved at all,
    // since our project backups start automatically after the user clicks
    // Save the first time.  Once they've saved, if they exit, they either saved
    // or we have a backup and can restore on reload.
    var _projectWasSavedOnce = false;

    function areYouSure() {
      return "You have unsaved project data.";
    }

    butter.listen( "projectchanged", function() {
      if ( !_projectWasSavedOnce ) {
        window.onbeforeunload = areYouSure;
      }
    });

    butter.listen( "projectsaved", function() {
      _projectWasSavedOnce = true;
      window.onbeforeunload = null;
    });
  };

});
