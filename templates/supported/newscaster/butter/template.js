/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function( Butter, EditorHelper, $ ) {
  document.addEventListener( "DOMContentLoaded", function(){
    Butter({
      config: "butter/config.json",
      ready: function( butter ){
        var media = butter.currentMedia,
            popcorn = media.popcorn.popcorn;

        EditorHelper( butter, popcorn );

        function makeWeather(){
          var city = "Edinburgh",
              query = city + "&num_of_days=3",
              uri = "http://free.worldweatheronline.com/feed/weather.ashx?key=b378c25d5e191856122206&q=" + query + "&format=json";
          
          $.ajax({
            "url": uri,
            "data": query,
            dataType: "jsonP",
            success: function( data ) {
              console.log( data );
              var current = data.data.current_condition[0],
                  cloudCover = current.cloudcover,
                  weatherCode = current.weatherCode,
                  weatherIcon = "img/weather/wsprite" + current.weatherIconUrl[0].value.split("wsymbol_")[1].replace(/_/g,"-"),
                  temp = current.temp_C;

              $("#weather-city").html( city );
              $("#weather-temp").html( temp + "&deg;");
              $("#weather-icon").css( "background", "url(" + weatherIcon + ")" );
              $('#weather-icon').spritely({fps: 25, no_of_frames: 64});
                
            }
          });
          /*
          Popcorn.getJSONP( uri, function( data ) {
            console.log( data );
          });
          */
      
        }

        makeWeather();
      }
    });
  }, false);
}( window.Butter, window.EditorHelper, window.jQuery ));
