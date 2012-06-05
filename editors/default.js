/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "text!./default.html", "text!layouts/trackevent-editor-defaults.html",
          "editor/editor", "util/lang" ],
  function( LAYOUT_SRC, DEFAULT_LAYOUT_SNIPPETS, Editor, LangUtils ) {

  var __defaultLayouts = LangUtils.domFragment( DEFAULT_LAYOUT_SNIPPETS );

  Editor.register( "default", LAYOUT_SRC, function( rootElement, butter, trackEvent ) {

    var _this = this;

    var _butter = butter,
        _rootElement = rootElement,
        _targets = [ butter.currentMedia ].concat( butter.targets ),
        _messageContainer = _rootElement.querySelector( "div.error-message" );

    function setErrorState ( message ) {
      if ( message ) {
        _messageContainer.innerHTML = message;
        _messageContainer.parentNode.style.height = _messageContainer.offsetHeight + "px";
        _messageContainer.parentNode.style.visibility = "visible";
        _messageContainer.parentNode.classList.add( "open" );
      }
      else {
        _messageContainer.innerHTML = "";
        _messageContainer.parentNode.style.height = "";
        _messageContainer.parentNode.style.visibility = "";
        _messageContainer.parentNode.classList.remove( "open" );
      }
    }

    Editor.BaseEditor( _this, butter, rootElement, {
      open: function ( parentElement, trackEvent ) {
        trackEvent.listen( "trackeventupdated", function ( e ) {
          _this.updatePropertiesFromManifest( e.target.popcornOptions );
          setErrorState( false );
        });
        _this.createPropertiesFromManifest( trackEvent );
      },
      close: function () {
      }
    });
    
    function updateTrackEventWithTryCatch ( trackEvent, properties ) {
      try {
        trackEvent.update( properties );
      }
      catch ( e ) {
        
        setErrorState( e.toString() );
      }
    }

    function createTargetsList ( trackEvent ) {
      var propertyRootElement = __defaultLayouts.querySelector( ".trackevent-property.targets" ).cloneNode( true ),
          selectElement = propertyRootElement.querySelector( "select" ),
          mediaOptionElement = selectElement.firstChild,
          optionElement;

      for ( var i=1; i<_targets.length; ++i ) {
        optionElement = document.createElement( "option" );
        optionElement.value = _targets[ i ].element.id;
        optionElement.innerHTML = _targets[ i ].element.id;
        selectElement.insertBefore( optionElement, mediaOptionElement );
      }

      attachSelectChangeHandler( selectElement, trackEvent, "target" );

      return propertyRootElement;
    }

    function attachSelectChangeHandler ( element, trackEvent, propertyName ) {
      element.addEventListener( "change", function( e ) {
        var updateOptions = {};
        updateOptions[ propertyName ] = element.value;
        trackEvent.update( updateOptions );
        var target = _butter.getTargetByType( "elementID", trackEvent.popcornOptions.target );
        if( target ) {
          target.view.blink();
        }
      }, false );
    }

    function attachStartEndHandler( element, trackEvent, propertyName ) {
      element.addEventListener( "blur", function( e ) {
        var updateOptions = {};
        updateOptions[ propertyName ] = element.value;
        updateTrackEventWithTryCatch( trackEvent, updateOptions );
      }, false );
      element.addEventListener( "keyup", function( e ) {
        var value = element.value.replace( /\s/g, "" );
        if ( value && value.length > 0 ) {
          var updateOptions = {};
          updateOptions[ propertyName ] = value;
          updateTrackEventWithTryCatch( trackEvent, updateOptions );
        }
      }, false );
    }

    function attachCheckboxChangeHandler ( element, trackEvent, propertyName ) {
      element.addEventListener( "click", function( e ) {
        var updateOptions = {};
        updateOptions[ propertyName ] = element.checked;
        trackEvent.update( updateOptions );
      }, false );
    }

    function attachInputChangeHandler ( element, trackEvent, propertyName ) {
      element.addEventListener( "blur", function( e ) {
        var updateOptions = {};
        updateOptions[ propertyName ] = element.value;
        trackEvent.update( updateOptions );
      }, false );
      element.addEventListener( "keyup", function( e ) {
        var updateOptions = {};
        updateOptions[ propertyName ] = element.value;
        trackEvent.update( updateOptions );
      }, false );
    }

    function createManifestItem ( name, manifestEntry, data, trackEvent ) {
      var elem = manifestEntry.elem || "default",
          propertyArchetype = __defaultLayouts.querySelector( ".trackevent-property." + elem ).cloneNode( true ),
          input,
          select,
          itemLabel = manifestEntry.label || name;

      if ( itemLabel === "In" ) {
        itemLabel = "Start (seconds)";
      } else if ( itemLabel === "Out" ) {
        itemLabel = "End (seconds)";
      }

      propertyArchetype.querySelector( ".property-name" ).innerHTML = itemLabel;
      if ( manifestEntry.elem === "select" ) {
        select = propertyArchetype.querySelector( "select" );
        select.setAttribute( "data-manifest-key", name );
        attachSelectChangeHandler( select, trackEvent, name );
      }
      else {
        input = propertyArchetype.querySelector( "input" );
        if ( data ) {
          // Don't print "undefined" or the like
          if ( data === undefined || typeof data === "object" ) {
            if ( manifestEntry.default ) {
              data = manifestEntry.default;
            } else {
              data = manifestEntry.type === "number" ? 0 : "";
            }
          }
          input.value = data;
        }
        input.type = manifestEntry.type;
        input.setAttribute( "data-manifest-key", name );
        if ( [ "start", "end" ].indexOf( name ) > -1 ) {
          attachStartEndHandler( input, trackEvent, name );
        }
        else {
          if ( input.type === "checkbox" ) {
            attachCheckboxChangeHandler( input, trackEvent, name );
          }
          else {
            attachInputChangeHandler( input, trackEvent, name );
          }
          
        }
      }

      return propertyArchetype;
    }

    this.createPropertiesFromManifest = function ( trackEvent ) {
      var targetList = createTargetsList( trackEvent );

      var manifestOptions = trackEvent.manifest.options;
      for ( var item in manifestOptions ) {
        if( manifestOptions.hasOwnProperty( item ) ) {
          _rootElement.appendChild( createManifestItem( item, manifestOptions[ item ], trackEvent.popcornOptions[ item ], trackEvent ) );
        }
      }

      _rootElement.appendChild( targetList );

      _this.updatePropertiesFromManifest( trackEvent.popcornOptions );
    };

    this.updatePropertiesFromManifest = function ( popcornOptions ) {
      var element;
      for ( var option in popcornOptions ) {
        if ( popcornOptions.hasOwnProperty( option ) ) {
          element = _rootElement.querySelector( "[data-manifest-key='" + option + "']" );

          if ( element.type === "checkbox" ) {
            element.checked = popcornOptions[ option ];
          }
          else {
            element.value = popcornOptions[ option ];
          }
        }
      }
    };

  });

});
