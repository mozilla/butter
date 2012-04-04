var __project = ({targets:[{id:"Target0", name:"Target0", element:"Area1"}, {id:"Target1", name:"Target1", element:"Area2"}], media:[{id:"Media0", name:"Media0", url:"http://videos.mozilla.org/serv/webmademovies/laylapop.ogv", target:"main", duration:9.916666, tracks:[{name:"Track0", id:"Track0", trackEvents:[{id:"TrackEvent0", type:"text", popcornOptions:{start:0, end:3, text:"test", target:"Area1"}, track:(void 0), name:"TrackEvent0"}]}, {name:"Track1", id:"Track1", trackEvents:[]}, {name:"Track2", id:"Track2", trackEvents:[{id:"TrackEvent1", type:"footnote", popcornOptions:{start:1, end:2, target:"Area2"}, track:(void 0), name:"TrackEvent1"}]}, {name:"Track3", id:"Track3", trackEvents:[]}, {name:"Track4", id:"Track4", trackEvents:[]}]}]});

document.addEventListener( "DOMContentLoaded", function( e ){

  Butter({
    config: "../config/default.conf",
    ready: function( butter ){
      var media = butter.media[ 0 ];

      function start(){
        var track = media.addTrack( "Track1" );
        media.addTrack( "Track" + Math.random() );
        media.addTrack( "Track" + Math.random() );

        var event = track.addTrackEvent({
          type: "text",
          popcornOptions: {
            start: 0,
            end: 3,
            text: "test",
            target: "Area1"
          }
        });

        butter.tracks[ 2 ].addTrackEvent({ 
          type: "footnote",
          popcornOptions: {
            start: 1,
            end: 2,
            target: "Area2"
          }
        });

        var exported = butter.exportProject();
        butter.clearProject();
        butter.importProject( exported );
      }

      media.onReady( start );
      
      window.butter = butter;
    } 
  }); //Butter
}, false );
