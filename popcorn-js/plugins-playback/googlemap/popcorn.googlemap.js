// PLUGIN: Google Maps
var googleCallback;
(function (Popcorn) {
  
  /**
   * googleMap popcorn plug-in 
   * Adds a map to the target div centered on the location specified by the user
   * Options parameter will need a start, end, target, type, zoom, lat and long, and location
   * -Start is the time that you want this plug-in to execute
   * -End is the time that you want this plug-in to stop executing 
   * -Target is the id of the DOM element that you want the map to appear in. This element must be in the DOM
   * -Type [optional] either: HYBRID (default), ROADMAP, SATELLITE, TERRAIN 
   * -Zoom [optional] defaults to 0
   * -Lat and Long: the coordinates of the map must be present if location is not specified.
   * -Location: the adress you want the map to display, bust be present if lat and log are not specified.
   *  Note: using location requires extra loading time, also not specifying both lat/long and location will
   * cause and error. 
   * @param {Object} options
   * 
   * Example:
     var p = Popcorn('#video')
        .googleMap({
          start: 5, // seconds
          end: 15, // seconds
          type: 'ROADMAP',
          target: 'map',
          lat: 43.665429,
          long: -79.403323
        } )
   *
   */
  Popcorn.plugin( "googlemap" , (function(){
      
    var newdiv, i = 1, _mapFired = false, _mapLoaded = false;
    
    return {
      manifest: {
        about:{
          name: "Popcorn Google Map Plugin",
          version: "0.1",
          author: "@annasob",
          website: "annasob.wordpress.com"
        },
        options:{
          start    : {elem:'input', type:'text', label:'In'},
          end      : {elem:'input', type:'text', label:'Out'},
          target   : 'map-container',
          type     : {elem:'select', options:['ROADMAP','SATELLITE', 'HYBRID', 'TERRAIN'], label:'Type'},
          zoom     : {elem:'input', type:'text', label:'Zoom'},
          lat      : {elem:'input', type:'text', label:'Lat'},
          lng     : {elem:'input', type:'text', label:'Long'},
          location : {elem:'input', type:'text', label:'Location'}
        }
      },
      _setup : function( options ) {
        // insert google api script once
        if (!_mapFired) {
          _mapFired = true;
          var loadScriptTime = (new Date).getTime();
          var head = document.getElementsByTagName('head')[0];
          var script = document.createElement('script');
         
          script.src = "http://maps.google.com/maps/api/js?sensor=false&callback=googleCallback";
          script.type = "text/javascript";
          head.insertBefore( script, head.firstChild ); 
        }
        // callback function fires when the script is run
        googleCallback = function() {
          _mapLoaded    = true;
        };
        // If there is no lat/long, and there is location, geocode the location
        // you can only do this once google.maps exists
        // however geocode takes a while so loop this function until lat/long is defined.
        var isGeoReady = function() {
          if ( !_mapLoaded && !options.lat) {
            setTimeout(function () {
              isGeoReady();
            }, 13);
          } else {
            
            if ( options.location && ( !options.lat || !options.lng) ) {
              
              var geocoder = new google.maps.Geocoder();
              
              geocoder.geocode({ 'address': options.location}, function(results, status) {
                if (status === google.maps.GeocoderStatus.OK) {
                
                  options.lat  = results[0].geometry.location.lat();
                  options.lng = results[0].geometry.location.lng();
                } 
              });
            }
          }
        };
        isGeoReady();
        // create a new div this way anything in the target div
        // will stay intack 
        options._container              = document.createElement('div');
        options._container.id           = "actualmap" + i;
        options._container.style.width  = "100%";
        options._container.style.height = "100%";
        i++;
        
        if (document.getElementById(options.target)) {
          document.getElementById(options.target).appendChild(options._container);
        }
      },
      /**
       * @member webpage 
       * The start function will be executed when the currentTime 
       * of the video  reaches the start time provided by the 
       * options variable
       */
      start: function(event, options){
      
        
        
      
        // dont do anything if the information didn't come back from google map
        var isReady = function () {
          
          if ( !google.maps || !options.lat) {
            setTimeout(function () {
              isReady();
            }, 13);
          } else {
             
            if ( options._map ){
              
              options._map.getDiv().style.display = 'block';
              
              //google.maps.event.trigger( options._map, 'resize');
              
            } else {
            
              var location = new google.maps.LatLng(options.lat, options.lng);
              options._map = new google.maps.Map(options._container, {mapTypeId: google.maps.MapTypeId[options.type] || google.maps.MapTypeId.HYBRID });      
            }
            // reset the location and zoom just in case the user plaid with the map
            options._map.setCenter( location );
            options._map.setZoom( options.zoom || 5 );
          }
        };
        
        isReady();
      },
      /**
       * @member webpage 
       * The end function will be executed when the currentTime 
       * of the video  reaches the end time provided by the 
       * options variable
       */
      end: function(event, options){
        /*
        var $children = document.getElementById(options.target).children;

        if ( !!$children.length ) {
          Array.prototype.forEach.call( $children, function( obj, key) {
              obj.style.display = "none";
          });    
        }        
        */
        // if the map exists hide it do not delete the map just in 
        // case the user seeks back to time b/w start and end
        if (options._map) {
          options._map.getDiv().style.display = 'none';          
        }        
      }
      
    };
    
  })());

})( Popcorn );