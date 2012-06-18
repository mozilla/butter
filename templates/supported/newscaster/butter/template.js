/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function( Butter, EditorHelper ) {
  document.addEventListener( "DOMContentLoaded", function(){
    Butter({
      config: "butter/config.json",
      ready: function( butter ){
        var media = butter.currentMedia,
            popcorn = media.popcorn.popcorn;

        EditorHelper( butter, popcorn );

        function start() {

          var trackOne = media.addTrack( "Track1" ),
              trackTwo = media.addTrack(),
              trackThree = media.addTrack();

          trackOne.addTrackEvent({
            "type": "titlecard",
              "popcornOptions": {
                "start": 1.781,
                "end": 4.684,
                "target": "video-overlay",
                "title": "Popcorn rules!",
                "subheading": "These dudes agree:"
              }
          });

          trackOne.addTrackEvent({
            "type": "zoink",
              "popcornOptions": {
                "start": 7.145,
                "end": 8.363,
                "target": "video-overlay",
                "text": "TED is awesome",
                "type": "fact",
                "triangle": "top left",
                "flip": false,
                "classes": "none",
                "order": "1",
                "top": 134,
                "left": 74,
                "width": "200"
              }
          });

          trackTwo.addTrackEvent({
              "type": "googlemap",
              "popcornOptions": {
                "start": 4.319,
                "end": 6.953,
                "target": "video-overlay",
                "type": "ROADMAP",
                "zoom": 12,
                "lat": "",
                "lng": "",
                "location": "toronto",
                "heading": "",
                "pitch": 1
              }
          });

          trackTwo.addTrackEvent({
            "type": "zoink",
              "popcornOptions": {
                "start": 7.459,
                "end": 8.536,
                "target": "video-overlay",
                "text": "I love coffee",
                "type": "fact",
                "classes": "none",
                "triangle": "bottom left",
                "flip": false,
                "order": "1",
                "top": 221,
                "left": 74,
                "width": "200"
              }
          });

          trackThree.addTrackEvent({
            "type": "zoink",
              "popcornOptions": {
                "start": 7.722,
                "end": 8.779,
                "target": "video-overlay",
                "text": "I like clowns",
                "type": "fiction",
                "classes": "none",
                "triangle": "bottom left",
                "flip": false,
                "order": "1",
                "top": 304,
                "left": 76,
                "width": "200"
              }
          });

          trackTwo.addTrackEvent({
            "type": "flickr",
              "popcornOptions": {
                "start": 9.414,
                "end": 10.414,
                "target": "video-overlay",
                "userid": "",
                "tags": "ponies",
                "username": "",
                "apikey": "",
                "height": 200,
                "width": 200,
                "padding": 0,
                "border": 0,
                "numberofimages": 10
              }
          });

        } //start
        media.onReady( start );
      }
    });
  }, false);
}( window.Butter, window.EditorHelper ));
