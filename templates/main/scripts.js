document.addEventListener( "DOMContentLoaded", function( e ){

  Butter({
    config: "config.json",
    ready: function( butter ){
      var media = butter.media[ 0 ];

      function start(){
        var addPopcorn,
            btns,
            headers;

        media.addTrack( "Track1" );
        media.addTrack( "Track2" );
        media.addTrack( "Track3" );

        // **********************
        // BEGIN EDITING FUNCTONS
        // **********************

        //On load, show the panel.
        setTimeout(function(){
          document.getElementById("addPopcorn").classList.add("active");
          document.getElementById("pop-browser").classList.add("active");
        }, 1000);

        // HIDE/SHOW PANELS ***
        // To show panels by default, add an .active class to them. Clicking the header will
        // toggle active/hidden states.
        addPopcorn = document.getElementById("addPopcorn");
        addPopcorn.addEventListener("click", function(e){
          if ( addPopcorn.parentNode.classList.contains("active") ){
            addPopcorn.classList.remove("active");
            addPopcorn.parentNode.classList.remove("active");
          } else {
            addPopcorn.classList.add("active");
            addPopcorn.parentNode.classList.add("active");
          }
        });
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
        // type defined in the 'data-butter-plugin' attribute. If 'data-butter-default' is defined, a special
        // default set can be added from the manifest (see createDefault).
        // The event is added to the next available track
        // (see findEmptyTrack)
        btns = document.querySelectorAll(".widget-list li:not(:first-child) a");
        (function(btns){
          var i;
          for(i=0;i<btns.length;i++) {
            (function(btn){
              btn.addEventListener("click", function(e){
                var pluginType,
                    defaultType,
                    ct,
                    emptyTrack,
                    defaults,
                    messageEl;

                e.preventDefault();
                pluginType = btn.getAttribute("data-butter-plugin") || "text"; // the plugin name
                defaultType = btn.getAttribute("data-butter-default") || "default";
                ct = butter.currentTime;
                emptyTrack = findEmptyTrack(ct, 1);
                defaults = createDefaults( pluginType, defaultType );
                defaults.start = ct;
                defaults.end = ct + 1;

                butter.tracks[ emptyTrack ].addTrackEvent({
                  type: pluginType,
                  popcornOptions: defaults
                });

                messageEl = document.querySelector(".widget-message");
                messageEl.innerHTML = "<p>" + "you added a " + pluginType + " event to track " + emptyTrack + " </p>";
                messageEl.classList.add("on");
                setTimeout( function(){
                  messageEl.classList.remove("on");
                }, 2000 );

              }, false);
            }(btns[i]));
          }
        }(btns));
        
        // FIND EMPTY TRACK ***
        // Input: start time, duration of new event
        // Output: the index of an empty track in which the new event will fit, or else a new track.
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
             return i; //Return if the track is empty
            }
            for(j=0;j<trackEvents.length;j++) {
              start = +trackEvents[j].popcornOptions.start;
              end = +trackEvents[j].popcornOptions.end;

              if( start <= newStartTime + duration && newStartTime < end ) {
                break;
              } else {
                return i;
              }
            }
          }
          // All tracks had conflicts, gotta make a new one
          media.addTrack( "Track" + Math.random() );
          return trackCount;

        }

        // DEFAULT MANIFEST ***
        // Returns a set of defaults given a plugin type
        function createDefaults( pluginType, defaultType ){
          var _manifest = {
            text: {
              "default": {
                text: "Hello world",
                target: "video-overlay"
              },
              subtitles: {
                text: "This is some subtitles",
                target: "video-overlay"
              }
            },
            zoink: {
              speech: {
                style: "speech",
                text: "This is really cool!",
                width: "200px",
                top: "50%",
                left: "50%",
                target: "video-overlay"
              },
              factfiction: {
                style: "fact",
                text: "This is totally not true",
                width: "200px",
                top: "50%",
                left: "50%",
                target: "video-overlay"
              }
            },
            image2: {
              "default": {
                src: "http://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Persian_Cat_(kitten).jpg/220px-Persian_Cat_(kitten).jpg"
              }
            }
          };
          return _manifest[ pluginType ][ defaultType ];
        }

      } //start

      window.butter = butter;
      media.onReady( start );

      
    }
  }); //Butter
}, false );
