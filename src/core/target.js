/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function() {
  define( [ "core/logger", "core/eventmanager", "ui/page-element" ], function( Logger, EventManager, PageElement ) {

    var __guid = 0;

    var Target = function ( options ) {
      options = options || {};

      var _id = __guid++,
          _logger = new Logger( _id ),
          _em = new EventManager( this ),
          _name = options.name || "Target" + _id,
          _element = options.element,
          _pageElement,
          _this = this;

      if( typeof( _element ) === "string" ){
        _element = document.getElementById( _element );
      } //if

      if( !_element ){
        _logger.log( "Warning: Target element is null." );
      }
      else {
        _pageElement = new PageElement( _element, {
          drop: function( event, ui ){
            _em.dispatch( "trackeventrequested", {
              event: event,
              target: _this,
              ui: ui
            });
          }
        },
        {
          highlightClass: "butter-target-highlight"
        });
      } //if

      Object.defineProperties( this, {
        view: {
          enumerable: true,
          get: function(){
            return _pageElement;
          }
        },
        name: {
          enumerable: true,
          get: function(){
            return _name;
          }
        },
        id: {
          enumerable: true,
          get: function(){
            return _id;
          }
        },
        elementID: {
          enumerable: true,
          get: function(){
            if( _element ){
              return _element.id;
            } //if
          }
        },
        element: {
          enumerable: true,
          get: function(){
            return _element;
          }
        },
        isDefault: {
          enumerable: true,
          get: function(){
            if( _element && _element.hasAttribute( "data-butter-default" ) ){
              return true;
            } //if
            return false;
          }
        },
        json: {
          enumerable: true,
          get: function(){
            var elem = "";
            if( _element && _element.id ){
              elem = _element.id; 
            } //if
            return {
              id: _id,
              name: _name,
              element: elem 
            };
          },
          set: function( importData ){
            if( importData.name ){
              name = importData.name;
            } //if
            if( importData.element ){
              _element = document.getElementById( importData.element );
            } //if
          }
        }
      });

    }; //Target

    return Target;

  }); //define
})();
