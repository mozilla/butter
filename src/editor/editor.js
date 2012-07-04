/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

/**
 * Module: Editor
 */
define( [ "core/eventmanager", "util/lang" ],
        function( EventManagerWrapper, LangUtils ) {

  var __editors = {};

  /**
   * Namespace: Editor
   */
  return {

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
      extendObject.open = function ( parentElement ) {
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
      extendObject.close = function () {
        // Remove the editor's root element from the element to which it was attached
        extendObject.rootElement.parentNode.removeChild( extendObject.rootElement );

        // If a close event existed on the events object passed into the constructor, call it
        if ( events.close ) {
          events.close.apply( extendObject, arguments );
        }

        extendObject.dispatch( "closed" );
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
      var xhr = new XMLHttpRequest(),
      xhr.open( "GET", src, false );

      if( xhr.overrideMimeType ){
        xhr.overrideMimeType( "text/plain" );
      }

      // Deal with caching
      xhr.setRequestHeader( "If-Modified-Since", "Fri, 01 Jan 1960 00:00:00 GMT" );
      xhr.send( null );
      if( xhr.status === 200 ){
        readyCallback({
          state: "success",
          data: xhr.responseText
        });
      }
      else {
        readyCallback({
          state: "failure",
          data: null
        });
      }
    }

  };

});
