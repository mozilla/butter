/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "text!layouts/trackevent-editor-defaults.html", "util/lang" ], function ( DEFAULT_LAYOUT, LangUtils ) {

  var __defaultLayouts = LangUtils.domFragment( DEFAULT_LAYOUT );

  return function ( butter, rootElement ) {

    var _butter = butter,
        _rootElement = rootElement,
        _targets = [ butter.currentMedia ].concat( butter.targets );

    function createTargetsList () {
      var propertyRootElement = __defaultLayouts.querySelector( ".trackevent-property.targets" ).cloneNode( true ),
          selectElement = propertyRootElement.querySelector( "select" ),
          mediaOptionElement = selectElement.firstChild,
          optionElement;

      for ( var i=1; i<_targets.length; ++i ) {
        optionElement = document.createElement( "option" );
        optionElement.value = i;
        optionElement.innerHTML = _targets[ i ].element.id;
        selectElement.insertBefore( mediaOptionElement );
      }

      return propertyRootElement;
    }

    function createManifestItem ( name, manifestEntry, data ) {
      var elem = manifestEntry.elem || "default",
          propertyArchetype = __defaultLayouts.querySelector( ".trackevent-property." + elem ).cloneNode( true ),
          input,
          select;

      propertyArchetype.querySelector( ".property-name" ).innerHTML = manifestEntry.label || name;
      if ( manifestEntry.elem === "select" ) {
        select = propertyArchetype.querySelector( "select" );
      }
      else {
        input = propertyArchetype.querySelector( "input" );
        if ( data ) {
          input.value = data;  
        }
        input.type = manifestEntry.type;
      }

      return propertyArchetype;
    }

    this.createPropertiesFromManifest = function ( trackEvent ) {

      var targetList = createTargetsList();

      var manifestOptions = trackEvent.manifest.options;
      for ( var item in manifestOptions ) {
        if( manifestOptions.hasOwnProperty( item ) ) {
          _rootElement.appendChild( createManifestItem( item, manifestOptions[ item ], trackEvent.popcornOptions[ item ] ) );
        }
      }

      _rootElement.appendChild( targetList );

    };

  };
  
});