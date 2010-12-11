// EXAMPLE PLUGIN: IFRAME

(function (Popcorn) {
  
  Popcorn.plugin( "iframe" , (function(){
      
    var container, iframe, src
    
    return {

      start: function(event, options){
        container = document.getElementById(options.target);
        iframe = document.createElement('iframe');
        iframe.src = options.src;
        container.appendChild(iframe);
      },
      
      end: function(event, options){
        container.removeChild( iframe );
      }
      
    };
    
  })());

})( Popcorn );
