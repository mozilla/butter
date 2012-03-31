define([], function(){
  
  return function( parentElement ){

    var outerElement = document.createElement( "div" ),
        innerElement = document.createElement( "div" );

    outerElement.className = "butter-logo-spin-outer";
    innerElement.className = "butter-logo-spin-inner";

    outerElement.appendChild( innerElement );

    if( parentElement ){
      parentElement.appendChild( outerElement );
    }

    return {
      element: outerElement,
      start: function(){
        innerElement.classList.add( "active" );
      },
      stop: function(){
        innerElement.classList.remove( "active" );
      },
      show: function(){
        outerElement.classList.remove( "fade-out" );
      },
      hide: function(){
        outerElement.classList.add( "fade-out" );
      }
    };

  };

});