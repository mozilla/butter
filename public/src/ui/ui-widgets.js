define([], function() {
  return {
    tabs: function( options ) {
      var element,
          onUpdate;

      if ( options instanceof HTMLElement ) {
        // You can pass it an element or a list of options
        element = options;
        options = {};
      } else {
        options = options || {};
        element = options.element;
      }
      onUpdate = options.onUpdate || function(){};

      var controls = element.querySelectorAll( "[data-tab-control]" ),
          panels = element.querySelectorAll( "[data-tab]" ),
          i;

      function onClick( e ) {
        var whichTab = this.getAttribute( "data-tab-control" ),
            j;

        e.preventDefault();

        for ( j = 0; j < controls.length; j++ ) {
          controls[ j ].classList.remove( "tab-on" );
        }
        this.classList.add( "tab-on" );

        if ( !whichTab ) {
          return;
        }

        for ( j = 0; j < panels.length; j++ ) {
          panels[ j ].classList.remove( "tab-on" );
        }
        element.querySelector( "[data-tab=\"" + whichTab + "\"]" ).classList.add( "tab-on" );
        onUpdate();
      }

      for ( i = 0; i < controls.length; i++ ) {
        controls[ i ].addEventListener( "click", onClick, false );
        var whichTab = controls[ i ].getAttribute( "data-tab-control" );
        if ( controls[ i ].hasAttribute( "data-tab-default" ) ) {
          element.querySelector( "[data-tab=\"" + whichTab + "\"]" ).classList.add( "tab-on" );
        }
      }
    }
  };
 });
