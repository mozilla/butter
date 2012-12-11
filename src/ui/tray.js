/* This Source Code Form is subject to the terms of the MIT license.
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ "util/lang",  "./logo-spinner",
          "text!layouts/tray.html",
          "text!layouts/status-area.html", "text!layouts/timeline-area.html" ],
  function( LangUtils, LogoSpinner,
            TRAY_LAYOUT,
            STATUS_AREA_LAYOUT, TIMELINE_AREA_LAYOUT ) {

  return function(){

    var statusAreaFragment = LangUtils.domFragment( STATUS_AREA_LAYOUT, ".media-status-container" );
    var timelineAreaFragment = LangUtils.domFragment( TIMELINE_AREA_LAYOUT, ".butter-timeline" );
    var trayRoot = LangUtils.domFragment( TRAY_LAYOUT, ".butter-tray" );

    var _loadingContainer = trayRoot.querySelector( ".butter-loading-container" );

    var _logoSpinner = new LogoSpinner( _loadingContainer );

    this.statusArea = trayRoot.querySelector( ".butter-status-area" );
    this.timelineArea = trayRoot.querySelector( ".butter-timeline-area" );
    
    this.rootElement = trayRoot;

    this.statusArea.appendChild( statusAreaFragment );
    this.timelineArea.appendChild( timelineAreaFragment );

    this.attachToDOM = function() {
      document.body.appendChild( trayRoot );
    };

    this.show = function() {
      // This function's only purpose is to avoid having transitions on the tray while it's attached to the DOM,
      // since Chrome doesn't display the element where it should be on load.
      trayRoot.classList.add( "butter-tray-transitions" );
    };

    this.setMediaInstance = function( mediaInstanceRootElement ) {
      var timelineContainer = this.timelineArea.querySelector( ".butter-timeline" );
      timelineContainer.innerHTML = "";
      timelineContainer.appendChild( mediaInstanceRootElement );
    };

    this.toggleLoadingSpinner = function( state ) {
      if ( state ) {
        _logoSpinner.start();
        _loadingContainer.style.display = "block";
      }
      else {
        _logoSpinner.stop( function() {
          _loadingContainer.style.display = "none";
        });
      }
    };

    Object.defineProperties( this, {
      minimized: {
        enumerable: true,
        set: function( val ) {
          if ( val ) {
            document.body.classList.add( "tray-minimized" );
            trayRoot.classList.add( "butter-tray-minimized" );
          }
          else {
            document.body.classList.remove( "tray-minimized" );
            trayRoot.classList.remove( "butter-tray-minimized" );
          }
        },
        get: function() {
          return trayRoot.classList.contains( "butter-tray-minimized" );
        }
      }
    });

  };

});