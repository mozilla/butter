document.addEventListener( "DOMContentLoaded", function domReady() {

  var gmaps,
      geocoder,
      _manifest,
      map,
      centerChangedListener,
      centerChangedTimeout,
      geolocTimeout,
      trackEvent = {},
      elements = {},
      _comm = new window.Comm(),
      fields = [ "start", "end", "location", "lat", "lng", "type", "target" ],
      stamenTypes = [ "STAMEN-TONER", "STAMEN-WATERCOLOR", "STAMEN-TERRAIN" ];

  // Update the local trackEvent Object, push changes to butter
  function update() {

    for ( var prop in _manifest.options ) {
      if ( _manifest.options.hasOwnProperty( prop ) && !!elements[ prop ] ) {
        trackEvent[ prop ] = elements[ prop ].value;
      }
    }

    trackEvent.zoom = map.getZoom();

    document.getElementById( "message" ).innerHTML = "";
    elements.start.className = elements.end.className = "";

    _comm.send( "submit", {
      eventData: trackEvent
    });
  }

  // Update the map using the Geocoder
  // useLocation: boolean - true tells the geocoder to use the value in the Location Textbox,
  //              False will use lat and lng values.
  function geocode( useLocation ) {

    function processResults( results, status ) {
      if ( status === gmaps.GeocoderStatus.OK ) {
        removeCenterChangedListener();
        map.setCenter( results[ 0 ].geometry.location );
        addCenterChangedListener();
      } else {
        geocoder.geocode({
          address: _manifest.options.location.default
        }, processResults );
      }
    }

    if ( geocoder ) {
      if ( useLocation ) {
        // use value in location textbox
        geocoder.geocode({
          address: elements.location.value.trim()
        }, processResults );
      } else {
        // use values in lat and lng textboxes
        map.setCenter( new gmaps.LatLng( +elements.lat.value, +elements.lng.value ) );
      }
    }
  }

  // Use the geocoder to update the map based on latitude and Longitude
  // Clears the location textbox
  function geocodeLatLng() {

    var lat = elements.lat.value,
        lng = elements.lng.value;

    // Make sure the conditions are just right.
    if ( lat && lng &&
         typeof +lat  === "number" && typeof +lng === "number" &&
         +lat >= -90 && +lat <= 90 &&
         +lng >= -180 && +lng <=180 ) {

      elements.location.value = "";
      geocode( false );
      update();
    }
  }

  // Use the Geocoder to update the map based on an address (location)
  // Clears the Lat and Lng boxes
  // Uses a timeout to cut down on requests as the user types.
  function geocodeLoc() {

    if ( geolocTimeout ) {
      clearTimeout( geolocTimeout );
    }

    geolocTimeout = setTimeout(function() {
      elements.lat.value = "";
      elements.lng.value = "";
      geocode( true );
      update();
    }, 450 );
  }

  // Change the map layer type
  function setMapType() {

    var layer,
        type = elements.type.value;

    if ( stamenTypes.indexOf( type ) !== -1 ) {
      layer = type.toLowerCase();
    }

    map.setMapTypeId( layer ? layer : gmaps.MapTypeId[ type ] );

    if ( layer ) {
      map.mapTypes.set( layer, new gmaps.StamenMapType( layer.replace( "stamen-", "" ) ) );
    }

    update();
  }

  // Add template targets to drop down list
  function addTargets( targets ) {

    var select, option;

    select = elements.target;
    select.innerHTML = "";

    for ( var i = 0, l = targets.length; i < l; i++ ) {
      option = document.createElement( "option" );
      option.value = targets[ i ];
      option.appendChild( document.createTextNode( targets[ i ] ) );
      select.appendChild( option );
    }
  }

  // callback function for the Googlemap center_changed event
  // Using a test timeout to cut back on requests to the Google API
  function centerChanged() {
    if ( centerChangedTimeout ) {
      clearTimeout( centerChangedTimeout );
    }

    centerChangedTimeout = setTimeout(function() {
      elements.location.value = "";
      var newLatLng = map.getCenter();
      elements.lat.value = newLatLng.lat();
      elements.lng.value = newLatLng.lng();
      update();
    }, 150 );
  }

  function addCenterChangedListener() {
    centerChangedListener = gmaps.event.addListener( map, "center_changed", centerChanged );
  }

  function removeCenterChangedListener() {
    if ( !centerChangedListener ) {
      return;
    }
    gmaps.event.removeListener( centerChangedListener );
  }

  // callback function for the Googlemap zoom_changed event
  function zoomChanged() {
    trackEvent.zoom = map.getZoom();
    update();
  }

  for ( var i = 0, len = fields.length; i < len; i++ ) {
    elements[ fields[ i ] ] = document.getElementById( fields[ i ] );
  }

  _comm.listen( "trackeventdata", function( e ) {

    // ensure that google maps and geocoder are available
    function ready() {

      function defaultValue( item, val ) {
        if ( val === undefined || typeof val === "object" ) {
          if ( item.default ) {
            return item.default;
          }
          return item.type === "number" ? 0 : "";
        }
        return val;
      }

      if ( window.parent.google && window.parent.google.maps && window.parent.google.maps.Geocoder ) {

        var layer;

        gmaps = window.parent.google.maps;
        geocoder = new gmaps.Geocoder();

        _manifest = e.data.manifest;
        trackEvent = e.data.popcornOptions;

        // Add Targets
        addTargets( e.data.targets );

        for ( var prop in _manifest.options ) {
          if ( _manifest.options.hasOwnProperty( prop ) && !!elements[ prop ] ) {
            var val = trackEvent[ prop ];
            elements[ prop ].value = val || defaultValue( _manifest.options[ prop ], val );
          }
        }

        elements.type.value = elements.type.value || "ROADMAP";
        trackEvent.zoom = typeof trackEvent.zoom === "number" ? trackEvent.zoom : 1;

        if ( stamenTypes.indexOf( trackEvent.type ) !== -1 ) {
          layer = trackEvent.type.toLowerCase();
        }

        map = new gmaps.Map( document.getElementById( "map" ), {
          zoom: trackEvent.zoom,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeId: layer ? layer : gmaps.MapTypeId[ elements.type.value ],
          center: new gmaps.LatLng( 0, 0 )
        });

        if ( layer ) {
          map.mapTypes.set( layer, new gmaps.StamenMapType( layer.replace( "stamen-", "" ) ) );
        }

        geocode( !!elements.location.value );

        // Googlemap listeners
        gmaps.event.addListener( map, "zoom_changed", zoomChanged );

        centerChangedListener = gmaps.event.addListener( map, "center_changed", centerChanged );

        // Element Listeners
        elements.start.addEventListener( "change", update, false );
        elements.start.addEventListener( "keyup", update, false );

        elements.end.addEventListener( "change", update, false );
        elements.end.addEventListener( "keyup", update, false );

        elements.lat.addEventListener( "blur", geocodeLatLng, false );
        elements.lng.addEventListener( "blur", geocodeLatLng, false );

        elements.location.addEventListener( "keypress", geocodeLoc, false );

        elements.type.addEventListener( "change", setMapType, false );
        elements.target.addEventListener( "change", update, false );

      } else {
        setTimeout( ready, 15 );
      }
    }

    ready();
  });

  _comm.listen( "trackeventupdatefailed", function( e ) {
    if( e.data === "invalidtime" ){
      document.getElementById( "message" ).innerHTML = "You've entered an invalid start or end time. Please verify that they are both greater than 0, the end time is equal to or less than the media's duration, and that the start time is less than the end time.";
      elements.start.className = elements.end.className = "error";
    } //if
  });

  _comm.listen( "close", function( e ){
    update();
  });
}, false );
