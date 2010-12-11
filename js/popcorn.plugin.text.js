// EXAMPLE PLUGIN: TEXT

(function (Popcorn) {
  
  Popcorn.plugin( "text" , (function(){
      
    var container, p, text;
    
    return {

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
