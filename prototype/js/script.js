/* Author:

*/
document.addEventListener( "DOMContentLoaded", function(){

  var HEADER_HEIGHT = 300,
      switched = false;

  function each( list, callback ) {
    var i;
    for( i=0; i<list.length; i++ ) {
      callback( list[ i ] );
    }
  }

  function _selectToDropDown( container ) {
    var ul = container.querySelector( "ul" ),
        select = container.querySelector( "select" ),
        options,
        i;

    function _createLink( optionEl ) {
      var li = document.createElement( "li" ),
          a = document.createElement( "a" );

      a.innerHTML = optionEl.innerHTML;
      a.addEventListener( "click", function( e ) {
        e.preventDefault();
        select.value = optionEl.value;
        console.log( select.value );
      });

      li.appendChild( a );
      ul.appendChild( li );
      container.appendChild( ul );
    }

    if ( ul ) {
      return ul;
    } else if ( select ) {
      select.style.display = "none";
      ul = document.createElement( "ul" );
      options = select.getElementsByTagName( "option" );
      for ( i=0; i<options.length; i++ ) {
        _createLink( options[ i ] );
      }
      return ul;
    }
  }

  each( document.querySelectorAll( "div.ui-button-group" ), function( el ) {
    var dropdown = _selectToDropDown( el ),
       a = el.querySelector( "a" );
    a.addEventListener( "click", function() {
      el.classList.toggle( "ui-on" );
    }, false);
  });


  //SCROLL STUFF
  /*
  window.addEventListener( "scroll", function( e ){
    var logo = document.getElementById( "logo" ),
        scrollTop = window.scrollY,
        RATIO = 1,
        switched = false;

    logo.style.position = "fixed";

    if ( scrollTop < HEADER_HEIGHT / RATIO ) {
      logo.classList.remove( "pinned" );
    } else if ( scrollTop >= HEADER_HEIGHT / RATIO ) {
      logo.classList.add( "pinned" );
      logo.style.top = "";
    }
    

  }, false );

*/

}, false);


