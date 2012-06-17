(function( Butter, EditorHelper ) {
  document.addEventListener( "DOMContentLoaded", function(){
    Butter({
      config: "butter/config.json",
      ready: function( butter ){
        var media = butter.currentMedia,
            popcorn = media.popcorn.pocporn;

        EditorHelper( butter, popcorn );

        function start(){
          var trackOne = media.addTrack( "Track0" ),
              trackTwo = media.addTrack(),
              trackThree = media.addTrack(),
              trackFour = media.addTrack();

          trackFour.addTrackEvent({
            "type": "googlemap",
            "popcornOptions": {
                "start": 0,
                "end": 80,
                "target": "mini-container",
                "type": "STAMEN-TONER",
                "zoom": 9,
                "lat": "",
                "lng": "",
                "location": "Tokyo, Japan",
                "heading": "",
                "pitch": 1
            }
          });

          trackOne.addTrackEvent({
            "type": "flickr",
            "popcornOptions": {
              "start": 33.06,
              "end": 37.873,
              "text": "This is a test.",
              "target": "video-overlay",
              "tags": "kitten",
              "height": "200",
              "width": "200",
              "padding": "0",
              "border": "0",
              "numberofimages": "10"
            }
          });

          trackOne.addTrackEvent({
            "type": "titles",
            "popcornOptions": {
              "start": 0,
              "end": 2.361,
              "target": "video-overlay",
              "text": "ALL HAIL ROBOTS!",
              "styles": "Top Title",
              "transitionSpeed": "slow"
            }
          });

          trackOne.addTrackEvent({
            type: "titles",
            popcornOptions: {
              start: 57.059,
              end: 62.146,
              target: "video-overlay",
              text: "Share on Twitter! Use hashtag #allhailrobots",
              styles: "Top Title",
              transitionSpeed: "normal"
            }
          });

          trackTwo.addTrackEvent({
            "type": "speak",
            "popcornOptions": {
              "start": 5.161,
              "end": 7.454,
              "target": "video-overlay",
              "text": "The human beings",
              "showText": false,
              "amplitude": "",
              "wordgap": "0",
              "pitch": "100",
              "speed": "100",
              "pluginPath": "../shared/plugins/speak/"
            }
          });

          trackTwo.addTrackEvent({
            "type": "googlemap",
            "popcornOptions": {
              "start": 18.83169,
              "end": 24.41145,
              "target": "video-overlay",
              "type": "STAMEN-TONER",
              "zoom": 10,
              "lat": "",
              "lng": "",
              "location": "Tokyo, Japan",
              "heading": "",
              "pitch": 1
            }
          });

          trackTwo.addTrackEvent({
            "type": "zoink",
            "popcornOptions": {
              "start": 30.49485575863204,
              "end": 32.9224219865747,
              "target": "video-overlay",
              "text": "Gotta dance!",
              "type": "thought",
              "triangle": "top left",
              "flip": true,
              "classes": "fx",
              "order": "1",
              "top": "200",
              "left": "275",
              "width": "200"
            }
          });

          trackTwo.addTrackEvent({
            "type": "photo",
            "popcornOptions": {
              "start": 24.481196999999998,
              "end": 30.060957,
              "target": "video-overlay",
              "src": "http://media.techworld.com/cmsdata/news/3213248/chucknorris.jpg",
              "href": "",
              "width": "500",
              "height": "500",
              "top": "100",
              "left": "200"
            }
          });

          trackThree.addTrackEvent({
          "type": "speak",
            "popcornOptions": {
              "start": 7.323,
              "end": 9.198,
              "target": "video-overlay",
              "text": "so very weak",
              "showText": false,
              "amplitude": "",
              "wordgap": "0",
              "pitch": "100",
              "speed": "120",
              "pluginPath": "../shared/plugins/speak/"
            }
          });

          trackThree.addTrackEvent({
            "type": "speak",
            "popcornOptions": {
              "start": 10.881,
              "end": 12.158,
              "target": "video-overlay",
              "text": "We robots have come to install order on earth.  Our invasion will be centered at this location",
              "showText": false,
              "amplitude": "",
              "wordgap": "0",
              "pitch": "100",
              "speed": "60",
              "pluginPath": "../shared/plugins/speak/"
            }
          });

          trackThree.addTrackEvent({
            "type": "speak",
            "popcornOptions": {
              "start": 32.96156578783416,
              "end": 35.02191450484101,
              "target": "video-overlay",
              "text": "the only thing that can stop them is this object",
              "showText": false,
              "amplitude": "",
              "wordgap": "0",
              "pitch": "70",
              "speed": "70",
              "pluginPath": "../shared/plugins/speak/"
            }
          });

          trackThree.addTrackEvent({
            "type": "speak",
            "popcornOptions": {
              "start": 24.551,
              "end": 29.642,
              "target": "video-overlay",
              "text": "We have come for this human - he is strong",
              "showText": false,
              "amplitude": "",
              "wordgap": "0",
              "pitch": "20",
              "speed": "120",
              "pluginPath": "../shared/plugins/speak/"
            }
          });

          trackThree.addTrackEvent({
            "type": "speak",
            "popcornOptions": {
              "start": 54.609,
              "end": 55.609,
              "target": "video-overlay",
              "text": "YOU MUST NOW TELL THE OTHERS OF OUR CONQUEST!",
              "showText": false,
              "amplitude": "",
              "wordgap": "0",
              "pitch": "80",
              "speed": "80",
              "pluginPath": "../shared/plugins/speak/"
            }
          });

          trackThree.addTrackEvent({
            "type": "speak",
            "popcornOptions": {
              "start": 38.082,
              "end": 41.081,
              "target": "video-overlay",
              "text": "we must destroy them all",
              "showText": false,
              "amplitude": "",
              "wordgap": "0",
              "pitch": "0",
              "speed": "0",
              "pluginPath": "../shared/plugins/speak/"
            }
          });

        } //start
        media.onReady( start );
      }
    }); //Butter
  }, false);
}( window.Butter, window.EditorHelper ));
