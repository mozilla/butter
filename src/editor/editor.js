/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

/**
 * Module: Editor
 */
define( [ "core/eventmanager", "util/lang", "util/xhr", "text!layouts/trackevent-editor-defaults.html" ],
        function( EventManagerWrapper, LangUtils, XHRUtils, DEFAULT_LAYOUT_SNIPPETS ) {

  var __editors = {},
      __defaultLayouts = LangUtils.domFragment( DEFAULT_LAYOUT_SNIPPETS ),
      __safeKeyUpKeys = [ 37, 38, 39, 40, 8, 27 ];

  /**
   * Namespace: Editor
   */
  var Editor = {

    /**
     * Class: BaseEditor
     *
     * Extends a given object to be a BaseEditor, giving it rudamentary editor capabilities
     *
     * @param {Object} extendObject: Object to be extended as a BaseEditor
     * @param {Butter} butter: An instance of Butter
     * @param {DOMElement} rootElement: The root element to which the editor's content will be attached
     * @param {Object} events: Events such as 'open' and 'close' can be defined on this object to be called at the appropriate times
     */
    BaseEditor: function( extendObject, butter, rootElement, events ){

      EventManagerWrapper( extendObject );

      extendObject.butter = butter;
      extendObject.rootElement = rootElement;
      extendObject.parentElement = null;

      /**
       * Member: open
       *
       * Opens the editor
       *
       * @param {DOMElement} parentElement: The element to which the editor's root will be attached
       */
      extendObject.open = function( parentElement ) {
        extendObject.parentElement = parentElement;

        // If an open event existed on the events object passed into the constructor, call it
        if ( events.open ) {
          events.open.apply( extendObject, arguments );
        }

        // Attach the editor's root element to the given parentElement
        extendObject.parentElement.appendChild( extendObject.rootElement );
        extendObject.dispatch( "open" );
      };

      /**
       * Member: close
       *
       * Closes the editor
       */
      extendObject.close = function() {
        // Remove the editor's root element from the element to which it was attached
        extendObject.rootElement.parentNode.removeChild( extendObject.rootElement );

        // If a close event existed on the events object passed into the constructor, call it
        if ( events.close ) {
          events.close.apply( extendObject, arguments );
        }

        extendObject.dispatch( "closed" );
      };

      extendObject.defaultLayouts = __defaultLayouts.cloneNode( true );

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
      extendObject.attachCheckboxChangeHandler = function( element, trackEvent, propertyName ) {
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
       extendObject.attachInputChangeHandler = function( element, trackEvent, propertyName ) {
        element.addEventListener( "blur", function( e ) {
          var updateOptions = {};
          updateOptions[ propertyName ] = element.value;
          trackEvent.update( updateOptions );
        }, false );
        element.addEventListener( "keyup", function( e ) {
          if ( __safeKeyUpKeys.indexOf( e.which ) > -1 ) {
            return;
          }
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
       * @param {Function} itemCallback: Optional. Called for each item, for the user to add functionality after creation
       */
      extendObject.createManifestItem = function( name, manifestEntry, data, trackEvent, itemCallback ) {
        var elem = manifestEntry.elem || "default",
            propertyArchetype = __defaultLayouts.querySelector( ".trackevent-property." + elem ).cloneNode( true ),
            editorElement,
            itemLabel = manifestEntry.label || name,
            option,
            i, l;

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
          editorElement = propertyArchetype.querySelector( "select" );

          // data-manifest-key is used to update this property later on
          editorElement.setAttribute( "data-manifest-key", name );

          if ( manifestEntry.options ) {
            for ( i = 0, l = manifestEntry.options.length; i < l; ++i ){
              option = document.createElement( "option" );
              option.value = option.innerHTML = manifestEntry.options[ i ];
              editorElement.appendChild( option );
            }
          }
        }
        else {
          editorElement = propertyArchetype.querySelector( "input" );
          if ( data ) {
            // Don't print "undefined" or the like
            if ( data === undefined || typeof data === "object" ) {
              if ( manifestEntry.default ) {
                data = manifestEntry.default;
              } else {
                data = manifestEntry.type === "number" ? 0 : "";
              }
            }
            editorElement.value = data;
          }
          editorElement.type = manifestEntry.type;

          // data-manifest-key is used to update this property later on
          editorElement.setAttribute( "data-manifest-key", name );

        }

        if ( itemCallback ) {
          itemCallback( manifestEntry.elem, editorElement, trackEvent, name );
        }

        return propertyArchetype;
      }

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
            manifestKeys = manifestKeys || Object.keys( manifestOptions ),
            option,
            i, l;

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
       */
      extendObject.createPropertiesFromManifest = function( trackEvent, itemCallback, manifestKeys, container ) {
        var manifestOptions,
            selectElement,
            item,
            element,
            container = container || extendObject.rootElement,
            i, l;

        if ( !trackEvent.manifest ) {
          throw "Unable to create properties from null manifest. Perhaps trackevent is not initialized properly yet.";
        }

        manifestOptions = trackEvent.manifest.options;
        manifestKeys = manifestKeys || Object.keys( manifestOptions );

        for ( i = 0, l = manifestKeys.length; i < l; ++i ) {
          item = manifestKeys[ i ];
          element = extendObject.createManifestItem( item, manifestOptions[ item ], trackEvent.popcornOptions[ item ], trackEvent, itemCallback );
          container.appendChild( element );
        }
      };

    },

    /**
     * Function: register
     *
     * Extends a given object to be a BaseEditor, giving it rudamentary editor capabilities
     *
     * @param {String} name: Name of the editor
     * @param {String} layoutSrc: String representing the basic HTML layout of the editor
     * @param {Function} ctor: Constructor to be run when the Editor is being created
     */
    register: function( name, layoutSrc, ctor ) {
      __editors[ name ] = {
        create: ctor,
        layout: layoutSrc
      };
    },

    /**
     * Function: create
     *
     * Creates an editor
     *
     * @param {String} editorName: Name of the editor to create
     * @param {Butter} butter: An instance of Butter
     */
    create: function( editorName, butter ) {
      var description = __editors[ editorName ],

          // Collect the element labeled with the 'butter-editor' class to avoid other elements (such as comments)
          // which may exist in the layout.
          compiledLayout = LangUtils.domFragment( description.layout ).querySelector( ".butter-editor" );

      return new description.create( compiledLayout, butter );
    },

    /**
     * Function: create
     *
     * Reports the existence of an editor given a name
     *
     * @param {String} name: Name of the editor of which existence will be verified
     */
    isRegistered: function( name ) {
      return !!__editors[ name ];
    },

    /**
     * Function: loadLayout
     *
     * Loads a layout from the specified src
     *
     * @param {String} src: The source from which the layout will be loaded
     */
    loadLayout: function( src, readyCallback ) {
      if ( src.indexOf( "{{baseDir}}" ) > -1 ) {
        src = src.replace( "{{baseDir}}", Editor.baseDir );
      }
      XHRUtils.get( src, function( e ) {
        if ( e.target.readyState === 4 ){
          readyCallback( e.target.responseText );
        }
      }, "text/plain" );

    },

    // will be set by Editor module when it loads
    baseDir: null

  };

  return Editor;

});
