(function(){
  var _comm = new Comm(),
      _manifest = {};

  // TODO: this should be something we reuse from src/ui/widget/textbox.js
  // with require.  We need to expose butter internals to editors.
  // https://webmademovies.lighthouseapp.com/projects/65733/tickets/1174
  function __highlight( e ){
    var input = e.target;
    input.select();
    input.removeEventListener( "focus", __highlight, false );
  }

  function __ignoreMouseUp( e ){
    e.preventDefault();
    var input = e.target;
    input.removeEventListener( "mouseup", __ignoreMouseUp, false );
  }

  function __addListeners( input ){
    input.addEventListener( "focus", __highlight, false );
    input.addEventListener( "mouseup", __ignoreMouseUp, false );
  }

  function __TextboxWrapper( input ){

    if( !( input && input.type === "text" ) ){
      throw "Expected an input element of type text";
    }

    input.addEventListener( "blur", function( e ){
      __addListeners( e.target );
    }, false);

    __addListeners( input );

    return input;

  }


  document.addEventListener( "DOMContentLoaded", function( e ){

    function sendData( alsoClose ){
      alsoClose = !!alsoClose;
      var popcornOptions = {};
      for( var item in _manifest ) {
        popcornOptions[ item ] = document.getElementById( item ).value;
      }
      document.getElementById( "message" ).innerHTML = "";
      _comm.send( "submit", {
        eventData: popcornOptions,
        alsoClose: alsoClose
      });
    } //sendData

    function okPressed( e ) {
      sendData( true );
    }

    function cancelPressed( e ) {
      _comm.send( "cancel" );
    }

    document.addEventListener( "keydown", function( e ) {
      if( e.keyCode === 13 ) {
        okPressed( e );
      } else if( e.keyCode === 27 ) {
        cancelPressed( e );
      }
    }, false);

    _comm.listen( "close", function( e ){
      // use this to process something right before the editor closes
    });

    _comm.listen( "trackeventupdated", function( e ){
      for( var item in _manifest ){
        var element = document.getElementById( item );
        element.value = e.data[ item ];
      } //for
    });

    _comm.listen( "trackeventupdatefailed", function( e ) {
      if( e.data === "invalidtime" ){
        document.getElementById( "message" ).innerHTML = "You've entered an invalid start or end time. Please verify that they are both greater than 0, the end time is equal to or less than the media's duration, and that the start time is less than the end time.";
      } //if
    });

    _comm.listen( "trackeventdata", function( e ){
      var popcornOptions = e.data.popcornOptions,
          targets = e.data.targets,
          media = e.data.media,
          mediaName = "Current Media Element",
          elemToFocus;

      if( media && media.name && media.target ){
        mediaName += " (\"" + media.name + "\": " + media.target + ")";
      } //if

      _manifest = e.data.manifest.options;

      for( var item in _manifest ) {
        var row = document.createElement( "TR" ),
            col1 = document.createElement( "TD" ),
            col2 = document.createElement( "TD" ),
            elem = _manifest[ item ].elem,
            field;

        var itemLabel = _manifest[ item ].label || item;
        itemLabel = itemLabel.charAt( 0 ).toUpperCase() + itemLabel.slice( 1 );
        if( itemLabel === "In" ){
          itemLabel = "Start (seconds)";
        }
        else if( itemLabel === "Out" ){
          itemLabel = "End (seconds)";
        } //if

        col1.innerHTML = "<span>" + itemLabel + "</span>";

        if( item === "target" ) {
          field = document.createElement( "SELECT" );
          field.id = "target";

          for( var i = 0, l = targets.length; i < l; i++ ) {
            var option = document.createElement( "OPTION" );
            option.value = targets[ i ];
            option.innerHTML = targets[ i ];
            field.appendChild( option );
            if( popcornOptions.target === targets[ i ] ) {
              field.value = targets[ i ];
            }
          }
          var option = document.createElement( "OPTION" );
          option.value = "Media Element";
          option.innerHTML =  mediaName;
          field.appendChild( option );
          if( popcornOptions.target === "Media Element" ) {
            field.value = "Media Element";
          }
          col2.appendChild( field );

          field.addEventListener( "change", function( e ){
            sendData( false );
          }, false );
        } else {
          field = document.createElement( elem );
          field.id = item;
          field.style.width = "100%";
          field.placeholder = "Empty";

          // If this is an input textbox, add focus+select behaviour
          if( field.type === "text" ){
            __TextboxWrapper( field );
          }

          // Don't print "undefined" or the like
          var val = popcornOptions[ item ];
          if ( val || val === 0 ) {
            field.value = val;
          }

          col2.appendChild( field );
          field.addEventListener( "change", function( e ){
            sendData( false );
          }, false );
        }

        // Remember first control added in editor so we can focus
        elemToFocus = elemToFocus || field;

        row.appendChild( col1 );
        row.appendChild( col2 );
        document.getElementById( "table" ).appendChild( row );
      }

      // Focus the first element in the editor
      if ( elemToFocus && elemToFocus.focus ) {
        elemToFocus.focus();
      }
    });
  }, false );
})();
