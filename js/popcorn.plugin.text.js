// EXAMPLE PLUGIN: TEXT

(function (Popcorn) {
  
  Popcorn.plugin( "text" , (function(){
      
    var container, p, text;
    
    return {

      manifest: {
        about:{
          name: "Popcorn Text Plugin",
          version: "0.1",
          author: "Alistair MacDonald",
          website: "http://bocoup.com"
        },
        options:{
          start   : {elem:'input', type:'text', label:'In'},
          end     : {elem:'input', type:'text', label:'Out'},
          text    : {elem:'input', type:'text', label:'Text'}
        }
      },

      start: function(event, options){
        container = document.getElementById(options.target);
        p = document.createElement('p');
        $(p).text( options.text );
        container.appendChild(p);
      },
      
      end: function(event, options){
        container.removeChild( p );
      }
      
    };
    
  })());

})( Popcorn );
