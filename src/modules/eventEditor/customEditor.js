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
  var te1 = new Butter.TrackEvent({ start: 67.237868, end: 567.675675, popcornEvent: { type:"ROADMAP", start: 67.237868, end: 567.675675, zoom: 8, lat: "43", lng: "-80" } } ),
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
      newdiv.style.height = "100%";
      i++;

      options.target.appendChild(newdiv);

      // ensure that google maps and its functions are loaded
      // before setting up the map parameters
      var isMapReady = function () {
        if (_mapLoaded) {
          //console.log (options.trackEvent.popcornEvent.location);
          if (options.trackEvent.popcornEvent.location) {
            // calls an anonymous google function called on separate thread
            geocoder.geocode({
              "address": options.trackEvent.popcornEvent.location
            }, function (results, status) {
              if (status === google.maps.GeocoderStatus.OK) {
                options.trackEvent.popcornEvent.lat = results[0].geometry.location.lat();
                options.trackEvent.popcornEvent.lng = results[0].geometry.location.lng();
                location = new google.maps.LatLng(options.trackEvent.popcornEvent.lat, options.trackEvent.popcornEvent.lng);
                map = new google.maps.Map(newdiv, {
                  mapTypeId: google.maps.MapTypeId[options.trackEvent.popcornEvent.type] || google.maps.MapTypeId.HYBRID
                });
                map.getDiv().style.display = "block";
              }
            });
          } else {
            location = new google.maps.LatLng(options.trackEvent.popcornEvent.lat, options.trackEvent.popcornEvent.lng);
            map = new google.maps.Map(newdiv, {
              mapTypeId: google.maps.MapTypeId[options.trackEvent.popcornEvent.type] || google.maps.MapTypeId.HYBRID
            });
            map.getDiv().style.display = "block";
          }
      
          var show = function() {
            if ( map ) {
              //console.log (map);
              map.getDiv().style.display = "block";
              // reset the location and zoom just in case the user plaid with the map
              google.maps.event.trigger(map, 'resize');
              map.setCenter( location );

              // make sure options.zoom is a number
              if ( options.trackEvent.popcornEvent.zoom && typeof options.trackEvent.popcornEvent.zoom !== "number" ) {
                options.trackEvent.popcornEvent.zoom = +options.trackEvent.popcornEvent.zoom;
              }

              options.trackEvent.popcornEvent.zoom = options.trackEvent.popcornEvent.zoom || 8; // default to 8

              map.setZoom( options.trackEvent.popcornEvent.zoom );
              
              var parent = map.getDiv().parentNode,
                submit = document.createElement("input");
              
              submit.value = "Submit Location Data";
              submit.type = "button";
              submit.addEventListener( "click", function() {
                var latlng = map.getCenter(),
                
                attributes = {
                  zoom: map.getZoom(),
                  lat: latlng.Ja,
                  lng: latlng.Ka,
                  type: map.getMapTypeId().toUpperCase(),
                  start: options.trackEvent.popcornEvent.start,
                  end: options.trackEvent.popcornEvent.end
                };
                
                options.callback( options.trackEvent, attributes );
                
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
  
  b.addTrackEvent( b.addTrack( new Butter.Track()), te1);
  
  var open = document.getElementById( "openBtn1" );
  open.addEventListener( "click", function(){
    b.editTrackEvent( { trackEvent: te1, 
      manifest: m1 }
    );
  }, false);
  window.b = b;
}, false);
