document.addEventListener( "DOMContentLoaded", function( e ){
  Butter({
    modules: {
      preview: {
      },
      timeline: {
      }
    },
    ready: function( butter ){
      //var media = butter.addMedia({});
      butter.preview.prepare(function() {
       
        console.log( butter );
        butter.media[ 0 ].url = "http://download.blender.org/peach/trailer/trailer_400p.ogg"
      });
      console.log( butter.exportProject() );
    } 
  }); //Butter
}, false );
