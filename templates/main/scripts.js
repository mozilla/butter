document.addEventListener( "DOMContentLoaded", function( e ){

  Butter({
    config: "config.json",
    ready: function( butter ){
      var media = butter.media[ 0 ];

      function start(){
        media.addTrack( "Track1" );
        media.addTrack( "Track2" );
        media.addTrack( "Track3" );

         butter.tracks[ 1 ].addTrackEvent({
          type: "zoink",
          popcornOptions: {
            start: 0,
            end: 1,
            target: "sidebar",
            text: "floob",
            style: "icon",
            classes: "x",
            top: "50%",
            left: "50%"
          }
        });

        butter.tracks[ 0 ].addTrackEvent({
          type: "zoink",
          popcornOptions: {
            start: 0,
            end: 2,
            target: "sidebar",
            text: "floob",
            style: "thought",
            top: "50%",
            left: "50%"
          }
        });

        butter.tracks[ 0 ].addTrackEvent({
          type: "zoink",
          popcornOptions: {
            start: 2,
            end: 3,
            target: "video-overlay",
            text: "floob",
            style: "speech",
            classes: "fx, top, flip",
            top: "40%",
            left: "90%"
          }
        });

        butter.tracks[ 1 ].addTrackEvent({
          type: "zoink",
          popcornOptions: {
            start: 1,
            end: 2,
            target: "video-overlay",
            text: "Police had few details to share about the incident that took place just before 6:30 p.m. in the mall's newly renovated food court, but were able to confirm the shooter still remained at large.",
            style: "fiction",
            top: "30%",
            left: "40%"
          }
        });

        butter.tracks[ 2 ].addTrackEvent({
          type: "zoink",
          popcornOptions: {
            start: 2,
            end: 3,
            target: "video-overlay",
            text: "<img src=\"http://noillusionspodcast.com/wp-content/woo_custom/14-barack-obama-2.jpg\"> Will create a Homeowner Obligation Made Explicit (HOME) score, which will provide potential borrowers with a simplified, standardized borrower metric (similar to APR) for home mortgages.",
            style: "fact",
            top: "20%",
            left: "40%"
          }
        });

      }

      window.butter = butter;
      media.onReady( start );

      
    } 
  }); //Butter
}, false );
