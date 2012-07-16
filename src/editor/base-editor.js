/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/eventmanager" ], function( EventManagerWrapper ) {

  /**
   * Class: BaseEditor
   *
   * Extends a given object to be a BaseEditor, giving it rudamentary editor capabilities
   *
   * @param {Object} extendObject: Object to be extended to become a BaseEditor
   * @param {Butter} butter: An instance of Butter
   * @param {DOMElement} rootElement: The root element to which the editor's content will be attached
   * @param {Object} events: Events such as 'open' and 'close' can be defined on this object to be called at the appropriate times
   */  
  return function( extendObject, butter, rootElement, events ) {

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

  };

});