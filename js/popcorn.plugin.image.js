// EXAMPLE PLUGIN: IMAGE

(function (Popcorn) {
  
  Popcorn.plugin( "image" , (function(){
      
    var container, img, src, title, alt, clickListener, loadListener
    
    return {

      manifest: {
        about:{
          name    : "Popcorn Image Plugin",
          version : "0.1",
          author  : "Alistair MacDonald",
          website : "http://bocoup.com"
        },
        options:{
          start   : {elem:'input', type:'text', label:'In'},
          end     : {elem:'input', type:'text', label:'Out'},
          alt     : {elem:'input', type:'text', label:'Alt'},
          title   : {elem:'input', type:'text', label:'Title'},
          src     : {elem:'input', type:'text', label:'Src'}
        }
      },

      start: function(event, options){
      
        container = document.getElementById(options.target);
        img = new Image();

        loadListener = function(){
          this.alt = options.alt;
          this.title = options.title;

          clickListener = function(){ options.click.call( img ); };
          this.addEventListener('click', function(){ clickListener(); }, false);

          container.appendChild( img );
        };
        
        img.addEventListener('load', function(){ loadListener.call( img ) }, false); 
        
        img.src = options.src;
      },
      
      end: function(event, options){
        img.removeEventListener( 'load', loadListener, false );
        img.removeEventListener( 'click', clickListener, false );
        container.removeChild( img );
      }
      
    };
    
  })());

})( Popcorn );
