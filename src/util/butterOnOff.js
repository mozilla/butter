(function() {
  Popcorn.toggleOn = function( container ) {
    container.classList.remove( "off" )
    container.classList.add( "on" );

    container.style.display = "none";
    var junk = container.offsetHeight;
    container.style.display = "";
  };

  Popcorn.toggleOff = function( container ) {
    container.classList.remove( "on" );
    container.classList.add( "off" );
  };

})();