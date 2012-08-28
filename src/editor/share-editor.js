/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "editor/editor",
          "editor/base-editor",
          "util/lang",
          "util/xhr",
          "text!layouts/share-editor.html",
        "text!layouts/badges.html" ],
  function( Editor, BaseEditor, LangUtils, XHR, LAYOUT_SRC, BADGE_LAYOUT ) {

  var __badgeLayout = LangUtils.domFragment( BADGE_LAYOUT ),
      __timeStamp = "";

  function createBadgeElement( data ) {
    var badgeRoot = __badgeLayout.cloneNode( true ).querySelector( ".butter-badge" ),
        iconEl = badgeRoot.querySelector( ".butter-badge-icon" ),
        nameEl = badgeRoot.querySelector( ".butter-badge-name" ),
        descEl = badgeRoot.querySelector( ".butter-badge-desc" ),
        closeBtn = badgeRoot.querySelector( ".butter-badge-close" );

    iconEl.href = data.image_url;
    iconEl.style[ "background-image" ] = "url( \"" + data.image_url + "\" )";
    nameEl.appendChild( document.createTextNode( data.name ) );
    descEl.appendChild( document.createTextNode( data.description ) );

    closeBtn.addEventListener( "click", function( e ) {
      badgeRoot.style.opacity = 0;
      setTimeout( function() {
        badgeRoot.style.display = "none";
      }, 1000 );
    }, false );

    return badgeRoot;
  }

  function getBadges( rootElement ) {
      var _badgeContainer = rootElement.querySelector( ".butter-badge-container" );

      XHR.get( "/api/badges?since=" + __timeStamp, function( data) {
        var i,
            l,
            badgeData;

        if ( data.target.readyState === 4 ) {
          badgeData = JSON.parse( data.target.responseText ).badges;
          if ( !badgeData ) {
            return;
          }
          __timeStamp = badgeData.since;
          for ( i = 0, l = badgeData.length; i< badgeData.length; i++ ) {
            _badgeContainer.appendChild( createBadgeElement( badgeData[ i ] ) );
          }
        }
      });
  }

  Editor.register( "share-properties", LAYOUT_SRC, function( rootElement, butter, compiledLayout ) {

    Editor.BaseEditor( this, butter, rootElement, {
      open: function() {
        __timeStamp = new Date().getTime();
        getBadges( rootElement );

      },
      close: function() {

      }
    });

  });

});
