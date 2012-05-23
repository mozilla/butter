/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function(){
  var _comm = new Comm(),
      _manifest = {};

  document.addEventListener( "DOMContentLoaded", function( e ){

    function sendData( alsoClose, options ){
      alsoClose = !!alsoClose;
      var popcornOptions = {};
      for( var item in _manifest ) {
        if ( options && options[ item ] ) {
           popcornOptions[ item ] = options[ item ];
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
      var item, element, dropTarget;
      for( item in _manifest ){
        element = document.getElementById( item );
        if ( element ) { element.value = e.data[ item ]; }
        if( item === "src" ) {
          dropTarget = document.getElementById( "drop-target" );
          if(  e.data[ item ] ) { dropTarget.style.backgroundImage = "url('" + e.data[ item ] + "')"; }     
        }

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
        if( itemLabel === "In" ){
          itemLabel = "Start (seconds)";
        }
        else if( itemLabel === "Out" ){
          itemLabel = "End (seconds)";
        } //if

        col1.innerHTML = "<span>" + itemLabel + "</span>";

        //Target
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
        }
        //Source
        else if ( item === "src" ) {
          field = document.createElement( elem );
          field.id = item;
          col2.appendChild( field );

          var canvas = document.createElement( "canvas" ),
              context,
              dropTarget;

          canvas.id = "grabimage";
          canvas.style.display = "none";
          col2.appendChild( canvas );

          dropTarget = document.createElement( "div" );
          dropTarget.id = "drop-target";
          dropTarget.innerHTML = "<span>Drag an image from your desktop...</span";
          if(  popcornOptions[ item ] ) { dropTarget.style.backgroundImage = "url('" + popcornOptions[ item ] + "')"; }  

          document.getElementById( "table" ).parentNode.insertBefore( dropTarget, document.getElementById( "table" ) );

          dropTarget.addEventListener( "dragover", function( event ) {
            event.preventDefault();
            dropTarget.className = "dragover";
          }, false);

          dropTarget.addEventListener( "dragleave", function( event ) {
            event.preventDefault();
            dropTarget.className = "";
          }, false);

          dropTarget.addEventListener( 'drop', function( event ) {
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

            image = document.createElement( 'img' );
            image.onload = function () {
                canvas.width = this.width;
                canvas.height = this.height;
                context = canvas.getContext( '2d' );
                context.drawImage( this, 0, 0, this.width, this.height );
                imgURI = canvas.toDataURL();
                sendData( false, {"src" : imgURI } );
                dropTarget.style.backgroundImage = "url('" +  imgURI + "')";
                dropTarget.firstChild.innerHTML = file.name || file.fileName;
            };
            image.src = imgSrc;
        
          }, false);

          field.addEventListener( "change", function( e ){
            console.log ( field.value );
            if( field.value ) {
              console.log( field.value );
              dropTarget.style.backgroundImage = "url('" + field.value + "')";
              sendData( false, field.value );
            }
          }, false );

        }
        else {
          field = document.createElement( elem );
          field.id = item;
          field.style.width = "100%";
          field.placeholder = "Empty";

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