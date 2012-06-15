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
            "type": "text",
            "popcornOptions": {
              "start": 0,
              "end": 1,
              "text": "Here you can put any text you like!",
              "target": "Area1",
              "escape": false,
              "multiline": false
            }
          });

          trackOne.addTrackEvent({
            "type": "titlecard",
            "popcornOptions": {
              "start": 3.988,
              "end": 6.866,
              "target": "video-overlay",
              "title": "Popcorn rules!",
              "subheading": "These dudes agree:"
            }
          });

          trackOne.addTrackEvent({
            "type": "zoink",
            "popcornOptions": {
              "start": 7.477,
              "end": 9.537,
              "target": "video-overlay",
              "text": "I am a Robot!",
              "type": "thought",
              "triangle": "top left",
              "flip": false,
              "classes": "none",
              "order": 1,
              "top": 200,
              "left": 200,
              "width": 200
            }
          });

          trackTwo.addTrackEvent({
            "type": "photo",
            "popcornOptions": {
              "start": 3.988,
              "end": 6.872,
              "target": "video-overlay",
              "src": "http://www.mozilla.org/img/covehead/firefox/brand-toolkit/identity-logo-firefox.png",
              "href": "http://www.mozilla.org/",
              "width": 150,
              "height": 150,
              "top": 25,
              "left": 75
            }
          });

          trackTwo.addTrackEvent({
            "type": "text",
            "popcornOptions": {
              "start": 1.23,
              "end": 2.23,
              "target": "Area2",
              "text": "Also in here!",
              "escape": false,
              "multiline": false
            }
          });
        } //start
        media.onReady( start );
      }
    });
  }, false);
}( window.Butter, window.EditorHelper ));
