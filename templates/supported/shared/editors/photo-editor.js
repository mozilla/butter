(function(){
  var _comm = new Comm(),
      _manifest = {},
      dataURI,
      DROP_AREA_TEXT = "<span>Drag an image from your desktop...</span>";

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

    function sendData( alsoClose, options ){
      alsoClose = !!alsoClose;
      var popcornOptions = {};
      for ( var item in _manifest ) {
        if ( options && options[ item ] ) {
           popcornOptions[ item ] = options[ item ];
        } else if ( item === "src" ) {
          var source = document.getElementById( item ).value;
          if ( /^data:image/.test( source ) ) {
            popcornOptions[ item ] = dataURI;
          } else {
            popcornOptions[ item ] = source;
          }
        } else if ( document.getElementById( item ) ) {
          popcornOptions[ item ] = document.getElementById( item ).value;
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
      if ( e.keyCode === 13 ) {
        okPressed( e );
      } else if ( e.keyCode === 27 ) {
        cancelPressed( e );
      }
    }, false);

    _comm.listen( "close", function( e ){
      // use this to process something right before the editor closes
    });

    _comm.listen( "trackeventupdated", function( e ){

      for ( var item in _manifest ){
        if ( _manifest.hasOwnProperty( item ) ) {
          var element = document.getElementById( item ),
              data = e.data[ item ];

          if ( item === "src" ) {
            var dropTarget = document.getElementById( "drop-target" );
            if ( /^data:image/.test( data ) ) {
              // Store the data URI so we can still keep it correct for the popcornOptions
              dataURI = data;
              // Only display data/image if the source is a dataURI as anything longer is confusing
              // And chrome can't handle really long data URIs in textfields
              element.value = data.substring( 0, 10 );
              // Set the src of the drop box in the editor to the dataURI
              dropTarget.innerHTML = "";
              dropTarget.style.backgroundImage = "url('" + data + "')";
            } else {
              element.value = data;

              dropTarget.innerHTML = DROP_AREA_TEXT;
              dropTarget.style.backgroundImage = "";
            }
          } else {
            element.value = data;
          }
        }
      } //for
    });

    _comm.listen( "trackeventupdatefailed", function( e ) {
      if ( e.data === "invalidtime" ){
        document.getElementById( "message" ).innerHTML = "You've entered an invalid start or end time. Please verify that they are both greater than 0, the end time is equal to or less than the media's duration, and that the start time is less than the end time.";
      } //if
    });

    _comm.listen( "trackeventdata", function( e ){
      var popcornOptions = e.data.popcornOptions,
          targets = e.data.targets,
          masterTarget = "video-overlay", //hard-coded for this template
          media = e.data.media,
          table = document.getElementById( "table" ),
          sourceEditor = document.getElementById( "source-editor" ),
          mediaName = "Current Media Element",
          elemToFocus,
          createElement = {
            defaultValue: function( item, val ) {
              // Don't print "undefined" or the like
              if ( val === undefined || typeof val === "object" ) {
                if ( item.default ) {
                  val = item.default;
                } else {
                  val = item.type === "number" ? 0 : "";
                }
              }
              return val;
            },
            input: function( manifest, manifestProp ) {
              var manifestItem = manifest[ manifestProp ],
                  elem = document.createElement( manifestItem.elem ),
                  type = manifestItem.type,
                  val;
              elem.type = type;
              elem.id = manifestProp;
              elem.style.width = "100%";
              elem.placeholder = "Empty";

              elem.value = elem.checked = this.defaultValue( manifestItem, popcornOptions[ manifestProp ] );
              return elem;
            },
            select: function( manifest, manifestProp, items ) {
              var manifestItem = manifest[ manifestProp ],
                  elem = document.createElement( "SELECT" ),
                  items = items || manifestItem.options,
                  option;

              elem.id = manifestProp;

              for ( var i = 0, l = items.length; i < l; i++ ) {
                option = document.createElement( "OPTION" );
                option.value = items[ i ];
                option.innerHTML = items[ i ];
                elem.appendChild( option );
              }
              if ( manifestProp === "target" ) {
                option = document.createElement( "OPTION" );
                option.value = "Media Element";
                option.innerHTML =  mediaName;
                elem.appendChild( option );
              }
              elem.value = this.defaultValue( manifestItem, popcornOptions[ manifestProp ] );
              if ( manifestProp === "target" ) {
                elem.value = masterTarget;
              }
              return elem;
            }
          };

      dataURI = popcornOptions.src;

      if ( media && media.name && media.target ) {
        mediaName += " (\"" + media.name + "\": " + media.target + ")";
      }

      _manifest = e.data.manifest.options;

      function createRow( item, data ) {
        var row = document.createElement( "div" ),
            col1 = document.createElement( "label" ),
            col2 = document.createElement( "div" ),
            currentItem = _manifest[ item ],
            itemLabel = currentItem.label || item,
            field;

        if ( itemLabel === "In" ) {
          itemLabel = "Start (seconds)";
        } else if ( itemLabel === "Out" ) {
          itemLabel = "End (seconds)";
        }

        col1.innerHTML = "<span>" + itemLabel + "</span>";

        field = createElement[ currentItem.elem ]( _manifest, item, data );

        col2.appendChild( field );
        field.addEventListener( "change", function( e ) {
          sendData( false, { elem : field.value } );
        }, false );

        // Remember first control added in editor so we can focus
        elemToFocus = elemToFocus || field;

        row.appendChild( col1 );
        row.appendChild( col2 );
        row.classList.add( item + "-container" );

        if( item === "src" ) {
          row.id = "src-container";
          table.appendChild( row );
          createImageDropper( item );
        } else if ( item == "useURL") {
          table.appendChild( row );
        } else {
          table.appendChild( row );
        }

        return field;
      }

      function createImageDropper( item ){
        var canvas = document.createElement( "canvas" ),
            context,
            dropTarget,
            result;

        result = /^data:image/.test( popcornOptions[ item ] );

        dropTarget = document.createElement( "div" );
        dropTarget.id = "drop-target";
        dropTarget.innerHTML = result ? "" : DROP_AREA_TEXT;

        if(  popcornOptions[ item ] && result ) {
          dropTarget.style.backgroundImage = "url('" + popcornOptions[ item ] + "')";
        }

        sourceEditor.appendChild( dropTarget );

        dropTarget.addEventListener( "dragover", function( event ) {
          event.preventDefault();
          dropTarget.className = "dragover";
        }, false);

        dropTarget.addEventListener( "dragleave", function( event ) {
          event.preventDefault();
          dropTarget.className = "";
        }, false);

        dropTarget.addEventListener( "drop", function( event ) {
          dropTarget.className = "dropped";
          event.preventDefault();
          var file = event.dataTransfer.files[ 0 ],
              imgSrc,
              image,
              imgURI;

          if( window.URL ) {
            imgSrc = window.URL.createObjectURL( file );
          } else if ( window.webkitURL ) {
            imgSrc = window.webkitURL.createObjectURL( file );
          }

          image = document.createElement( "img" );
          image.onload = function () {
            canvas.width = this.width;
            canvas.height = this.height;
            context = canvas.getContext( "2d" );
            context.drawImage( this, 0, 0, this.width, this.height );
            imgURI = canvas.toDataURL();

            sendData( false, { "src": imgURI } );
            dropTarget.style.backgroundImage = "url('" +  imgURI + "')";
            dropTarget.firstChild.innerHTML = "";
          };
          image.src = imgSrc;

        }, false);
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

      // Focus the first element in the editor
      if ( elemToFocus && elemToFocus.focus ) {
        elemToFocus.focus();
      }
      sendData( false );
    });
  }, false );
})();
