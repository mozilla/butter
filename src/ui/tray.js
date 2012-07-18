/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "util/lang", "text!layouts/tray.html",
          "text!layouts/status-area.html", "text!layouts/timeline-area.html" ],
  function( LangUtils, TRAY_LAYOUT,
            STATUS_AREA_LAYOUT, TIMELINE_AREA_LAYOUT ) {

  return function(){

    var statusAreaFragment = LangUtils.domFragment( STATUS_AREA_LAYOUT );
    var timelineAreaFragment = LangUtils.domFragment( TIMELINE_AREA_LAYOUT );
    var trayRoot = LangUtils.domFragment( TRAY_LAYOUT );

    var _loadingContainer = trayRoot.querySelector( ".butter-loading-container" );

    this.statusArea = trayRoot.querySelector( ".butter-status-area" );
    this.timelineArea = trayRoot.querySelector( ".butter-timeline-area" );
    this.pluginArea = trayRoot.querySelector( ".butter-plugin-area" );
    
    this.statusArea.appendChild( statusAreaFragment );
    this.timelineArea.appendChild( timelineAreaFragment );

    document.body.appendChild( trayRoot );

    this.setMediaInstance = function( mediaInstanceRootElement ) {
      var timelineContainer = this.timelineArea.querySelector( ".butter-timeline" );
      timelineContainer.innerHTML = "";
      timelineContainer.appendChild( mediaInstanceRootElement );
    };

  };

});