/* This Source Code Form is subject to the terms of the MIT license.
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

/**$
 * Target
 *
 * A wrapper for Popcorn targets.
 *
 * @type Module
 */
 define( [ "core/logger", "core/eventmanager", "ui/page-element" ],
        function( Logger, EventManager, PageElement ) {

  var __guid = 0;

  /**$
   * Target::Target
   *
   * An observer/notification system.
   *
   * @type class
   * @param {Dictionary} options Initialization options:
   *    - name {String} Optional. Name of Target object.
   *    - element {String} Id of target DOM Element.
   */
  var Target = function ( options ) {
    options = options || {};

    var _id = "Target" + __guid++,
        _logger = new Logger( _id ),
        _name = options.name || _id,
        _element,
        _pageElement,
        _this = this;

    EventManager.extend( _this );

    _element = document.getElementById( options.element );

    if( !_element ){
      _logger.log( "Warning: Target element is null." );
    }
    else {
      _pageElement = new PageElement( _element, {
        drop: function( element ){
          _this.dispatch( "trackeventrequested", {
            element: element,
            target: _this
          });
        }
      });
    }

    /**$
     * Target::Target::destroy
     *
     * Removes connection between Butter (this Target object) and the DOM Element.
     *
     * @type member function
     * @api public
     */
    this.destroy = function () {
      if ( _pageElement ) {
        _pageElement.destroy();
      }
    };

    Object.defineProperties( this, {

      /**$
       * Target::Target::view
       *
       * PageElement associated with the Target.
       *
       * @type property
       * @return {PageElement}
       */
      view: {
        enumerable: true,
        get: function(){
          return _pageElement;
        }
      },

      /**$
       * Target::Target::name
       *
       * Name of this Target object.
       *
       * @type property
       * @return {String}
       */
      name: {
        enumerable: true,
        get: function(){
          return _name;
        }
      },

      /**$
       * Target::Target::id
       *
       * Unique id for this Target object.
       *
       * @type property
       * @return {String}
       */
      id: {
        enumerable: true,
        get: function(){
          return _id;
        }
      },

      /**$
       * Target::Target::elementID
       *
       * Id of the DOM element wrapped by this Target object.
       *
       * @type property
       * @return {String}
       */
      elementID: {
        enumerable: true,
        get: function(){
          if( _element ){
            return _element.id;
          }
        }
      },

      /**$
       * Target::Target::element
       *
       * DOM Element wrapped by this Target object.
       *
       * @type property
       * @return {DOMElement}
       */
      element: {
        enumerable: true,
        get: function(){
          return _element;
        }
      },

      /**$
       * Target::Target::isDefault
       *
       * Flag to signify whether or not the `data-butter-default` attribute was set on the wrapped element.
       *
       * @type property
       * @return {Boolean}
       */
      isDefault: {
        enumerable: true,
        get: function(){
          if( _element && _element.hasAttribute( "data-butter-default" ) ){
            return true;
          }
          return false;
        }
      },

      /**$
       * Target::Target::json
       *
       * Portable representation of this Target object as JSON. Returns a new object on each access (use sparingly).
       *
       * @type property
       * @return {JSON}
       */
      json: {
        enumerable: true,
        get: function(){
          var elem = "";
          if( _element && _element.id ){
            elem = _element.id;
          }
          return {
            id: _id,
            name: _name,
            element: elem
          };
        },
        set: function( importData ){
          if( importData.name ){
            _name = importData.name;
          }
          if( importData.element ){
            _element = document.getElementById( importData.element );
          }
        }
      }
    });

  };

  return Target;

});