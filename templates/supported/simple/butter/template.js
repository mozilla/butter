/* This Source Code Form is subject to the terms of the MIT license
* If a copy of the MIT license was not distributed with this file, you can
* obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function( Butter ) {
  Butter({
    config: "butter/config.json",
    ready: function( butter ){
      var media = butter.media[ 0 ],
          popcorn = butter.media[ 0 ].popcorn.popcorn;

      function start(){

    		butter.importProject ({
          "targets": [
            {
              "id": "Target0",
              "name": "Target0",
              "element": "above-right"
            }
          ],
          "media": [
            {
              "id": "Media0",
              "name": "Media0",
              "target": "video",
              "duration": 60.060150146484375,
              "tracks": [
                {
                  "name": "Track0",
                  "id": "Track0",
                  "trackEvents": [
                    {
                      "id": "TrackEvent1",
                      "type": "googlemap",
                      "popcornOptions": {
                        "start": "0",
                        "end": 1.75,
                        "target": "above-right",
                        "type": "HYBRID",
                        "zoom": 11,
                        "lat": "",
                        "lng": "",
                        "location": "San Francisco",
                        "heading": "",
                        "pitch": 1
                      },
                      "track": "Track0",
                      "name": "TrackEvent1"
                    },
                    {
                      "id": "TrackEvent2",
                      "type": "googlemap",
                      "popcornOptions": {
                        "start": 1.75,
                        "end": 3,
                        "target": "above-right",
                        "type": "HYBRID",
                        "zoom": 12,
                        "lat": "",
                        "lng": "",
                        "location": "Los Angeles",
                        "heading": "",
                        "pitch": 1
                      },
                      "track": "Track0",
                      "name": "TrackEvent2"
                    },
                    {
                      "id": "TrackEvent3",
                      "type": "googlemap",
                      "popcornOptions": {
                        "start": 3,
                        "end": 5,
                        "target": "above-right",
                        "type": "STAMEN-WATERCOLOR",
                        "zoom": 3,
                        "lat": "",
                        "lng": "",
                        "location": "alaska",
                        "heading": "",
                        "pitch": 1
                      },
                      "track": "Track0",
                      "name": "TrackEvent3"
                    },
                    {
                      "id": "TrackEvent8",
                      "type": "googlemap",
                      "popcornOptions": {
                        "start": 35.75,
                        "end": 44.5,
                        "target": "above-right",
                        "type": "ROADMAP",
                        "zoom": 3,
                        "lat": "",
                        "lng": "",
                        "location": "alaska",
                        "heading": "",
                        "pitch": 1
                      },
                      "track": "Track0",
                      "name": "TrackEvent8"
                    },
                    {
                      "id": "TrackEvent10",
                      "type": "googlemap",
                      "popcornOptions": {
                        "start": 5,
                        "end": 14.5,
                        "target": "above-right",
                        "type": "ROADMAP",
                        "zoom": 4,
                        "lat": "37.85750735116863",
                        "lng": "-99.49218787500001",
                        "location": "",
                        "heading": "",
                        "pitch": 1
                      },
                      "track": "Track0",
                      "name": "TrackEvent10"
                    },
                    {
                      "id": "TrackEvent12",
                      "type": "googlemap",
                      "popcornOptions": {
                        "start": 45.5,
                        "end": 55,
                        "target": "above-right",
                        "type": "HYBRID",
                        "zoom": 8,
                        "lat": "",
                        "lng": "",
                        "location": "haiti",
                        "heading": "",
                        "pitch": 1
                      },
                      "track": "Track0",
                      "name": "TrackEvent12"
                    },
                    {
                      "id": "TrackEvent13",
                      "type": "twitter",
                      "popcornOptions": {
                        "start": 56,
                        "end": 60,
                        "target": "above-right",
                        "src": "#earthquakes",
                        "height": "200",
                        "width": "250"
                      },
                      "track": "Track0",
                      "name": "TrackEvent13"
                    },
                    {
                      "id": "TrackEvent14",
                      "type": "text",
                      "popcornOptions": {
                        "start": 25.75,
                        "end": 35.5,
                        "target": "above-right",
                        "text": "<h1><a href=\"http://en.wikipedia.org/wiki/Earthquake_engineering\">Click here to learn about earthquake engineering.</a></h1>",
                        "escape": false,
                        "multiline": false
                      },
                      "track": "Track0",
                      "name": "TrackEvent14"
                    },
                    {
                      "id": "TrackEvent16",
                      "type": "text",
                      "popcornOptions": {
                        "start": 15,
                        "end": 25,
                        "target": "above-right",
                        "text": "<h1><a href=\"http://en.wikipedia.org/wiki/1906_San_Francisco_earthquake\">Click here to learn about the great earthquake of 1906</a>.</h1>",
                        "escape": false,
                        "multiline": false
                      },
                      "track": "Track0",
                      "name": "TrackEvent16"
                    }
                  ]
                },
                {
                  "name": "Track1",
                  "id": "Track1",
                  "trackEvents": [
                    {
                      "id": "TrackEvent17",
                      "type": "image",
                      "popcornOptions": {
                        "start": 15,
                        "end": 25,
                        "target": "above-right",
                        "href": "http://en.wikipedia.org/wiki/File:Post-and-Grant-Avenue.-Look.jpg",
                        "src": "http://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Post-and-Grant-Avenue.-Look.jpg/800px-Post-and-Grant-Avenue.-Look.jpg",
                        "text": ""
                      },
                      "track": "Track1",
                      "name": "TrackEvent17"
                    },
                    {
                      "id": "TrackEvent18",
                      "type": "image",
                      "popcornOptions": {
                        "start": 25.75,
                        "end": 35.5,
                        "target": "above-right",
                        "href": "http://en.wikipedia.org/wiki/File:Snapshot_of_earthquake-like_crash_testing.jpg",
                        "src": "http://upload.wikimedia.org/wikipedia/commons/e/e7/Snapshot_of_earthquake-like_crash_testing.jpg",
                        "text": ""
                      },
                      "track": "Track1",
                      "name": "TrackEvent18"
                    }
                  ]
                }
              ]
            }
          ]
        });

      } //start

      media.onReady( start );
    }
  }); //Butter

}( window.Butter ));