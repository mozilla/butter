document.addEventListener( "DOMContentLoaded", function( e ){

  Butter({
    config: "config.json",
    ready: function( butter ){
      var media = butter.media[ 0 ];

      function start(){
        var btns,
            headers;

        media.addTrack( "Track1" );
        media.addTrack( "Track2" );
        media.addTrack( "Track3" );

        butter.tracks[ 1 ].addTrackEvent({
          type: "image2",
          popcornOptions: {
            start: 0,
            end: 2,
            target: "sidebar",
            src: "http://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Persian_Cat_(kitten).jpg/220px-Persian_Cat_(kitten).jpg",
            href: "http://www.google.com"
          }
        });

        butter.tracks[ 2 ].addTrackEvent({
          type: "image2",
          popcornOptions: {
            start: 0,
            end: 2,
            width: "400px",
            height: "200px",
            top: "30px",
            left: "70px",
            target: "video-overlay"
          }
        });

        // **********************
        // BEGIN EDITING FUNCTONS
        // **********************

        // HIDE/SHOW PANELS ***
        headers = document.querySelectorAll(".widget-list li:first-child");
        (function(headers){
          var i;
          for(i=0;i<headers.length;i++) {
            (function(header){
              var list = header.parentNode;
              header.addEventListener("click", function(e){
                e.preventDefault();
                if( list.classList.contains("active") ) {
                  list.classList.remove("active");
                } else {
                  list.classList.add("active");
                }
              }, false);
            }(headers[i]));
          }
        }(headers));
        

        // BUTTONS ***
        // If a link is clicked in the sidebar widget, it adds a track event of the
        // type defined in the 'for' attribute. The event is added to the next available track
        // ( see findEmptyTrack )
        btns = document.querySelectorAll(".widget-list li:not(:first-child) a");
        (function(btns){
          var i;
          for(i=0;i<btns.length;i++) {
            (function(btn){
              btn.addEventListener("click", function(e){
                var pluginType,
                    ct,
                    emptyTrack,
                    defaults;

                e.preventDefault();
                pluginType = btn.getAttribute("for"); // the plugin name
                ct = butter.currentTime;
                emptyTrack = findEmptyTrack(ct, 1);
                defaults = createDefaults( pluginType );
                defaults.start = ct;
                defaults.end = ct + 1;

                emptyTrack.addTrackEvent({
                  type: pluginType,
                  popcornOptions: defaults
                });
                
              }, false);
            }(btns[i]));
          }
        }(btns));
        
        // FIND EMPTY TRACK ***
        // Input: start time, duration of new event
        // Output: an empty track in which the new event will fit, or else a new track.
        function findEmptyTrack( newStartTime, duration ) {
          var trackCount = butter.tracks.length,
              trackEvents,
              i,
              j,
              start,
              end;

          for(i=0;i<trackCount;i++){
            trackEvents = butter.tracks[ i ].trackEvents;
            if( trackEvents.length === 0 ){
             return butter.tracks[ i ]; //Return if the track is empty
            }
            for(j=0;j<trackEvents.length;j++) {
              start = +trackEvents[j].popcornOptions.start;
              end = +trackEvents[j].popcornOptions.end;
              if( (start - newStartTime < duration) || (start < newStartTime && newStartTime > end) ) {
                continue;
              } else {
                return butter.tracks[ i ];
              }
            }
          }
          // All tracks had conflicts, gotta make a new one
          return media.addTrack( "Track" + Math.random() );

        }

        // DEFAULT MANIFEST ***
        // Returns a set of defaults given a plugin type
        function createDefaults( pluginType ){

          var _manifest = {
            text: {
              text: "Hello world"
            },
            image2: {
              src: "http://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Persian_Cat_(kitten).jpg/220px-Persian_Cat_(kitten).jpg"
            }
          };

          return _manifest[ pluginType ];
        }

      } //start

      window.butter = butter;
      media.onReady( start );

      
    } 
  }); //Butter
}, false );
