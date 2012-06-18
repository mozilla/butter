// PLUGIN: SPEAK
// SPEAK.JS by @kripken https://github.com/kripken/speak.js

(function ( Popcorn ) {

  /**
   * Popcorn speak: speaks text
   **/
  Popcorn.plugin( "speak", (function(){

    // Share a worker instance across instances to
    // relieve memory pressure.  When speakWorkerRefs
    // goes to 0, we can safely delete the instance.
    var speakWorker,
        speakWorkerRefs = 0;

    // We need to be able to get back to a Popcorn instance
    // after building audio elements async.  We key on
    // our own custom ID, since there isn't one in Popcorn (yet).
    var popcornInstances = {};

    // Seed value for custom ids
    var seed = Date.now();

    // Audio generation
    function parseWav( wav ) {
      function readInt( i, bytes ) {
        var ret = 0,
            shft = 0;

        while ( bytes ) {
          ret += wav[ i ] << shft;
          shft += 8;
          i++;
          bytes--;
        }
        return ret;
      }
      if ( readInt( 20, 2 ) != 1 ) {
        throw 'Invalid compression code, not PCM';
      }
      if ( readInt( 22, 2 ) != 1 ) {
        throw 'Invalid number of channels, not 1';
      }
      return {
        sampleRate: readInt( 24, 4 ),
        bitsPerSample: readInt( 34, 2 ),
        samples: wav.subarray( 44 )
      };
    }

    function generateAudio( wav ) {
      function encode64( data ) {
        var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
            PAD = '=',
            ret = '',
            leftchar = 0,
            leftbits = 0,
            i,
            curr;
        for( i = 0; i < data.length; i++ ) {
          leftchar = ( leftchar << 8 ) | data[ i ];
          leftbits += 8;
          while ( leftbits >= 6 ) {
            curr = ( leftchar >> ( leftbits-6 ) ) & 0x3f;
            leftbits -= 6;
            ret += BASE[ curr ];
          }
        }
        if (leftbits == 2) {
          ret += BASE[ ( leftchar&3 ) << 4 ];
          ret += PAD + PAD;
        } else if ( leftbits === 4 ) {
          ret += BASE[ ( leftchar&0xf ) << 2 ];
          ret += PAD;
        }
        return ret;
      }

      var audio = new Audio();
      audio.src = "data:audio/x-wav;base64," + encode64( wav );
      return audio;
    }

    function handleWav( options, wav ) {
      var startTime = Date.now();
      var data = parseWav( wav );
      options._audio = generateAudio( wav );
    }

    return {
      manifest: {
        about: {
          name: "Popcorn speak Plugin",
          version: "0.1",
          author: "Kate Hudson @k88hudson",
          website: "http://github.com/k88hudson"
        },
        options: {
          start: {
            elem: "input",
            type: "number",
            label: "In"
          },
          end: {
            elem: "input",
            type: "number",
            label: "Out"
          },
          text: {
            elem: "input",
            type: "text",
            label: "Text to speak:",
            "default": "Hello world"
          },
          showText: {
            elem: "input",
            type: "checkbox",
            label: "Show text?"
          },
          amplitude: {
            elem: "input",
            type: "number",
            label: "Amplitude:",
            default: 100
          },
          wordgap: {
            elem: "input",
            type: "number",
            label: "Wordgap:",
            default: 0
          },
          pitch: {
            elem: "input",
            type: "number",
            label: "Pitch:",
            default: 50
          },
          speed: {
            elem: "input",
            type: "number",
            label: "Speed:",
            default: 175
          },
          pluginPath: {
            elem: "input",
            type: "text",
            label: "Plugin path:",
            "default":"../shared/plugins/speak/",
            hidden: true
          }
        }
      },

      _setup: function( options ) {
        var target = options._target = document.getElementById( options.target ),
            speakOptions,
            context = this,
            manifestOptions = options._natives.manifest.options;

        // Force our own id on the Popcorn instance in case the video changes.
        // Filed in Popcorn, not fixed yet.
        if( !context.__id ){
          context.__id = "Popcorn-" + seed++;
        }

        // Force our own id on the options object so we can get it back in the worker.
        options.id = "speak-" + seed++;

        // Cache this Popcorn instance so the worker can get it back
        if( !popcornInstances[ context.__id ] ){
          popcornInstances[ context.__id ] = context;
        }

        if ( !target ) {
          target = document.createElement( "div" );
          target.id = options.target;
          context.media.parentNode.appendChild( target );
        }

        // SPEAK.JS by @kripken https://github.com/kripken/speak.js ---------------------------
        if( !speakWorker ){
          // Created a shared worker instance
          try {
            options.pluginPath = options.pluginPath || "js/plugins/speak/";
            speakWorker = new Worker( options.pluginPath + 'speakWorker.js' );
            speakWorker.onmessage = function( event ){
              // Get Popcorn instance and options instance
              var p = popcornInstances[ event.data.popcornID ],
                  options = p.getTrackEvent( event.data.optionsID );

              // Bail if options object has vanished since this
              // request was originally made to build the speech.
              if( !options ){
                return;
              }

              // Build Audio element and put on options object.
              handleWav( options, event.data.data );
            };
          } catch(e) {
            console.log( 'speak.js warning: no worker support' );
          }
        }

        // Bump instance ref count
        speakWorkerRefs++;

        function speak( text, args, optionsID ) {
          // Call the worker, which will return a wav that we then play
          var startTime = Date.now();
          // Post to the worker, passing data on Popcorn instance and Options object.
          speakWorker.postMessage({
            popcornID: context.__id,
            optionsID: optionsID,
            text: text,
            args: args
          });
        }

        // END SPEAK.JS---------------------------------------

        // Use manifest defaults if none provided
        speakOptions = {
          amplitude: options.amplitude || manifestOptions.amplitude.default,
          wordgap: options.wordgap || manifestOptions.wordgap.default,
          pitch: options.pitch || manifestOptions.pitch.default,
          speed: options.speed || manifestOptions.speed.default,
          target: options.target
        };

        // We have to treat options.text differently, since it is used
        // to generate the wav and audio element.  When the user sets
        // new values on options.text, we need to trigger a rebuild
        // of the audio, so wrap in a getter/setter so we can catch
        // any changes to the options.
        var text = options.text || manifestOptions.text.default;
        delete options.text;
        Object.defineProperty( options, "text", {
          get: function(){
            return text;
          },
          set: function( aText ){
            if( !( aText && typeof aText === "string" ) ){
              return;
            }

            text = aText;

            var speakOptions = {
              amplitude: options.amplitude || manifestOptions.amplitude.default,
              wordgap: options.wordgap || manifestOptions.wordgap.default,
              pitch: options.pitch || manifestOptions.pitch.default,
              speed: options.speed || manifestOptions.speed.default,
              target: options.target
            };

            speak( text, speakOptions, options.id );
          }
        });

        // Generate a default sound for butter.
        speak( options.text, speakOptions, options.id );

        if( options.showText ) {
          options.showTextEl = document.createElement("span");
          options.showTextEl.innerHTML = options.text;
          options.showTextEl.style.display = "none";
          target.appendChild( options.showTextEl );
        }
      },

      start: function( event, options ) {
        if( options._audio ){
          options._audio.play();
        }
        if( options.showTextEl ){
          options.showTextEl.style.display = "block";
        }
      },

      end: function( event, options ) {
        if( options.showTextEl ){
          options.showTextEl.style.display = "none";
        }
      },

      _teardown: function( options ) {
        options._audio = null;

        if( options.showTextEl && options._target ) {
          options._target.removeChild( options.showTextEl );
        }

        // Decrease ref count on shared worker, delete if 0
        if( --speakWorkerRefs === 0 ){
          speakWorker = null;
        }
      }

    };
  }()));
}( Popcorn ));
