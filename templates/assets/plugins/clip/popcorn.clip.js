(function( Popcorn ) {

  var clipData = {
    clips: [],
    skips: []
  };

  Popcorn.plugin( "clip", function() {
    return {
      _setup: function( options ) {
        var allClips = clipData.clips,
            count = 0,
            popcorn = this;

        if ( allClips.length === 0 ) {
          allClips.push( options );
        } else {
          allClips.forEach( function( clip, i ) {
            if ( clip.start < options.start ) {
              allClips.splice( i, 0, options );
            }
          });
        }

        console.log( allClips, "allclips" );

        allClips.forEach( function( clip, i ) {
          var prevClip = allClips[ i - 1 ],
              nextClip = allClips[ i + 1 ];

          if ( !prevClip ) {
            popcorn.skip({
              start: 0,
              end: clip.start
            });
          }
          else if ( nextClip ) {
            popcorn.skip({
              start: clip.end,
              end: nextClip.start
            });
          } else {
            console.log ( "last" );
          }
        });


        options.toString = function() {
          return "Only this section will be played";
        };
      },
      start: function( event, options ) {
      },
      end: function( event, options ) {
        /*
          if ( options.loop ) {
            this.currentTime( options.start );
          } else {
            this.pause();
            this.emit( "ended" );
          }
          */
      },
      _teardown: function( options ) {

      }
    };
  },
  {
    "options": {
      "start": {
        "elem": "input",
        "type": "text",
        "label": "In"
      },
      "end": {
        "elem": "input",
        "type": "text",
        "label": "Out"
      },
      "target": {
        "hidden": true
      },
      "loop": {
        "label": "Loop",
        "type": "checkbox",
        "default": true
      }
    }
  });
}( Popcorn ));
