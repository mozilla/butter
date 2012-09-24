/*global EditorHelper,google,clearTimeout,setTimeout*/

EditorHelper.addPlugin( "googlemap", function( trackEvent, popcornInstance ) {
  var UPDATE_TIMEOUT = 250;

  var container,
      media,
      hotspot,
      hotspotIcon,
      hotspotIconContainer,
      popcorn = popcornInstance,
      popcornEventMapReference;

  function setup() {
    container = trackEvent.popcornTrackEvent._container;

    hotspot = container.querySelector( ".butter-dragging-hotspot" );

    if ( hotspot ) {
      container.removeChild( hotspot );
    }

    if ( trackEvent.popcornOptions.fullscreen ) {
      return;
    }

    hotspot = document.createElement( "div" );
    hotspotIconContainer = document.createElement( "a" );
    hotspotIconContainer.className = "butter-btn btn-light";

    hotspotIcon = document.createElement( "span" );
    hotspotIcon.className = "icon icon-only icon-move";

    hotspot.style.left = "0px";
    hotspot.style.bottom = "0px";
    hotspot.style.position = "absolute";
    hotspot.className = "butter-dragging-hotspot";

    hotspotIconContainer.appendChild( hotspotIcon );
    hotspot.appendChild( hotspotIconContainer );
    container.appendChild( hotspot );

    media = document.getElementById( trackEvent.track._media.target );

    hotspot.addEventListener( "mousedown", function( e ) {
      EditorHelper.draggable( trackEvent, container, media );
    }, false );

    EditorHelper.resizable( trackEvent, container, media, {
      handlePositions: "e, se, s, nw",
      minHeight: 20,
      minWidth: 20
    });
  }

  // Plugin emits this event when googlemaps fires it's idle event. We have to wait until
  // Google considers the map done loading
  popcorn.on( "googlemaps-loaded", function() {
    popcorn.off( "googlemaps-loaded" );

    // We need to setup listeners on the maps for the following events incase the user decides
    // to manipulate the map before opening the editor
    function setupMapListeners() {

      var updateTimeout;

      google.maps.event.addListener( popcornEventMapReference, "dragend", function() {
        var center = popcornEventMapReference.getCenter();

        trackEvent.update({
          lat: center.lat(),
          lng: center.lng(),
          location: ""
        });
      });

      google.maps.event.addListener( popcornEventMapReference, "zoom_changed", function() {
        trackEvent.update({
          zoom: popcornEventMapReference.getZoom()
        });
      });

      function doUpdate() {
        // setTimeout is used because the maps API fires a ridiculous amount of events as it animates
        // zooming and panning, which causes the trackEvent to flicker and sometimes disappear.
        // This will likely be fixed when the silent popcorn update function lands
        // TODO: refactor this when silent updating is enabled in Popcorn.
        if ( updateTimeout ) {
          clearTimeout( updateTimeout );
        }

        updateTimeout = setTimeout(function() {
          var pov = popcornEventMapReference.streetView.pov,
              latlng = popcornEventMapReference.streetView.getPosition();
          trackEvent.update({
            heading: pov.heading,
            pitch: pov.pitch,
            zoom: pov.zoom,
            lat: latlng.lat(),
            lng: latlng.lng(),
            location: ""
          });
        }, UPDATE_TIMEOUT );
      }

      // If this is a street view, apply streetview specific listeners
      if ( popcornEventMapReference.streetView ) {

        google.maps.event.addListener( popcornEventMapReference.streetView, "pov_changed", doUpdate );
        google.maps.event.addListener( popcornEventMapReference.streetView, "position_changed", doUpdate );
        google.maps.event.addListener( popcornEventMapReference.streetView, "pano_changed", doUpdate );
      }

      setup();
    }

    if ( !trackEvent.popcornTrackEvent._map ) {
      trackEvent.popcornTrackEvent.onmaploaded = function( options, map ) {
        popcornEventMapReference = map;
        setupMapListeners();
      };
    }
    else {
      popcornEventMapReference = trackEvent.popcornTrackEvent._map;
      setupMapListeners();
    }
  });
});
