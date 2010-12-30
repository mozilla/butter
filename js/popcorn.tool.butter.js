(function( window, document, $, _, Popcorn ) { 

  _.mixin({
    //  Capitalize the first letter of the string
    capitalize : function( string ) {
      return string.charAt(0).toUpperCase() + string.substring(1).toLowerCase();
    },
    // Camel-cases a dashed string
    camel: function( string ) {
      return string.replace(/(\-[a-z])/g, function($1){return $1.toUpperCase().replace('-','');});
    },
    //  Create a slug string, ex: 'This is a test' > "this-is-a-test"
    slug: function(str) {
      return str.toLowerCase().match(/[a-z0-9]+/ig).join('-');
    },
    //  Zero pads a number
    pad: function( number ) {
      return ( number < 10 ? '0' : '' ) + number;
    },
    fourth: function( number ) {
      
      return ( Math.round(number * 4) / 4).toFixed(2);
    },
    // Convert an SMPTE timestamp to seconds
    smpteToSeconds: function( smpte ) {
      var t = smpte.split(":");

      if ( t.length === 1 ) {
        return parseFloat(t[0], 10);
      } 

      if (t.length === 2) {
        return parseFloat(t[0], 10) + parseFloat(t[1] / 12, 10);
      } 

      if (t.length === 3) {
        return parseInt(t[0] * 60, 10) + parseFloat(t[1], 10) + parseFloat(t[2] / 12, 10);
      } 

      if (t.length === 4) {
        return parseInt(t[0] * 3600, 10) + parseInt(t[1] * 60, 10) + parseFloat(t[2], 10) + parseFloat(t[3] / 12, 10);
      }
    }
  });

  //  Random key=>val/method maps
  
  
  var formatMaps = {

    currentTime: function( float ) {
      
      
      var mm  = (""+ Math.round(float*100)/100 ).split(".")[1], 
          ss  = ( mm || "" );
      
      // this is awful.
      if ( ss.length === 1 ) {
        ss = ss + "0";
      }
      // this is awful.
      if ( !ss ) {
        ss = "00";
      }
       
      return  _( Math.floor( float / 3600 ) ).pad() + ":" + 
                _( Math.floor( float / 60 ) ).pad() + ":" + 
                  _( Math.floor( float % 60 ) ).pad() + ":" +
                    ( ss === "0" ? "00" : ss );// + float.split(".")[1]/1000
    }, 
    
    mp4: 'video/mp4; codecs="avc1, mp4a"',
    ogv: 'video/ogg; codecs="theora, vorbis"'
  };  
  

  //  Storage object constructor

  function TrackStore( title, desc, remote ) {
    
    this.title = title || null;
    this.description = desc || null;
    this.remote = remote || null;
    this.data = null;

    return this;
  }
  
  TrackStore.properties = [ "title", "description", "remote" ];

  _.each( TrackStore.properties, function ( key ) {

    TrackStore.prototype[ _( key ).capitalize() ] = function( val ) {
      return ( !val && this[ key ] ) || ( this[ key ] = val );
    };

  });

  
  TrackStore.prototype.prepare = function( from ) {
    
    //  `from` references a {$p}.data.trackEvents.byStart object
    var ret = {}, 
        sizeof = _.size( from ),
        iter = 0;
    
    //  Serialize the string properties
    _.each( TrackStore.properties, function( key ) {
      
      ret[ key ] = this[ _( key ).capitalize() ]();
    
    }, this);
    
    
    //  Placeholder for the track event data
    ret[ "data" ] = [];//{ foo: "bar" };
    
    
    
    _.each( from, function( key, val, i ) {
      
      //  Ignore the dummy events at begining and end
      if ( iter > 0 && iter < sizeof - 1 ) {
      
        var event = {}, 
            temp = {},
            plugin = key._natives.type, 
            manifest = key._natives.manifest.options;
        
        
        //console.log(manifest);
        _.each( key, function( prop, eventKey ) {
          
          
          //  ignore internally set properties
          if ( eventKey.indexOf("_") !== 0 && !!prop ) {
            
            temp[ eventKey ] = prop;
            
          }
          
        });
        
        event[ plugin ] = temp;
        
        ret[ "data" ].push( event );
        
      }
      
      iter++;
    });
    
    //  Return prepared data as object
    return ret;
  };
  
  TrackStore.prototype.serialize = function( from ) {
    
    // stringify a prepared track event object
    return JSON.stringify( this.prepare( from ) );
  };
  
  TrackStore.prototype.slug = function() {
    return this.title.toLowerCase().match(/[a-z0-9]+/ig).join('-');
  };

  TrackStore.prototype.parse = function( slug ) {
    return JSON.parse( this.read( slug ) );
  };  

  TrackStore.prototype.create = function( slug, from ) {
    
    //  If slug is not a string, shift the arguments
    !_.isString( slug ) && ( from = slug, slug = this.slug() );
    
    
    var serial = this.serialize( from );
    
    localStorage.setItem( 
      //  Label stored data
      slug,  
      //  Stringified video and track data
      serial
    );
    
    return {
      slug: slug, 
      serial: serial
    };
  };
  
  TrackStore.prototype.read = function( slug ) {
    return localStorage.getItem( slug ) || null;
  };

  TrackStore.prototype.update = function( slug, from ) {
    return this.create( slug, from );
  };  
  
  TrackStore.prototype.delete = function( slug ) {
    return localStorage.removeItem( slug );
  };
  
  //  toArray stored as expando - not instance specific
  TrackStore.toObject = function() {
    var obj = {}, 
        data = localStorage;
    
    for ( var prop in data ) {
      if ( _.isString( prop ) ) {
        obj[ prop ] = new Function( "return " + data[ prop ] )();
      }
    }
    
    return obj;
  };
  
  

  //var foo = new TrackStore( "a title", "a description" );
  //console.log(foo);
  //console.log( foo.Title() );
  //console.log( foo.Description() );
  //console.log( foo.serialize() );


  
  
  $(function( ) { 
    
    var $popcorn, 
        $body = $("body"), 
        $doc = $(document),
        $video = $("video"), 

        $pluginSelectList = $("#ui-plugin-select-list"), 
        $editor = $("#ui-track-event-editor"),
        
        $uitracks = $("#ui-tracks"), 
        $tracks = $("#ui-tracks").children("div.track:not(.zoom)"),
        $tracktime = $("#ui-tracks-time"), 
        $scrubberHandle = $("#ui-scrubber-handle"),
        $currenttime = $("#io-current-time"), 
        $menucontrols = $(".ui-menu-controls"), // change to id?
        
        $videocontrols = $("#ui-video-controls"), 
        $ioVideoUrl = $("#io-video-url"), 
        
        $uservideos = $("#ui-user-videos"),
        
        //$scrubber = $("#ui-scrubber"), 
        //$pluginSelect = $("#ui-plugin-select"), 
        //$addTrackButton = $("#ui-addtrackevent-button"), 
        //$editorPane = $("#ui-event-editor"),

        selectedEvent = null,
        lastSelectedEvent = null, 
        activeTracks = {}, 
        trackStore;
        
        
        
    //  Decorate UI buttons
    $("button,.ui-menu-controls").button();
    
    //  Render accordion panels
    $(".ui-accordion-panel").accordion();
    
    //  Render menusets ( create with: button + ul ) 
    $(".ui-menuset").each( function () {
      
      $(this)
        .next("ul")
          .menu({      

            select: function(event, ui) {
              
              $(this).hide();
              
             //console.log( ui );
            
            },
            input: $(this)      

          })
          .css({
            position: "absolute", 
            zIndex: 999
          })
          .hide();
    
    }).bind( "click", function () {
      
      var $menu = $(this).next("ul");
      
      if ( $menu.is(":visible") ) {
        $menu.hide();
        
        return false;
      }

      $menu.menu("deactivate").show().css({top:0, left:0 }).position({
        my: "left top",
        at: "left bottom",
        of: this
      });
      
      $(document).one("click", function() {
        $menu.hide();
      });
      
      return false;
    
    });
    
    
    
    //  Create my movies list
    
    _.each( TrackStore.toObject() , function( data, prop ) {
      
      var $li = $("<li/>", {
        
        html: '<h4><img class="icon" src="img/dummy.png">' + data.title + '</h4>',
        className: "span-4 select-li clickable"
      
      }).appendTo( "#ui-user-videos" );
      
      
      $li.bind( "click", function( event ) {
        
        var $this = $(this),
            trackEvents = data.data;
        
        
        // TODO: write function that accepts the data object
        
        //    function will:
        
        //    load video from data.remote
        
        //    set $("#oi-video-title").val() with  data.title
        
        //    set $("#oi-video-description").val() with data.description
        
        //    set $("#oi-video-url").val() with data.remote
        
        // AFTER the video is loaded in:
        
        //    a simulation of plugin calls will occur
        
        //    this will rebuild the visual track events on the stage
        
        
        
        // TrackEvents.addTrackEvent.call(this, event);
       
      //console.log(data.data);

      
      });
    
    });
    
    
    //  Storage logic module
    var TrackMeta   = ( function () {
      
      
      
      return {
        
        
    
      
      };
      
    })();
    

    //  Editor logic module
    var TrackEditor = ( function (window) {
      
      
      return {
        
        
        videoReady: function( $p, callback ) {
          
          //  Create an interval to check the readyState of the video
          var onReadyInterval = setInterval(function () {
            
            //  readyState has been satisfied
            if ( $p.video.readyState === 4 ) {
              
              
              //  execute callback if one was given
              callback && callback();
              
              //  clear the interval
              clearInterval( onReadyInterval );
            }

          }, 13);          
        
        
        }, 
        timeLineReady: function( $p, callback ) {
          
          var onReady = _.bind( function () {
            
            //  When ready, draw the timeline
            this.drawTimeLine( $p.duration() );

            //  execute callback if one was given
            callback && callback();

          }, this);
          
          
          //  Ensure the video timeline is ready
          this.videoReady($p,  onReady);
        }, 
        
        loading: function( toggle ) {
          
          
          /*
          if ( toggle ) {
            var $loading = $("<div/>", {

              className: "container", 
              id: "ui-loading ui-widget-overlay",
              html: "<h1>FUCK</h2>"
            }).appendTo("body");
            
            $loading.css({
              zIndex: 999, 
              position: "fixed", 
              left: $(".container").offset().left, 
              top: $(".container").offset().top, 
              background: "#222d3f",  
              opacity: .70, 
              filter: "Alpha(Opacity=70)", 
              height: "100%"
            });
            
            return;
          }
          
          //$("#ui-loading").remove();
          
          */
        }, 
        loadVideoFromUrl: function() {
          
          
          //this.loading( true );
          
          
          
          var url = $ioVideoUrl.val(), 
              tokens = url.split("."), 
              type = tokens[ tokens.length - 1 ], 
              self = this;
          
          //  Remove previously created video sources
          $video.children("source").remove();
          
          //  Create a new source element and append to the video element
          var $source = $("<source/>", {
            
            type: formatMaps[ type ],
            src: url
          
          }).appendTo( "video" );
          
          //  Store the new Popcorn object in the cache reference
          $popcorn = Popcorn("#video");

          //  When new video and timeline are ready
          self.timeLineReady( $popcorn, function () {
            
            self.loading( false );
            
            //  Store refs to timeline canvas    
            var $timeline = $("#ui-tracks-time-canvas"), 
                $track = $(".track"), 
                $plugins = $(".ui-plugin-pane"),
                increment = $timeline.width() / $popcorn.video.duration;
            
            
            
            if ( _.size( activeTracks ) ) {
              activeTracks = {};
            }
            
            //  Check for existing tracks and remove them, do not use cached reference
            if ( $track.length ) {
              $track.remove();
            }
            
            
            //  Check for existing elements inside the plugin panes
            if ( $plugins.children().length ) {
              $plugins.children().remove();
            }
            
            
            //  Listen on timeupdates
            $popcorn.listen( "timeupdate", function () {
              
              
              //  Updates the currenttime display
              $currenttime.val(function () {

                var $this = $(this), 
                    prop = _( this.id.replace("io-", "") ).camel(), 
                    val = $popcorn[ prop ]();

                return  formatMaps[ prop ]( _(val).fourth() ) ;

              });
              
              // //console.log("timeupdate");
              //  Update the scrubber handle position              
              
              
              self.setScrubberPosition(  
                ( increment * $popcorn.video.currentTime ) + $timeline.position().left
              );
              




              

              



            });          
          });
                
        
        },
        
        isScrubbing: false, 
        
        setScrubberPosition: function( position ) {
          
          //  Throttle scrubber position update
          if ( !this.isScrubbing ) {
            
            //  Update the scrubber handle position              
            $scrubberHandle.css({
              left: position - 1
            });
          
          }
        
        }, 
        
        deleteCanvas: function( parent, id ) {
          
          var canvas = document.getElementById(id);
          
          if ( canvas ) {
            document.getElementById(parent).removeChild( canvas );
          }
        
        }, 
        
        drawCanvas: function( parent, id, width, height ) {
          
          var canvas = document.createElement("canvas");
          
          canvas.id = id;
          canvas.width = width;
          canvas.height = height;
          
          document.getElementById(parent).appendChild(canvas);
          
          return canvas;
        }, 
        
        drawTimeLine: function( duration ) {

          this.deleteCanvas( "ui-tracks-time", "ui-tracks-time-canvas" );
          this.drawCanvas( "ui-tracks-time", "ui-tracks-time-canvas", 800, 20 );

          var context = document.getElementById("ui-tracks-time-canvas").getContext('2d'),
              tick = ( ( context.canvas.width-10 ) / duration ), 
              durationFloor = Math.floor(duration), 
              increment = tick/4, 
              offset = 2;

          context.font = "10px courier";
          context.fillStyle = "#000";
          
          for ( var i = 0, t = 0; i < duration * 2; i++ ) {

            if ( i >= 10 ) {
              offset = 6;
            }

            context.lineWidth = 1;
            context.beginPath();

            if ( i%2 || i === 0 ) {
              t++;
              
              if ( t <= durationFloor ) {
                context.fillText( t , t * tick - offset, 7);
              }

              var posOffset = i * tick/2;
              
              //  Secondary ticks
              for ( var f = 0; f < 4; f++ ) {
                context.moveTo( posOffset + ( f * increment ) -1, 15);
                context.lineTo( posOffset + ( f * increment ) -1, 20);                
              }
              

            } else {
              
              // Primary ticks
              context.moveTo( i * tick/2 -1, 10);
              context.lineTo( i * tick/2 -1, 20);
            
            }

            context.stroke();
          }
        }   
      };
      
    })(window);
    
    //  Event editing logic module
    var TrackEvents = ( function (window) {
      
      
      return {
      
        addTrackEvent: function() {

          var $track, lastEventId, trackEvents, trackEvent, settings = {}, 
              trackType = this.id, 
              trackManifest = Popcorn.manifest[ trackType ], 
              startWith = {
                start: 2,
                end: 10
              };


          arguments.length && ( settings = arguments[0] );

          
          //  In case settings is an event object
          if ( settings.currentTarget ) {
            settings  = {};
          }


          //  Compile a starting point
          _.extend( startWith, settings, {

            target: Popcorn.manifest[ trackType ].options.target

          });

          //  Explicitly augment the starting object with all manifest props
          _.forEach( trackManifest.options, function ( obj, key ) {
            if ( !( key in startWith ) ) {
              startWith[ key ] = "";
            }
          });

          
          //  Call the plugin to create an empty track event
          $popcorn[ trackType ]( startWith );

          
          //  Obtain the last registered track event id
          lastEventId = $popcorn.getLastTrackEventId();
          
          
          //  Obtain all current track events
          trackEvents = $popcorn.getTrackEvents();


          //  Capture this track event
          trackEvent = trackEvents[ trackEvents.length - 1 ];

          
          //  Check for existing tracks of this type
          //  If no existing tracks, create them
          if ( !activeTracks[ trackType ] ) {

            //  Draw a new track placeholder
            $track = $("<div/>", {

              "title": trackType, 
              className: "span-21 last track track" + ( $tracks.length + 1 )

            }).prependTo( "#ui-tracks" );

            //  Convert the placeholder into a track, with a track event
            $track.track({
              target: $('#video'),
              duration: $popcorn.video.duration
            });


            $track.prepend('<span class="large track-label large" >' + _( trackType ).capitalize() + '</span>');

            //  Cache the track widget
            activeTracks[ trackType ] = $track;

          } else {

            //  If a track of this type exists
            $track = activeTracks[ trackType ];

          }
          

          $track.track( 'addTrackEvent', {
            inPoint           : startWith.start,
            outPoint          : startWith.end,
            type              : trackType,
            popcornEvent      : trackEvent,
            popcorn           : $popcorn,
            _id               : lastEventId, 
            editEvent         : function() {  

              //console.log("TrackEvent clicked");


              TrackEvents.drawTrackEvents.call(this); 

            }
          });

          $editor.dialog({
            width: "400px",
            //modal: true, 
            autoOpen: false,
            title: 'Edit ' + _( trackType ).capitalize(),
            buttons: {
              //'Delete': editEventDelete,
              'Cancel': TrackEvents.editEventCancel,
              'OK'    : function () {

                TrackEvents.editEventApply.call(trackEvent); 

                $(this).dialog("close");
              },
              'Apply' : TrackEvents.editEventApply
            }
          });        

          $doc.trigger( "addTrackComplete.track" );

        },
        
        
        drawTrackEvents: function() { 



          // THIS FUNCTION IS NOT ACTUALLY EDITTING, BUT CREATING THE EDITOR DIALOG


          try{ $editor.dialog("close"); }
          catch(e ) {  if ( console && console.log ) {  console.log(e); } }

          // `this` will actually refer to the context set when the function is called.
          selectedEvent = this;    


          var manifest    = selectedEvent.popcornEvent._natives.manifest,
              about       = manifest.about,
              aboutTab    = $editor.find(".about"),
              options     = manifest.options,
              optionsTab  = $editor.find(".options"),

              input,
              label
          ;

          //console.log(manifest);

          aboutTab.children("*").remove(); // Rick, not sure if this is good practice here. Any ideas?

          $("<h3/>").text(about.name).appendTo(aboutTab);
          $("<p/>").html("<label>Version:</label> "+about.version).appendTo(aboutTab);
          $("<p/>").html("<label>Author:</label> "+about.author).appendTo(aboutTab);
          $("<a/>").html('<label>Website:</label> <a href="'+about.website+'">'+about.website+'</a>').appendTo(aboutTab);

          optionsTab.children("*").remove(); // Rick, not sure if this is good practice here. Any ideas?

         //console.log(manifest);

          if ( !selectedEvent.manifestElems ) {  
            selectedEvent.manifestElems = {}; 
          }

          if ( !selectedEvent.previousValues ) {  
            selectedEvent.previousValues = {}; 
          }

          for ( var i in options ) { 

            if ( typeof options[i] === "object" ) {

              var opt = options[i],
                  elemType = opt.elem,
                  elemLabel = opt.label, 
                  elem;

              elem = $("<"+elemType+"/>", {
                        className: "text"
                      });


              selectedEvent.manifestElems[i] = elem;

              //if ( lastSelectedEvent != selectedEvent ) { 
                selectedEvent.previousValues[i] = selectedEvent.popcornEvent[i];
              //}

              label = $("<label/>").attr('for', elemLabel).text(elemLabel);   
              
              
              if ( elemType === "input" ) { 
                
                elem.val( selectedEvent.popcornEvent[i] );
              }
              
              if ( elemType === "select" ) {
                
                _.each( opt.options, function( type ) {
                  
                  $("<option/>", {
                    
                    value: type, 
                    text: _( type ).capitalize()
                  
                  }).appendTo( elem );
                
                });
                
              
              }

              elem.appendTo(label);
              label.appendTo(optionsTab);
              

              
            }
          }

          lastSelectedEvent = this;


          $editor.dialog("open");
        },
        
        
        editEventApply: function() { 


          //console.log("selectedEvent", selectedEvent);
          //console.log("selectedEvent.type", selectedEvent.type); // <--- use to call plugin FN

          var popcornEvent = selectedEvent.popcornEvent,
              manifest = popcornEvent._natives.manifest;

          //console.log("manifest", manifest);
          //console.log("popcornEvent", popcornEvent);

          for( var i in manifest.options ) { 
            if ( typeof manifest.options[i] === "object" ) {
              
              var _val = selectedEvent.manifestElems[i].val();
            
              popcornEvent[i] = _val;
              
              
              if ( !!_val && ["start","end"].indexOf(i) === -1 && !isNaN( _val )  ) {
                popcornEvent[i] = +_val;
              }
            }
          }

          //$popcorn.removeTrackEvent( selectedEvent._id );
          //console.log(popcornEvent);
          //TrackEvents.addTrackEvent.call({ id: selectedEvent.type, _id: selectedEvent._id }, popcornEvent);



          //selectedEvent.type

          selectedEvent.inPoint = popcornEvent.start;
          selectedEvent.outPoint = popcornEvent.end;
          
          
          // check for empty stuff
          
          $("#" + selectedEvent.popcornEvent.target).children().each(function () {
            
            if ( $(this).html() === "" ) {
              $(this).remove();
            }
          
          });
          
          //console.log(selectedEvent.popcornEvent._natives._setup(selectedEvent.popcornEvent) );
          
          //  Recall _setup with new data
          selectedEvent.popcornEvent._natives._setup(selectedEvent.popcornEvent)
        
          selectedEvent.parent._draw();


          // TODO:  move out to own function
          // $("#data-view").val( JSON.stringify( $popcorn.data.trackEvents ) );
        }, 
        
        
        editEventCancel: function( ) { 
          var popcornEvent = selectedEvent.popcornEvent;

          for( var i in selectedEvent.previousValues ) { 
            if ( i ) {
              popcornEvent[i] = selectedEvent.previousValues[i];
            }
          }
          selectedEvent.inPoint = popcornEvent.start;
          selectedEvent.outPoint = popcornEvent.end;
          selectedEvent.parent._draw();
          $editor.dialog("close");
        },
        
        
        editEventOK: function() { 
          TrackEvents.editEventApply();
          $editor.dialog("close");
        }
      };
    
    })(window);
    
    
    
    
    $ioVideoUrl.bind( "change", function( event ) {
      
      TrackEditor.loadVideoFromUrl();
    
    }).trigger("change");
    
    
    
    
    
    
    

    // to do: rewire all refs to ._natives.manifest

    $editor.tabs();
    $editor.css({display:"none"});
    
    
    //  Load plugins to ui-plugin-select-list
    _.each( Popcorn.registry, function ( plugin, v ) {
      
      
      // todo: convert to templates
      var $li = $("<li/>", {
        
        id: plugin.type, 
        className: "span-4 select-li clickable",
        html: "<h3><img class='icon' src='img/dummy.png'> " + _( plugin.type ).capitalize() + "</h3>"
        
      }).appendTo( "#ui-plugin-select-list" );      

    });


    $pluginSelectList.delegate( "li", "click", function (event) {

      
      //console.log(this, event);  
      
      TrackEvents.addTrackEvent.call(this, event);

      
    
    });
    

    // this is awful  
    $("#ui-user-videos li, #ui-plugin-select-list li")
      .hover(function () {
        $(this).animate({ backgroundColor: "#ffff7e" }, 200);
      }, 
      function () {
        $(this).animate({ backgroundColor: "#FFFFFF" }, 200);
    });  
    
    
    
    
    $scrubberHandle.draggable({ 
      axis: "x", 
      containment: "#ui-tracks",  
      drag: function (event, ui) {
          
        //console.log($tracktime.position().left);
        
        
        var scrubPosition = ( ui.offset.left + 5 ) - $tracktime.position().left, 
            updateTo = $popcorn.video.duration / $tracktime.width() * scrubPosition, 
            tolerance = ( $popcorn.video.duration / $tracktime.width() ) / 4;
            
        
        $popcorn.currentTime( _( updateTo ).fourth() );
      }
    }).bind( "mousedown mouseup", function( event ) {
      
      TrackEditor.isScrubbing = false;
      
      if ( event.type === "mousedown" ) {
      
        TrackEditor.isScrubbing = true;
        
      }

    });

    
    
    $body.disableSelection();
    $uitracks.disableSelection();
    
    
    $doc.bind( "addTrackComplete.track" , function( event ) {
      
      //console.log("addTrackComplete.track");
      //console.log( event );
      
      $("#ui-scrubber,#ui-scrubber-handle").css({
        height: $uitracks.height()
      });
    });
    

    

    
    
    
    // movie into track editor object, fix redundancies
    
    var seekTo = 0;
    
    var controls = {
      
      load: function () {
      
        TrackEditor.loadVideoFromUrl();
      
      }, 
      save: function () {
        
        // get slug from #io-title
        
        // get remote from #io-video-url
        
        // get title from #io-video-title
        
        // get desc from #io-video-description
        
        
        
        // get trackstore by slug or create new trackstore
        
        
        var store = trackStore || new TrackStore(), 
            title = $("#io-video-title").val(), 
            desc = $("#io-video-description").val(), 
            remote = $("#io-video-url").val(),
            slug;
            
        
        if ( !title ) {
          
         //console.log("error: requires title");
          
          return;
        }
        
        slug = _( title ).slug();
        
        
        store.Title( title );
        store.Description( desc );
        store.Remote( remote );
        
        
        
        //console.log( store );
        
        
        if ( !store.read( slug ) ) {
          
          //console.log("trackstore does not exist, create");
          
          store.create( $popcorn.data.trackEvents.byStart );
          
          //console.log(localStorage);
          
          return;
        }
        
        
        //console.log("trackstore exists, update");
        
        store.update( slug, $popcorn.data.trackEvents.byStart );
        
        
       //console.log( "SAVED: " );
       //console.log(JSON.parse( localStorage.getItem(slug) ));
        
      }, 
      
      play: function () {
        
        $popcorn.video.play();
      }, 
      pause: function () {
        
        $popcorn.video.pause();
      }, 
      seek: function ( option ) {
      
        //var seekTo;
        
        if ( option.indexOf(":") > -1 ) {
          
          var $input = $("#" + ( option.split(":")[1] || "" ) );
          
          seekTo = _( $input.val() ).smpteToSeconds();
        }
        

        if ( option === "first" ) {
          seekTo = 0;
        }

        if ( option === "prev" ) {
          
          //console.log( _($popcorn.video.currentTime).fourth() );
          
          seekTo = _($popcorn.video.currentTime - 0.25).fourth();
        }

        if ( option === "next" ) {
          
          //console.log(_($popcorn.video.currentTime).fourth());
        
          seekTo = _($popcorn.video.currentTime + 0.25).fourth();
        }

        if ( option === "end" ) {
          seekTo = $popcorn.video.duration;
        }        
        
        
        if ( seekTo > $popcorn.video.duration ) {
          seekTo = $popcorn.video.duration;
        }

        if ( seekTo < 0 ) {
          seekTo = 0;
        }        
        
        $popcorn.video.currentTime = seekTo;
        
      }       
    };
    
    

    
    $videocontrols.children("button").bind( "click", function ( event ) {
      
      // was elegant, now its not. needs to be fixed
      var $this = $(this).children("span").children("span");
      
      
      controls[ $this.attr("data-control") ]( $this.attr("data-opt") );

    });
    
    
    $menucontrols.bind( "click", function( event ) {
      
      event.preventDefault();
      
      var $this = $(this);
      
      if ( !!$this.attr("data-control") ) {
        controls[ $this.attr("data-control") ]();
      }
    
    });
    

    //  TODO: Revise
    $currenttime.bind( "keydown", function ( event ) {

      if ( event.which === 13 ) {
        $('#io-current-time').next().trigger("click");          
      }
      
      if ( event.which === 39 ) {
        $('[data-opt="next"]').parents("button").trigger("click");
      }
      
      if ( event.which === 37 ) {
        $('[data-opt="prev"]').parents("button").trigger("click");
      }
      
    });
    
    
    
    
    
    window.$popcorn = $popcorn;
  });

})( this, this.document, this.jQuery, this._, this.Popcorn );
//  Pass ref to jQuery and Underscore.js