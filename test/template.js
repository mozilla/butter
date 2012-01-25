document.addEventListener( "DOMContentLoaded", function( e ){
  Butter({
    modules: {
      preview: {
      },
      timeline: {
      }
    },
    ready: function( butter ){
      var media = butter.addMedia({});
      console.log( media.json );
    } 
  }); //Butter
}, false );
