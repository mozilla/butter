/*global Butter*/
document.addEventListener( "DOMContentLoaded", function( e ){

  new Butter({
    config: "complete-config.json",
    ready: function( butter ){
      var media = butter.currentMedia;

      function start(){
        media.addTrack();
        media.addTrack();

        butter.tracks[ 0 ].addTrackEvent({
          type: "text",
          popcornOptions: {
            start: 0,
            end: 1,
            text: "test",
            target: "Area1"
          }
        });

        butter.tracks[ 0 ].addTrackEvent({
          type: "text",
          popcornOptions: {
            start: 1,
            end: 2,
            text: "Test",
            target: "Area1"
          }
        });

        butter.tracks[ 1 ].addTrackEvent({
          type: "flickr",
          popcornOptions: {
            start: 3,
            end: 4  ,
            userid: "35034346917@N01",
            numberofimages: 10,
            target: "Area2"
          }
        });

        butter.tracks[ 1 ].addTrackEvent({
          type: "googlefeed",
          popcornOptions: {
            start: 4,
            end: 5,
            url: "http://zenit.senecac.on.ca/~chris.tyler/planet/rss20.xml",
            title: "Planet Feed",
            orientation: "Vertical",
            target: "Area2"
          }
        });

        butter.tracks[ 1 ].addTrackEvent({
          type: "googlemap",
          popcornOptions: {
            start: 5,
            end: 6,
            type: "ROADMAP",
            lat: 43.665429,
            lng: -79.403323,
            target: "Area2"
          }
        });

        butter.tracks[ 1 ].addTrackEvent({
          type: "image",
          popcornOptions: {
            start: 6,
            end: 7,
            src: "https://www.drumbeat.org/media//images/drumbeat-logo-splash.png",
            target: "Area2"
          }
        });

        butter.tracks[ 1 ].addTrackEvent({
          type: "lastfm",
          popcornOptions: {
            start: 7,
            end: 8,
            artist: "yacht",
            apikey: "30ac38340e8be75f9268727cb4526b3d",
            target: "Area2"
          }
        });

        butter.tracks[ 1 ].addTrackEvent({
          type: "linkedin",
          popcornOptions: {
            start: 1,
            end: 2,
            type: "share",
            counter: "right",
            url: "http://www.google.ca",
            apikey: "ZOLRI2rzQS_oaXELpPF0aksxwFFEvoxAFZRLfHjaAhcGPfOX0Ds4snkJpWwKs8gk",
            target: "Area2"
          }
        });

        butter.tracks[ 0 ].addTrackEvent({
          type: "lowerthird",
          popcornOptions: {
            start: 4,
            end: 5,
            salutation: "Mr",
            name: "Hyde",
            role: "Monster"
          }
        });

        butter.tracks[ 0 ].addTrackEvent({
          type: "subtitle",
          popcornOptions: {
            start:2,
            end: 3,
            text: "Hello",
            target: "Media0"
          }
        });

        butter.tracks[ 0 ].addTrackEvent({
          type: "tagthisperson",
          popcornOptions: {
            start:3,
            end: 4,
            person: "Chuck Norris",
            image: "http://aviationhumor.net/wp-content/uploads/2011/02/chuck-norris.jpg",
            target: "Area1"
          }
        });

        butter.tracks[ 0 ].addTrackEvent({
          type: "webpage",
          popcornOptions: {
            start:5,
            end: 6,
            id:"webpages-a",
            src:"http://popcornjs.org/",
            target: "Area1"
          }
        });

        butter.tracks[ 0 ].addTrackEvent({
          type: "wikipedia",
          popcornOptions: {
            start:6,
            end: 7,
            title: "Cape Town yo",
            src:"http://en.wikipedia.org/wiki/Cape_Town",
            target: "Area1"
          }
        });

        butter.tracks[ 0 ].addTrackEvent({
          type: "wordriver",
          popcornOptions: {
            start:7,
            end: 8,
            text: "hello",
            color: "red",
            target: "Area1"
          }
        });

        butter.tracks[ 1 ].addTrackEvent({
          type: "gml",
          popcornOptions: {
            start:0,
            end: 1,
            gmltag: "29582",
            target: "Area2"
          }
        });

      }

      media.onReady( start );

    }
  }); //Butter
}, false );
