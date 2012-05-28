document.addEventListener( "DOMContentLoaded", function( e ){
  Butter({
    config: 'test-config.json',
    ready: function(butter){
      setTimeout(function(){
        var e = butter.exportProject();
        butter.clearProject();
        butter.importProject(e);
      }, 500);
    }
  });

}, false );
