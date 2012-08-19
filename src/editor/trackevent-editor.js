/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "util/lang", "util/keys", "./base-editor",
          "text!layouts/trackevent-editor-defaults.html",
          "util/scrollbars" ],
  function( LangUtils, KeysUtils, BaseEditor,
            DEFAULT_LAYOUT_SNIPPETS,
            Scrollbars ) {

  var __defaultLayouts = LangUtils.domFragment( DEFAULT_LAYOUT_SNIPPETS ),
      __safeKeyUpKeys = [
                          KeysUtils.LEFT,
                          KeysUtils.UP,
                          KeysUtils.RIGHT,
                          KeysUtils.DOWN,
                          KeysUtils.DELETE,
                          KeysUtils.TAB,
                          KeysUtils.ESCAPE
                        ],
      __googleFonts = [
                        "Gentium Book Basic",
                        "Lato",
                        "Vollkorn",
                        "Merriweather",
                        "Gravitas One",
                        "PT Sans",
                        "Open Sans",
                        "Bangers",
                        "Fredoka One",
                        "Covered By Your Grace"
                      ];

  /**
   * Class: TrackEventEditor
   *
   * Extends a given object to be a TrackEvent editor, giving it capabilities to work with TrackEvents
   *
   * @param {Object} extendObject: Object to be extended to become a TrackEvent editor
   * @param {Butter} butter: An instance of Butter
   * @param {DOMElement} rootElement: The root element to which the editor's content will be attached
   * @param {Object} events: Events such as 'open' and 'close' can be defined on this object to be called at the appropriate times
   */
  return function( extendObject, butter, rootElement, events ) {
    // Wedge a check for scrollbars into the open event if it exists
    var oldOpenEvent = events.open;

    events.open = function( trackEvent ) {
      var basicButton = rootElement.querySelector( ".basic-tab" ),
          advancedButton = rootElement.querySelector( ".advanced-tab" ),
          basicTab = rootElement.querySelector( ".editor-options" ),
          advancedTab = rootElement.querySelector( ".advanced-options" ),
          wrapper = rootElement.querySelector( ".scrollbar-outer" );

      if ( oldOpenEvent ) {
        oldOpenEvent.apply( this, arguments );

        // Code for handling basic/advanced options tabs are going to be the same. If the user defined these buttons
        // handle it for them here rather than force them to write the code in their editor
        if ( basicButton && advancedButton ) {
          basicButton.addEventListener( "mouseup", function( e ) {
            if ( basicTab.classList.contains( "display-off" ) ) {
              basicTab.classList.toggle( "display-off" );
              advancedTab.classList.toggle( "display-off" );
              basicButton.classList.add( "butter-active" );
              advancedButton.classList.remove( "butter-active" );
              extendObject.scrollbar.update();
            }
          });

          advancedButton.addEventListener( "mouseup", function( e ) {
            if ( !basicTab.classList.contains( "display-off" ) ) {
              basicTab.classList.toggle( "display-off" );
              advancedTab.classList.toggle( "display-off" );
              basicButton.classList.remove( "butter-active" );
              advancedButton.classList.add( "butter-active" );
              extendObject.scrollbar.update();
            }
          });

          // Override default scrollbar to account for both tab containers
          extendObject.addScrollbar({
            inner: wrapper,
            outer: wrapper,
            appendTo: rootElement.querySelector( ".scrollbar-append-to" )
          });
        }
      }

      if ( extendObject.scrollbar ) {
        extendObject.scrollbar.update();
      }
    };

    BaseEditor( extendObject, butter, rootElement, events );

    extendObject.defaultLayouts = __defaultLayouts.cloneNode( true );

    extendObject.createBreadcrumbs = function( trackEvent ) {
      var oldTitleEl = rootElement.querySelector( "h1" ),
          breadcrumbsLayout = extendObject.defaultLayouts.querySelector( ".butter-breadcrumbs" ),
          backLink = breadcrumbsLayout.querySelector( ".butter-breadcrumbs-back" ),
          editorTitle =  breadcrumbsLayout.querySelector( ".butter-editor-title" ),
          closeEditorLink =  breadcrumbsLayout.querySelector( ".close-btn" );

      if ( !trackEvent ) {
        return;
      }

      closeEditorLink.addEventListener( "click", function( e ) {
        extendObject.dispatch( "back" );
      }, false );

      backLink.addEventListener( "click", function( e ) {
        extendObject.dispatch( "back" );
      }, false );

      if ( trackEvent.type ) {
        editorTitle.innerHTML = "";
        editorTitle.appendChild( document.createTextNode( trackEvent.type ) );
      }

      oldTitleEl.parentNode.replaceChild( breadcrumbsLayout, oldTitleEl );
    };

    /**
     * Member: createTargetsList
     *
     * Creates a list of targets in a <select>, including one specifically for "Media Element"
     */
    extendObject.createTargetsList = function( targets ) {
      var propertyRootElement = __defaultLayouts.querySelector( ".trackevent-property.targets" ).cloneNode( true ),
          selectElement = propertyRootElement.querySelector( "select" ),
          mediaOptionElement = selectElement.firstChild,
          optionElement;

      // Create one <option> per target
      for ( var i = 1; i < targets.length; ++i ) {
        optionElement = document.createElement( "option" );
        optionElement.value = targets[ i ].element.id;
        optionElement.innerHTML = targets[ i ].element.id;

        // If the default target <option> (for Media Element) exists, place them before it
        if ( mediaOptionElement ) {
          selectElement.insertBefore( optionElement, mediaOptionElement );
        }
        else {
          selectElement.appendChild( optionElement );
        }
      }

      return propertyRootElement;
    };

    /**
     * Member: attachSelectChangeHandler
     *
     * Attaches a handler to the change event from a <select> element and updates the TrackEvent corresponding to the given property name
     *
     * @param {DOMElement} element: Element to which handler is attached
     * @param {TrackEvent} trackEvent: TrackEvent to update
     * @param {String} propertyName: Name of property to update when change is detected
     */
    extendObject.attachSelectChangeHandler = function( element, trackEvent, propertyName ) {
      element.addEventListener( "change", function( e ) {
        var updateOptions = {};
        updateOptions[ propertyName ] = element.value;
        trackEvent.update( updateOptions );

        // Attempt to make the trackEvent's target blink
        var target = extendObject.butter.getTargetByType( "elementID", trackEvent.popcornOptions.target );
        if( target ) {
          target.view.blink();
        }
        else {
          extendObject.butter.currentMedia.view.blink();
        }
      }, false );
    };

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
     * @param {Function} callback: Called when update is ready to occur
     */
     extendObject.attachStartEndHandler = function( element, trackEvent, propertyName, callback ) {
      element.addEventListener( "blur", function( e ) {
        var updateOptions = {};
        updateOptions[ propertyName ] = element.value;
        callback( trackEvent, updateOptions );
      }, false );

      element.addEventListener( "keyup", function( e ) {
        if ( __safeKeyUpKeys.indexOf( e.which ) > -1 ) {
          return;
        }
        // Check if value is only whitespace, and don't bother updating if it is
        var value = element.value.replace( /\s/g, "" );
        if ( value && value.length > 0 ) {
          var updateOptions = {};
          updateOptions[ propertyName ] = value;

          // Perhaps the user isn't finished typing something that includes decimals
          if ( value.charAt( value.length - 1 ) !== "." ) {
            callback( trackEvent, updateOptions );
          }
        }
      }, false );

      element.addEventListener( "change", function( e ) {
        var updateOptions = {};
        updateOptions[ propertyName ] = element.value;
        trackEvent.update( updateOptions );
      }, false );
    };

    /**
     * Member: attachCheckboxChangeHandler
     *
     * Attaches handlers to a checkbox element and updates the TrackEvent corresponding to the given property name
     *
     * @param {DOMElement} element: Element to which handler is attached
     * @param {TrackEvent} trackEvent: TrackEvent to update
     * @param {String} propertyName: Name of property to update when change is detected
     */
    extendObject.attachCheckboxChangeHandler = function( element, trackEvent, propertyName ) {
      element.addEventListener( "click", function( e ) {
        var updateOptions = {};
        updateOptions[ propertyName ] = element.checked;
        trackEvent.update( updateOptions );
      }, false );
    };

    /**
     * Member: attachInputChangeHandler
     *
     * Attaches handlers to a checkbox element and updates the TrackEvent corresponding to the given property name
     *
     * @param {DOMElement} element: Element to which handler is attached
     * @param {TrackEvent} trackEvent: TrackEvent to update
     * @param {String} propertyName: Name of property to update when change is detected
     * @param {Function} callback: OPTIONAL - Called when update is ready to occur
     */
     extendObject.attachInputChangeHandler = function( element, trackEvent, propertyName, callback ) {
      element.addEventListener( "blur", function( e ) {
        var updateOptions = {};
        updateOptions[ propertyName ] = element.value;
        if ( callback ) {
          callback( trackEvent, updateOptions );
        } else {
          trackEvent.update( updateOptions );
        }
      }, false );

      if ( element.type === "number" ) {
        element.addEventListener( "change", function( e ) {
          var updateOptions = {};
          updateOptions[ propertyName ] = element.value;
          if ( callback ) {
            callback( trackEvent, updateOptions );
          } else {
            trackEvent.update( updateOptions );
          }
        }, false );
      }
    };

    /**
     * Member: createManifestItem
     *
     * Creates an element according to the manifest of the TrackEvent
     *
     * @param {String} name: Name of the manifest item to represent
     * @param {Object} manifestEntry: The manifest entry from a Popcorn plugin
     * @param {*} data: Initial data to insert in the created element
     * @param {TrackEvent} trackEvent: TrackEvent to which handlers will be attached
     * @param {Function} itemCallback: Optional. Called for each item, for the user to add functionality after creation
     */
    extendObject.createManifestItem = function( name, manifestEntry, data, trackEvent, itemCallback ) {
      var elem = manifestEntry.elem || "default",
          itemLabel = manifestEntry.label || name,
          isStartOrEnd = [ "start", "end" ].indexOf( name.toLowerCase() ) > -1,
          units = manifestEntry.units || ( isStartOrEnd ? "seconds" : "" ),
          propertyArchetypeSelector,
          propertyArchetype,
          editorElement,
          option,
          manifestEntryOption,
          i, l;

      // Get the right property archetype
      propertyArchetypeSelector = ".trackevent-property." + elem;
      if ( units ) {
        propertyArchetypeSelector += ".units";
      }
      if ( manifestEntry.type === "checkbox" ) {
        propertyArchetypeSelector += ".checkbox";
      }
      if ( manifestEntry.type === "radio" ) {
        propertyArchetypeSelector += ".radio";
      }

      propertyArchetype = __defaultLayouts.querySelector( propertyArchetypeSelector ).cloneNode( true );

      // If the manifestEntry was specified to be hidden, or part of an advanced set of options don't use traditional
      // element building
      if ( manifestEntry.hidden ) {
        return;
      }

      // only populate if this is an input element that has associated units
      if ( units ) {
        propertyArchetype.querySelector( ".butter-unit" ).innerHTML = units;
      }

      // Grab the element with class 'property-name' to supply the archetype for new manifest entries
      if ( propertyArchetype.querySelector( ".property-name" ) ) {
        propertyArchetype.querySelector( ".property-name" ).innerHTML = itemLabel;
      }

      // If the manifest's 'elem' property is 'select', create a <select> element. Otherwise, create an
      // <input>.
      if ( manifestEntry.elem === "select" ) {
        editorElement = propertyArchetype.querySelector( "select" );

        // data-manifest-key is used to update this property later on
        editorElement.setAttribute( "data-manifest-key", name );

        if ( manifestEntry.options ) {
          for ( i = 0, l = manifestEntry.options.length; i < l; ++i ){
            option = document.createElement( "option" );
            manifestEntryOption = manifestEntry.options[ i ];

            // if the manifest has values for options, use the options as labels
            // and the values as values for the <option> elements
            if ( manifestEntry.values && manifestEntry.values[ i ] ) {
              option.innerHTML = manifestEntryOption;
              option.value = manifestEntry.values[ i ];
            }
            else {
              option.value = option.innerHTML = manifestEntryOption;
            }

            editorElement.appendChild( option );
          }
        }
        else if ( manifestEntry.googleFonts && __googleFonts ) {
          var font,
              m,
              fLen;

          for ( m = 0, fLen = __googleFonts.length; m < fLen; m++ ) {
            font = document.createElement( "option" );

            font.value = font.label = __googleFonts[ m ];
            editorElement.appendChild( font );
          }
        }
      }
      else {
        editorElement = propertyArchetype.querySelector( "input" );
        if ( data ) {
          // Don't print "undefined" or the like
          if ( data === undefined || typeof data === "object" ) {
            data = manifestEntry.type === "number" ? 0 : "";
          }
          editorElement.placeholder = editorElement.value = data;
        }
        try {
          editorElement.type = manifestEntry.type;
        }
        catch ( e ) {
          // Suppress IE9 errors
        }
        // data-manifest-key is used to update this property later on
        editorElement.setAttribute( "data-manifest-key", name );

      }

      if ( itemCallback ) {
        itemCallback( manifestEntry.elem, editorElement, trackEvent, name );
      }

      return propertyArchetype;
    };

    /**
     * Member: updatePropertiesFromManifest
     *
     * Updates TrackEvent properties visible in the editor with respect to the TrackEvent's manifest
     *
     * @param {TrackEvent} trackEvent: TrackEvent which supplies the manifest and property updates
     */
    extendObject.updatePropertiesFromManifest = function ( trackEvent, manifestKeys, forceTarget ) {
      var element,
          popcornOptions = trackEvent.popcornOptions,
          manifestOptions = trackEvent.manifest.options,
          option,
          i, l;

      manifestKeys = manifestKeys || Object.keys( manifestOptions );

      if ( forceTarget && manifestKeys.indexOf( "target" ) === -1 ) {
        manifestKeys = manifestKeys.concat( "target" );
      }

      for ( i = 0, l = manifestKeys.length; i < l; ++i ) {
        option = manifestKeys[ i ];

        // Look for the element with the correct manifest-key which was attached to an element during creation of the editor
        element = extendObject.rootElement.querySelector( "[data-manifest-key='" + option + "']" );

        if ( element ) {
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



    /**
     * Member: createPropertiesFromManifest
     *
     * Creates editable elements according to the properties on the manifest of the given TrackEvent
     *
     * @param {TrackEvent} trackEvent: TrackEvent from which manifest will be retrieved
     * @param {Function} itemCallback: Callback which is passed to createManifestItem for each element created
     * @param {Array} manifestKeys: Optional. If only specific keys are desired from the manifest, use them
     * @param {DOMElement} container: Optional. If specified, elements will be inserted into container, not rootElement
     * @param {Array} ignoreManifestKeys: Optional. Keys in this array are ignored such that elements for them are not created
     */
    extendObject.createPropertiesFromManifest = function( trackEvent, callback, manifestKeys, basicContainer, advancedContainer, ignoreManifestKeys ) {
      var manifestOptions,
          item,
          element,
          container,
          optionGroup,
          i, l;

      basicContainer = basicContainer || extendObject.rootElement;
      advancedContainer = advancedContainer || extendObject.rootElement;

      if ( !trackEvent.manifest ) {
        throw "Unable to create properties from null manifest. Perhaps trackevent is not initialized properly yet.";
      }

      extendObject.createBreadcrumbs( trackEvent );

      manifestOptions = trackEvent.manifest.options;

      manifestKeys = manifestKeys || Object.keys( manifestOptions );

      for ( i = 0, l = manifestKeys.length; i < l; ++i ) {
        item = manifestKeys[ i ];
        optionGroup = manifestOptions[ item ].group ? manifestOptions[ item ].group : "basic";
        container = optionGroup === "advanced" ? advancedContainer : basicContainer;
        if ( ignoreManifestKeys && ignoreManifestKeys.indexOf( item ) > -1 ) {
          continue;
        }
        element = extendObject.createManifestItem( item, manifestOptions[ item ], trackEvent.popcornOptions[ item ], trackEvent, callback );

        if ( element ) {
          container.appendChild( element );
        }
      }
    };

  };

});
