/*global EditorHelper,google*/

EditorHelper.addPlugin( "googlemap", function( trackEvent, popcorn ) {

  var container,
      target,
      popcornEventMapReference;

  function setup() {
    container = trackEvent.popcornTrackEvent._container;

    if ( trackEvent.popcornOptions.fullscreen ) {
      return;
    }

    target = trackEvent.popcornTrackEvent._target;

    EditorHelper.draggable( trackEvent, container, target );

    EditorHelper.resizable( trackEvent, container, target, {
      handlePositions: "e, se, s, sw, w, n, ne",
      minHeight: 20,
      minWidth: 20
    });
  }

  // prevent duplicate map listeners
  if ( !trackEvent.popcornTrackEvent.listenersSetup ) {
    trackEvent.popcornTrackEvent.listenersSetup = true;

    // Plugin emits this event when googlemaps fires it's idle event. We have to wait until
    // Google considers the map done loading
    popcorn.on( "googlemaps-loaded", function() {
      popcorn.off( "googlemaps-loaded" );

      // We need to setup listeners on the maps for the following events incase the user decides
      // to manipulate the map before opening the editor
      function setupMapListeners() {

        // Timeouts protect us from a flood of update requests from the Google API
        var locationTimeout,
            streetViewTimeout,
            zoomTimeout;

        function locationChanged() {

          if ( locationTimeout ) {
            clearTimeout( locationTimeout );
          }

          locationTimeout = setTimeout(function() {
            var center = popcornEventMapReference.getCenter();

            trackEvent.update({
              lat: center.lat(),
              lng: center.lng(),
              location: ""
            });
          }, 50 );
        }

        function streetViewUpdate() {

          if ( streetViewTimeout ) {
            clearTimeout( streetViewTimeout );
          }

          streetViewTimeout = setTimeout(function() {

            var pov = popcornEventMapReference.streetView.pov,
                latlng = popcornEventMapReference.streetView.getPosition(),
                updateOptions = {};

            updateOptions.heading = pov.heading;
            updateOptions.pitch = pov.pitch;
            updateOptions.zoom = pov.zoom;
            updateOptions.lat = latlng.lat();
            updateOptions.lng = latlng.lng();
            updateOptions.location = "";

            trackEvent.update( updateOptions );
          }, 100 );
        }

        function zoomChange() {

          if ( zoomTimeout ) {
            clearTimeout( zoomTimeout );
          }

          zoomTimeout = setTimeout(function() {
            trackEvent.update({
              zoom: popcornEventMapReference.getZoom()
            });
          }, 50 );
        }

        function closeClick() {
          trackEvent.update({
            type: trackEvent._cachedValues.type || "ROADMAP",
            zoom: trackEvent._cachedValues.zoom || 0
          });
        }

        // Regular map event listeners
        google.maps.event.addListener( popcornEventMapReference, "drag", locationChanged );
        google.maps.event.addListener( popcornEventMapReference, "dragend", locationChanged );
        google.maps.event.addListener( popcornEventMapReference, "zoom_changed", zoomChange );

        // StreetView event listeners
        google.maps.event.addListener( popcornEventMapReference.streetView, "pov_changed", streetViewUpdate );
        google.maps.event.addListener( popcornEventMapReference.streetView, "position_changed", streetViewUpdate );
        google.maps.event.addListener( popcornEventMapReference.streetView, "pano_changed", streetViewUpdate );
        google.maps.event.addListener( popcornEventMapReference.streetView, "closeclick", closeClick );

        setup();
      }

      popcornEventMapReference = trackEvent.popcornTrackEvent._map;
      setupMapListeners();
    });
  }
});
