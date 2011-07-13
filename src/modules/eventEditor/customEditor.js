var googleCallback;
var i = 1,
  _mapFired = false,
  _mapLoaded = false,
  geocoder, loadMaps;
//google api callback
googleCallback = function (data) {
  // ensure all of the maps functions needed are loaded
  // before setting _maploaded to true
  if (typeof google !== "undefined" && google.maps && google.maps.Geocoder && google.maps.LatLng) {
    geocoder = new google.maps.Geocoder();
    _mapLoaded = true;
  } else {
    setTimeout(function () {
      googleCallback(data);
    }, 1);
  }
};
// function that loads the google api
loadMaps = function () {
  // for some reason the Google Map API adds content to the body
  if (document.body) {
    _mapFired = true;
    Popcorn.getScript("http://maps.google.com/maps/api/js?sensor=false&callback=googleCallback");
  } else {
    setTimeout(function () {
      loadMaps();
    }, 1);
  }
};


window.addEventListener("DOMContentLoaded", function(){
  var b = new Butter();
  b.eventeditor( {target: "butter-editor-target" } );
  var te1 = new Butter.TrackEvent({ start: 67.237868, end: 567.675675, popcornOptions: { type:"ROADMAP", start: 67.237868, end: 567.675675, zoom: 8, location: "Toronto" } } ),
  m1 = {
    options: {
      start: {
        elem: "input",
        type: "text",
        label: "In"
      },
      end: {
        elem: "input",
        type: "text",
        label: "Out"
      },
      target: "map-container",
      type: {
        elem: "select",
        options: ["ROADMAP", "SATELLITE", "STREETVIEW", "HYBRID", "TERRAIN"],
        label: "Type"
      },
      zoom: {
        elem: "input",
        type: "text",
        label: "Zoom"
      },
      lat: {
        elem: "input",
        type: "text",
        label: "Lat"
      },
      lng: {
        elem: "input",
        type: "text",
        label: "Lng"
      },
      location: {
        elem: "input",
        type: "text",
        label: "Location"
      }
    },
    customEditor: function( options ) {

      var newdiv, map, location;

      // if this is the firest time running the plugins
      // call the function that gets the sctipt
      if (!_mapFired) {
        loadMaps();
      }

      // create a new div this way anything in the target div is left intact
      // this is later passed on to the maps api
      newdiv = document.createElement("div");
      newdiv.id = "actualmap" + i;
      newdiv.style.width = "100%";
      newdiv.style.height = "85%";
      i++;

      options.target.appendChild && options.target.appendChild( newdiv ) ||
        options.target.document && options.target.document.body &&
        options.target.document.body.appendChild &&
        options.target.document.body.appendChild( newdiv );

      // ensure that google maps and its functions are loaded
      // before setting up the map parameters
      var isMapReady = function () {
        if (_mapLoaded) {
          if (options.trackEvent.popcornOptions.location) {
            // calls an anonymous google function called on separate thread
            geocoder.geocode({
              "address": options.trackEvent.popcornOptions.location
            }, function (results, status) {
              if (status === google.maps.GeocoderStatus.OK) {
                options.trackEvent.popcornOptions.lat = results[0].geometry.location.lat();
                options.trackEvent.popcornOptions.lng = results[0].geometry.location.lng();
                location = new google.maps.LatLng(options.trackEvent.popcornOptions.lat, options.trackEvent.popcornOptions.lng);
                map = new google.maps.Map(newdiv, {
                  mapTypeId: google.maps.MapTypeId[options.trackEvent.popcornOptions.type] || google.maps.MapTypeId.HYBRID
                });
                map.getDiv().style.display = "block";
              }
            });
          } else {
            location = new google.maps.LatLng(options.trackEvent.popcornOptions.lat, options.trackEvent.popcornOptions.lng);
            map = new google.maps.Map(newdiv, {
              mapTypeId: google.maps.MapTypeId[options.trackEvent.popcornOptions.type] || google.maps.MapTypeId.HYBRID
            });
            map.getDiv().style.display = "block";
          }

          var show = function() {
            if ( map ) {
              map.getDiv().style.display = "block";
              // reset the location and zoom just in case the user plaid with the map
              google.maps.event.trigger(map, 'resize');
              map.setCenter( location );

              // make sure options.zoom is a number
              if ( options.trackEvent.popcornOptions.zoom && typeof options.trackEvent.popcornOptions.zoom !== "number" ) {
                options.trackEvent.popcornOptions.zoom = +options.trackEvent.popcornOptions.zoom;
              }

              options.trackEvent.popcornOptions.zoom = options.trackEvent.popcornOptions.zoom || 8; // default to 8

              map.setZoom( options.trackEvent.popcornOptions.zoom );

              var parent = map.getDiv().parentNode,
                submit = document.createElement("input");

              submit.value = "Submit Data to Event Editor Module";
              submit.type = "button";
              submit.addEventListener( "click", function() {
                var latlng = map.getCenter(),

                popcornOptions = {
                  zoom: map.getZoom(),
                  lat: latlng.Ja,
                  lng: latlng.Ka,
                  type: map.getMapTypeId().toUpperCase(),
                  start: options.trackEvent.popcornOptions.start,
                  end: options.trackEvent.popcornOptions.end
                };

                options.okay( options.trackEvent, popcornOptions );

              }, false );
              parent.appendChild( submit);


            } else {
              setTimeout(function() {
                show();
              }, 5);
            }
          };

          show();

        } else {
            setTimeout(function () {
              isMapReady();
            }, 5);
          }
        };

      isMapReady();
      }
    };
    te1.popcornEvent = {};
    te1.popcornEvent._natives = {};
    te1.popcornEvent._natives.manifest = m1;

  b.addTrackEvent( b.addTrack( new Butter.Track()), te1);



  var open = document.getElementById( "openBtn1" );
  open.addEventListener( "click", function(){
    b.editTrackEvent( b.getTracks()[0].getTrackEvents()[0] );
  }, false);
  window.b = b;
}, false);
