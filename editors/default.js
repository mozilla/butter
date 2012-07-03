/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "text!./default.html", "text!layouts/trackevent-editor-defaults.html",
          "editor/editor", "util/lang" ],
  function( LAYOUT_SRC, DEFAULT_LAYOUT_SNIPPETS, Editor, LangUtils ) {

  var __defaultLayouts = LangUtils.domFragment( DEFAULT_LAYOUT_SNIPPETS );

  /**
   * Class: DefaultEditor
   *
   * Implements the default editor as a general fallback editor
   *
   * @param {DOMElement} rootElement: Root DOM element containing the fundamental editor content
   * @param {Butter} butter: An instance of Butter
   * @param {TrackEvent} TrackEvent: The TrackEvent to edit
   */
  Editor.register( "default", LAYOUT_SRC, function( rootElement, butter, trackEvent ) {

    var _this = this;

    var _butter = butter,
        _rootElement = rootElement,
        _targets = [ butter.currentMedia ].concat( butter.targets ),
        _messageContainer = _rootElement.querySelector( "div.error-message" );

    /**
     * Member: setErrorState
     *
     * Sets the error state of the editor, making an error message visible
     * 
     * @param {String} message: Error message to display
     */ 
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

    // Extend this object to become a BaseEditor
    Editor.BaseEditor( _this, butter, rootElement, {
      open: function ( parentElement, trackEvent ) {
        // Update properties when TrackEvent is updated
        trackEvent.listen( "trackeventupdated", function ( e ) {
          _this.updatePropertiesFromManifest( e.target );
          setErrorState( false );
        });
        _this.createPropertiesFromManifest( trackEvent );
      },
      close: function () {
      }
    });
    
    /**
     * Member: updateTrackEventWithTryCatch
     *
     * Attempt to update the properties of a TrackEvent; set the error state if a failure occurs.
     * 
     * @param {TrackEvent} trackEvent: TrackEvent to update
     * @param {Object} properties: TrackEvent properties to update
     */ 
    function updateTrackEventWithTryCatch ( trackEvent, properties ) {
      try {
        trackEvent.update( properties );
      }
      catch ( e ) {
        setErrorState( e.toString() );
      }
    }

    /**
     * Member: createTargetsList
     *
     * Creates the target list and attaches the handlers for target change events
     * 
     * @param {TrackEvent} trackEvent: TrackEvent to which change handlers are attached (for calling update consequently)
     */
    function createTargetsList ( trackEvent ) {
      var propertyRootElement = __defaultLayouts.querySelector( ".trackevent-property.targets" ).cloneNode( true ),
          selectElement = propertyRootElement.querySelector( "select" ),
          mediaOptionElement = selectElement.firstChild,
          optionElement;

      // Create one <option> per target
      for ( var i=1; i<_targets.length; ++i ) {
        optionElement = document.createElement( "option" );
        optionElement.value = _targets[ i ].element.id;
        optionElement.innerHTML = _targets[ i ].element.id;

        // Place them before the first <option>, which is assumed to be the Media Element target
        selectElement.insertBefore( optionElement, mediaOptionElement );
      }

      // Attach the onchange handler to trackEvent is updated when <select> is changed
      attachSelectChangeHandler( selectElement, trackEvent, "target" );

      return propertyRootElement;
    }

    /**
     * Member: attachSelectChangeHandler
     *
     * Attaches a handler to the change event from a <select> element and updates the TrackEvent corresponding to the given property name
     * 
     * @param {DOMElement} element: Element to which handler is attached
     * @param {TrackEvent} trackEvent: TrackEvent to update
     * @param {String} propertyName: Name of property to update when change is detected
     */
    function attachSelectChangeHandler ( element, trackEvent, propertyName ) {
      element.addEventListener( "change", function( e ) {
        var updateOptions = {};
        updateOptions[ propertyName ] = element.value;
        trackEvent.update( updateOptions );

        // Attempt to make the trackEvent's target blink
        var target = _butter.getTargetByType( "elementID", trackEvent.popcornOptions.target );
        if( target ) {
          target.view.blink();
        }
        else {
          _butter.currentMedia.view.blink();
        }
      }, false );
    }

    /**
     * Member: attachStartEndHandler
     *
     * Attaches handlers to an element (likely an <input>) and updates the TrackEvent corresponding to the given property name.
     * Special consideration is given to properties like "start" and "end" that can't be blank. On keyup event, update only when
     * appropriate.
     * 
     * @param {DOMElement} element: Element to which handler is attached
     * @param {TrackEvent} trackEvent: TrackEvent to update
     * @param {String} propertyName: Name of property to update when change is detected
     */
     function attachStartEndHandler( element, trackEvent, propertyName ) {
      element.addEventListener( "blur", function( e ) {
        var updateOptions = {};
        updateOptions[ propertyName ] = element.value;
        updateTrackEventWithTryCatch( trackEvent, updateOptions );
      }, false );
      element.addEventListener( "keyup", function( e ) {
        // Check if value is only whitespace, and don't bother updating if it is
        var value = element.value.replace( /\s/g, "" );
        if ( value && value.length > 0 ) {
          var updateOptions = {};
          updateOptions[ propertyName ] = value;
          updateTrackEventWithTryCatch( trackEvent, updateOptions );
        }
      }, false );
    }

    /**
     * Member: attachCheckboxChangeHandler
     *
     * Attaches handlers to a checkbox element and updates the TrackEvent corresponding to the given property name
     * 
     * @param {DOMElement} element: Element to which handler is attached
     * @param {TrackEvent} trackEvent: TrackEvent to update
     * @param {String} propertyName: Name of property to update when change is detected
     */
    function attachCheckboxChangeHandler ( element, trackEvent, propertyName ) {
      element.addEventListener( "click", function( e ) {
        var updateOptions = {};
        updateOptions[ propertyName ] = element.checked;
        trackEvent.update( updateOptions );
      }, false );
    }

    /**
     * Member: attachInputChangeHandler
     *
     * Attaches handlers to a checkbox element and updates the TrackEvent corresponding to the given property name
     * 
     * @param {DOMElement} element: Element to which handler is attached
     * @param {TrackEvent} trackEvent: TrackEvent to update
     * @param {String} propertyName: Name of property to update when change is detected
     */
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

    /**
     * Member: createManifestItem
     *
     * Creates an element according to the manifest of the TrackEvent
     * 
     * @param {String} name: Name of the manifest item to represent
     * @param {Object} manifestEntry: The manifest entry from a Popcorn plugin
     * @param {*} data: Initial data to insert in the created element
     * @param {TrackEvent} trackEvent: TrackEvent to which handlers will be attached 
     */
    function createManifestItem ( name, manifestEntry, data, trackEvent ) {
      var elem = manifestEntry.elem || "default",
          propertyArchetype = __defaultLayouts.querySelector( ".trackevent-property." + elem ).cloneNode( true ),
          input,
          select,
          itemLabel = manifestEntry.label || name;

      // Treat 'in' and 'out' specially, changing their titles to 'Start' and 'End' respectively
      if ( itemLabel === "In" ) {
        itemLabel = "Start (seconds)";
      } else if ( itemLabel === "Out" ) {
        itemLabel = "End (seconds)";
      }

      // Grab the element with class 'property-name' to supply the archetype for new manifest entries
      propertyArchetype.querySelector( ".property-name" ).innerHTML = itemLabel;

      // If the manifest's 'elem' property is 'select', create a <select> element. Otherwise, create an 
      // <input>.
      if ( manifestEntry.elem === "select" ) {
        select = propertyArchetype.querySelector( "select" );

        // data-manifest-key is used to update this property later on
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

        // data-manifest-key is used to update this property later on
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

    /**
     * Member: createPropertiesFromManifest
     *
     * Creates editable elements according to the properties on the manifest of the given TrackEvent
     * 
     * @param {TrackEvent} trackEvent: TrackEvent from which manifest will be retrieved
     */
    this.createPropertiesFromManifest = function ( trackEvent ) {
      var targetList = createTargetsList( trackEvent );

      if ( !trackEvent.manifest ) {
        throw "Unable to create properties from null manifest. Perhaps trackevent is not initialized properly yet.";
      }

      var manifestOptions = trackEvent.manifest.options;
      for ( var item in manifestOptions ) {
        if( manifestOptions.hasOwnProperty( item ) ) {
          _rootElement.appendChild( createManifestItem( item, manifestOptions[ item ], trackEvent.popcornOptions[ item ], trackEvent ) );
        }
      }

      _rootElement.appendChild( targetList );

      _this.updatePropertiesFromManifest( trackEvent );
    };

    /**
     * Member: updatePropertiesFromManifest
     *
     * Updates TrackEvent properties visible in the editor with respect to the TrackEvent's manifest
     *
     * @param {TrackEvent} trackEvent: TrackEvent which supplies the manifest and property updates
     */
    this.updatePropertiesFromManifest = function ( trackEvent ) {
      var element,
          popcornOptions = trackEvent.popcornOptions,
          manifestOptions = trackEvent.manifest.options;

      for ( var option in manifestOptions ) {
        if ( manifestOptions.hasOwnProperty( option ) ) {

          // Look for the element with the correct manifest-key which was attached to an element during creation of the editor
          element = _rootElement.querySelector( "[data-manifest-key='" + option + "']" );

          // Checkbox elements need to be treated specially to manipulate the 'checked' property
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
