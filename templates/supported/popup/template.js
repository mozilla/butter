document.addEventListener( "DOMContentLoaded", function( e ){
  Butter({
    config: "config.json",
    ready: function( butter ){
      var media = butter.media[ 0 ];

      function start(){

        var track1 = {
          "name": "Track0",
          "id": "Track0",
          "trackEvents": [
              {
                  "id": "TrackEvent0",
                  "type": "pop",
                  "popcornOptions": {
                      "start": 1.98,
                      "end": 4.13,
                      "target": "pop-container",
                      "exit": 0.3,
                      "icon": "images/error.png",
                      "text": "Add kernels!",
                      "left": "70%",
                      "top": "40%"
                  },
                  "track": "Track0",
                  "name": "TrackEvent0"
              },
              {
                  "id": "TrackEvent2",
                  "type": "pop",
                  "popcornOptions": {
                      "start": 7.21,
                      "end": 8.21,
                      "target": "pop-container",
                      "exit": 0.3,
                      "text": "Let 'em pop!",
                      "icon": "images/heart.png",
                      "left": "30%",
                      "top": "70%"
                  },
                  "track": "Track0",
                  "name": "TrackEvent2"
              },
              {
                  "id": "TrackEvent4",
                  "type": "pop",
                  "popcornOptions": {
                      "start": 10.29,
                      "end": 11.29,
                      "target": "pop-container",
                      "exit": 0.3,
                      "left": "30%",
                      "top": "30%",
                      "icon": "images/thumbsup.png",
                      "text": "Everything is better with Butter!"
                  },
                  "track": "Track0",
                  "name": "TrackEvent4"
              },
              {
                  "id": "TrackEvent6",
                  "type": "pop",
                  "popcornOptions": {
                      "start": 12.25,
                      "end": 13.25,
                      "target": "pop-container",
                      "exit": 0.3,
                      "icon": "images/money.png",
                      "text": "Profit!",
                      "left": "20%",
                      "top": "80%"
                  },
                  "track": "Track0",
                  "name": "TrackEvent6"
              },
              {
                  "id": "TrackEvent8",
                  "type": "words",
                  "popcornOptions": {
                      "start": 18.14,
                      "end": 22.46,
                      "target": "pop-container",
                      "text": "Make your own!",
                      "link": "http://mozillapopcorn.org",
                      "left": "50%",
                      "top": "50%"
                  },
                  "track": "Track0",
                  "name": "TrackEvent8"
              }
          ]
      };

      //Add two random tracks
      media.addTrack();
      media.addTrack();

      //Add sample data
      butter.tracks[0].json = track1;

    }
    
      media.onReady( start );

    } //ready
  }); //Butter
}, false );
