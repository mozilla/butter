/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/eventmanager", "util/lang" ],
        function( EventManagerWrapper, LangUtils ) {

  var __editors = {};

  return {

    BaseEditor: function( extendObject, butter, rootElement, events ){

      EventManagerWrapper( extendObject );

      extendObject.butter = butter;
      extendObject.rootElement = rootElement;
      extendObject.parentElement = null;

      extendObject.open = function ( parentElement ) {
        extendObject.parentElement = parentElement;
        if ( events.open ) {
          events.open.apply( extendObject, arguments );
        }
        extendObject.parentElement.appendChild( extendObject.rootElement );
        extendObject.dispatch( "open" );
      };

      extendObject.close = function () {
        extendObject.rootElement.parentNode.removeChild( extendObject.rootElement );
        if ( events.close ) {
          events.close.apply( extendObject, arguments );
        }
        extendObject.dispatch( "closed" );
      };

    },

    register: function( name, layoutSrc, ctor ) {
      __editors[ name ] = {
        create: ctor,
        layout: layoutSrc
      };
    },

    create: function( editorName, butter ) {
      var description = __editors[ editorName ],
          compiledLayout = LangUtils.domFragment( description.layout ).querySelector( ".butter-editor" );

      return new description.create( compiledLayout, butter );
    }

  };

});
