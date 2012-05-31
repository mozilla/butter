document.addEventListener( "DOMContentLoaded", function domReady() {
  var trackEvent = {},
      gmaps,
      geocoder,
      elements = {},
      _comm,
      _manifest,
      fields = [
        "start", "end", "location", "lat", "lng", "mapType",
        "target", "target-fieldset"
      ],
      stamenTypes = [ "STAMEN-TONER", "STAMEN-WATERCOLOR", "STAMEN-TERRAIN" ];

  function update() {

    // start and end times
    trackEvent.start = elements.start.value;
    trackEvent.end = elements.end.value;

    // lat and lng
    trackEvent.lat = elements.lat.value;
    trackEvent.lng = elements.lng.value;

    // location
    trackEvent.location = elements.location.value.trim();

    // zoom
    trackEvent.zoom = map.getZoom();

    // target
    trackEvent.target = elements.target.value;

    trackEvent.type = elements.mapType.value;

    document.getElementById( "message" ).innerHTML = "";
    elements.start.className = elements.end.className = "";

    _comm.send( "submit", {
      eventData: trackEvent
    });
  }

  function geocode( useLocation ) {
    // location _always_ takes precedence over lat and lng

    var processResults = function( results, status ) {
      if ( status === gmaps.GeocoderStatus.OK ) {
        map.setCenter( results[ 0 ].geometry.location );
      }
    },
    loc = elements.location.value.trim(),
    lat = elements.lat.value,
    lng = elements.lng.value;

    if ( geocoder ) {
      if ( useLocation || !lat || !lng ) {
        geocoder.geocode({
          address: loc || _manifest.options.location[ "default" ]
        }, processResults );
      } else {
        geocoder.geocode({
          location: new gmaps.LatLng( lat, lng )
        }, processResults );
      }
    }
  }

  function geocode_latLng() {
    if ( elements.lat.value && elements.lng.value ) {
      elements.location.value = "";
      geocode( false );
      update();
    }
  }

  function geocode_loc() {
    elements.lat.value = "";
    elements.lng.value = "";
    geocode( true );
    update();
  }

  function dragEnd() {
    elements.location.value = "";
    var newLatLng = map.getCenter();
    elements.lat.value = newLatLng.lat();
    elements.lng.value = newLatLng.lng();
    geocode( false );
    update();
  }

  function setMapType() {

    var type = elements.mapType.value,
        layer;

    if ( stamenTypes.indexOf( type ) !== -1 ) {
      layer = type.replace( "STAMEN-", "" ).toLowerCase();
    }

    map.setMapTypeId( layer ? layer : gmaps.MapTypeId[ type ] );

    if ( layer ) {
      map.mapTypes.set( layer, new gmaps.StamenMapType( layer ) );
    }

    update();
  }

  function addTargets( targets ) {
    var select, option;

    select = elements.target;
    select.innerHTML = "";

    for ( var i = 0, l = targets.length; i < l; i++) {
      option = document.createElement("option");
      option.value = targets[i];
      option.appendChild( document.createTextNode(targets[i]) );
      select.appendChild(option);
      if (targets[ i ] === trackEvent.target) {
        select.selectedIndex = i;
      }
    }
  }

  window.loadGoogleMaps = function() {

    function ready() {
      if ( window.parent.google && window.parent.google.maps && window.parent.google.maps.Geocoder ) {
        gmaps = window.parent.google.maps;
        geocoder = new gmaps.Geocoder();

        elements.start.addEventListener( "change", update, false );
        elements.start.addEventListener( "keyup", update, true );

        elements.end.addEventListener( "change", update, false );
        elements.end.addEventListener( "keyup", update, true );

        elements.lat.addEventListener( "blur", geocode_latLng, false );
        elements.lng.addEventListener( "blur", geocode_latLng, false );

        elements.location.addEventListener( "change", geocode_loc, false );
        elements.location.addEventListener( "keypress", geocode_loc, false );

        elements.mapType.addEventListener( "change", setMapType, false );
        elements.target.addEventListener( "change", update, false );
      } else {
        setTimeout( ready, 15 );
      }
    }
    ready();
  }

  function initialize() {
    var i;

    _comm = new Comm();

    for ( i = 0; i < fields.length; i++ ) {
      elements[ fields[ i ] ] = document.getElementById( fields[ i ] );
    }

    _comm.listen( "trackeventdata", function( e ){

      var layer;

      _manifest = e.data.manifest;
      trackEvent = e.data.popcornOptions;
      trackEvent.zoom = typeof trackEvent.zoom === "number" ? trackEvent.zoom : _manifest.options.zoom[ "default" ];

      // select correct type
      trackEvent.type = trackEvent.type || "HYBRID";
      for ( var i = 0, len = elements.mapType.length; i < len; i++ ) {
        if ( elements.mapType.options[ i ].value.toLowerCase() === trackEvent.type.toLowerCase() ) {
          elements.mapType.selectedIndex = i;
          break;
        }
      }

      if ( stamenTypes.indexOf( trackEvent.type ) !== -1 ) {
        layer = trackEvent.type.replace( "STAMEN-", "" ).toLowerCase();
      }

      // Add Targets, select current
      addTargets( e.data.targets );

      elements.start.value = trackEvent.start;
      elements.end.value = trackEvent.end;
      elements.lat.value = trackEvent.lat || "";
      elements.lng.value = trackEvent.lng || "";
      elements.location.value = trackEvent.location || _manifest.options.location[ "default" ];

      map = new gmaps.Map(document.getElementById( "map" ), {
        zoom: trackEvent.zoom,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeId: layer ? layer : gmaps.MapTypeId[ trackEvent.type ],
        mapTypeControlOptions: { mapTypeIds: [] }
      });

      if ( layer ) {
        map.mapTypes.set( layer, new gmaps.StamenMapType( layer ) );
      }

      // map listeners
      gmaps.event.addListener( map, "zoom_changed", update );
      gmaps.event.addListener( map, "dragend", dragEnd );

      geocode( !!trackEvent.Location );
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

    loadGoogleMaps();
  }

  initialize();
}, false );