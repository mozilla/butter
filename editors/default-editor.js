(function(){
  var _comm = new window.Comm(),
      _manifest = {};

  /*
   *TODO: this should be something we reuse from src/ui/widget/textbox.js
   * with require.  We need to expose butter internals to editors.
   * https://webmademovies.lighthouseapp.com/projects/65733/tickets/1174
   */

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

    if( !( input && ( input.type === "text" || input.type === "number" || input.type === "url" ) ) ){
      throw "Expected an input element of type text, number or url";
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
        if( _manifest.hasOwnProperty( item ) ) {
          var elem = document.getElementById( "manifest-" + item );
          popcornOptions[ item ] = elem.type === "checkbox" ? elem.checked : elem.value;
        }
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
        if( _manifest.hasOwnProperty( item ) ) {
          var element = document.getElementById( "manifest-" + item );
          element.value = e.data[ item ];
        }
      } //for
    });

    _comm.listen( "trackeventupdatefailed", function( e ) {
      if( e.data === "invalidtime" ){
        document.getElementById( "message" ).innerHTML = "<div class=\"butter-error\">You've entered an invalid start or end time. Please verify that they are both greater than 0, the end time is equal to or less than the media's duration, and that the start time is less than the end time.</div>";
      } //if
    });

    _comm.listen( "trackeventdata", function( e ){
      var popcornOptions = e.data.popcornOptions,
          targets = e.data.targets,
          media = e.data.media,
          form = document.getElementById( "form" ),
          mediaName = "Current Media Element",
          elemToFocus,
          createElement = {
            emptyValue: function( item, val ) {
              // Don't print "undefined" or the like
              if ( val === undefined || typeof val === "object" ) {
                val = item.type === "number" ? 0 : "";
              }
              return val;
            },
            input: function( manifest, manifestProp ) {
              var manifestItem = manifest[ manifestProp ],
                  elem = document.createElement( manifestItem.elem ),
                  type = manifestItem.type;

              elem.type = type;
              elem.id = "manifest-" + manifestProp;
              elem.placeholder = "Empty";

              if( type === "text" || type === "number" || type === "url" ) {
                __TextboxWrapper( elem );
              }

              elem.value = elem.checked = this.emptyValue( manifestItem, popcornOptions[ manifestProp ] );
              return elem;
            },
            select: function( manifest, manifestProp, items ) {
              var manifestItem = manifest[ manifestProp ],
                  elem = document.createElement( "SELECT" ),
                  option;

              items = items || manifestItem.options;

              elem.id = "manifest-" + manifestProp;

              for ( var i = 0, l = items.length; i < l; i++ ) {
                option = document.createElement( "OPTION" );
                option.value = items[ i ];
                option.innerHTML = items[ i ];
                elem.appendChild( option );
              }
              if ( manifestProp === "target" ) {
                option = document.createElement( "OPTION" );
                option.value = media.target;
                option.innerHTML =  mediaName;
                elem.appendChild( option );
              }
              elem.value = this.emptyValue( manifestItem, popcornOptions[ manifestProp ] );
              return elem;
            }
          };

      if ( media && media.name && media.target ) {
        mediaName += " (\"" + media.name + "\": " + media.target + ")";
      }

      _manifest = e.data.manifest.options;

      function createRow( item, data ) {
        var row = document.createElement( "div" ),
            rowClassPrefix = "fieldset-",
            col1 = document.createElement( "label" ),
            col2 = document.createElement( "div" ),
            currentItem = _manifest[ item ],
            itemLabel = currentItem.label || item,
            unitLabel,
            field;

        // Add units, they exist in the manifest
        if ( item === "start" ||  item === "end" ) {
          currentItem.units = "seconds";
        }
        if ( currentItem.units ) {
          unitLabel = document.createElement( "span" );
          unitLabel.classList.add( "butter-unit" );
          unitLabel.innerHTML = currentItem.units;
        }

        col1.innerHTML = "<span>" + itemLabel + "</span>";

        field = createElement[ currentItem.elem ]( _manifest, item, data );

        col2.appendChild( field );
        field.addEventListener( "change", function( e ){
          sendData( false );
        }, false );

        // Remember first control added in editor so we can focus
        elemToFocus = elemToFocus || field;

        //Add classes for style selecting
        row.classList.add( rowClassPrefix + item );

        //Add unit label if it exists
        if( unitLabel ) {
          col2.classList.add( "butter-form-append" );
          col2.appendChild( unitLabel );
        }

        //Hide if the manifest says so
        if( currentItem.hidden === true ) {
          row.style.display = "none";
        }

        row.appendChild( col1 );
        row.appendChild( col2 );
        form.appendChild( row );
      }

      _manifest.target = {
        elem: "select",
        label: "Target"
      };

      for ( var item in _manifest ) {
        if ( item === "target" ) {
          createRow( item, targets );
        } else {
          createRow( item );
        }
      }

      //Add the title info
      document.getElementById( "title" ).innerHTML = "<h3>" + e.data.manifest.about.name + "</h3>";

      // Focus the first element in the editor
      if ( elemToFocus && elemToFocus.focus ) {
        elemToFocus.focus();
      }
      sendData( false );
    });
  }, false );
}());
