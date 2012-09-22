define([], function() {

  return function( butter ) {

    function areYouSure() {
      return "You have unsaved project data.";
    }

    butter.listen( "projectchanged", function() {
      window.onbeforeunload = areYouSure;
    });

    butter.listen( "projectsaved", function() {
      window.onbeforeunload = null;
    });
  };

});
