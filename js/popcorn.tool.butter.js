(function( _ ) { 
  
  //  Mixin any random, misc functions
  
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
      
      return ( Math.ceil(number * 4) / 4).toFixed(2);
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
  
})(_);



(function( window, document, $, _, Popcorn ) { 

  //  TrackStore: Storage object constructor

  function TrackStore( title, desc, remote ) {
    
    this.title = title || null;
    this.description = desc || null;
    this.remote = remote || null;
    this.data = null;

    return this;
  }
  
  TrackStore.properties = [ "title", "description", "remote" ];

  _.each( TrackStore.properties, function( key ) {

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
    ret.data = [];//{ foo: "bar" };
    
    
    //  Iterate current track event data
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
        
        ret.data.push( event );
        
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
    //  !_.isString( slug ) && ( from = slug, slug = this.slug() );
    if ( !_.isString( slug ) ) {
      from = slug;
      slug = this.slug();
    }
    
    
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
  
  //  Utility Functions
  TrackStore.getStorageAsObject = function() {
    var i = -1, 
        len = localStorage.length,
        obj = {};

    while ( ++i < len ) { 
      var key = localStorage.key( i ); 
      
      obj[ key ] = new Function( "return " + localStorage.getItem( key ) )();
    
    }
    return obj;
  };
  
  //  Expose TrackStore as a global constructor  
  window.TrackStore = TrackStore;

})(window, document, $, _, Popcorn);





(function( window, document, $, _, Popcorn ) { 

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
  

  $(function() { 
    
    var $popcorn, 
        $doc = $(document),
        $win = $(window),
        $body = $("body"), 

        $video = $("video"), 

        $pluginSelectList = $("#ui-plugin-select-list"), 
        $uservideoslist = $("#ui-user-videos"), 
        $editor = $("#ui-track-event-editor"),
        
        $trackeditting = $("#ui-track-editting"), 
        $uitracks = $("#ui-tracks"), 
        $tracks = $("#ui-tracks").children("div.track:not(.zoom)"),
        $tracktime = $("#ui-tracks-time"), 
        $scrubberHandle = $("#ui-scrubber-handle"),
        
        $scrubber = $("#ui-scrubber,#ui-scrubber-handle"), 
        
        $menucontrols = $(".ui-menu-controls"), // change to id?
        
        $videocontrols = $("#ui-video-controls"), 
        $uservideos = $("#ui-user-videos"),
        $exporttolist = $("#ui-export-to"), 
        
        //  io- prefix ids map to inputs elements 
        $ioCurrentTime = $("#io-current-time"), 
        $ioVideoUrl = $("#io-video-url"), 
        $ioVideoTitle = $("#io-video-title"),
        $ioVideoDesc = $("#io-video-description"),
        $ioVideoData = $("#io-video-data"), 
        $ioExport = $("#io-export"),
        
        //  -ready suffix class has 2 matching elements
        $loadready = $(".ui-load-ready"),
        $exportready = $(".ui-export-ready"),
        $startready = $(".ui-start-ready"),
        
        //  
        $uiLoadingHtml = $("#ui-loading-html"),
        $uiExportHtml = $("#ui-export-html"),
        $uiStartHtml = $("#ui-start-html"),
        
       
        selectedEvent = null,
        lastSelectedEvent = null, 
        activeTracks = {}, 
        trackStore;
    
    //  Decorate UI buttons
    $("button,.ui-menu-controls").button();
    
    //  Render accordion panels
    $(".ui-accordion-panel").accordion().css("marginTop", "-1px");
    
    //  Render menusets ( create with: button + ul ) 
    $(".ui-menuset").each( function() {
      
      //  Find sibling ul to create menu pane
      $(this)
        .next("ul")
          .menu({      

            select: function(event, ui) {
              
              $(this).hide();
              
            },
            input: $(this)      

          })
          .css({
            position: "absolute", 
            zIndex: 999
          })
          .hide();
    
    }).bind( "click", function() {
      
      var $menu = $(this).next("ul");
      
      
      $(".ui-menuset ~ ul").hide();
      
      
      if ( $menu.is(":visible") ) {
        $menu.hide();
        
        return false;
      }

      $menu.menu("deactivate").show().css({top:0, left:0 }).position({
        my: "left top",
        at: "left bottom",
        of: this
      });
      
      $doc.one( "click", function() {
        $menu.hide();
      });
      
      return false;
    
    });

    
    //  Cache body dimensions
    $body.dims = {
      width: $body.width(),
      height: $body.height(),
    };
    

    //  Varying width listener
    $win.bind( "load resize", function () {

      $body.dims = {
        width: $body.width(),
        height: $body.height(),
      };

      //  Set placement of loading icon
      $uiLoadingHtml.css({
        left: ( $body.dims.width / 2 ) - 64,
        top: ( $body.dims.height / 2 )
      });


      $uiExportHtml.css({
        left: ( $body.dims.width / 2 ) - $uiExportHtml.width() / 2,
        top: ( $body.dims.height / 2 ) - $uiExportHtml.height() / 2
      });

      $uiStartHtml.css({
        left: ( $body.dims.width / 2 ) - $uiStartHtml.width() / 2,
        top: ( $body.dims.height / 2 ) - $uiStartHtml.height() / 2
      });    
    
      $(".ui-menuset ~ ul").hide().css({top:0, left:0 });
    

      $scrubber.css({
        height: $trackeditting.height()
      });
    
    
    });
    
    
    //  Start with overlay scenes hidden
    $exportready.hide();
    $loadready.hide();
    
    //  Uncomment to start with new video prompt scene
    $startready.hide();
        
    
    //  Storage logic module
    var TrackMeta   = ( function() {
      
      return {
      
        project: {
          
          unload: function() {
          
            
            // unload the project
            
            
          },
        
          load: function( tracks, project ) {
        
            // TODO: write function that accepts the data object

            //    function will:

            //    load video from data.remote


            // AFTER the video is loaded in:

            //    a simulation of plugin calls will occur

            //    this will rebuild the visual track events on the stage

            
            $ioVideoUrl.val( project.remote );
            $ioVideoTitle.val( project.title );
            $ioVideoDesc.val( project.description );
            
            TrackEditor.loadVideoFromUrl( function () {
            
              _.each( tracks, function( trackDataObj ) {

                _.each( trackDataObj, function( data, key ) {

                  var options = _.extend( {}, { id: key }, data );  


                  //console.log("options", options);
                  TrackEvents.addTrackEvent.call( options, options );

                });

              });              
            
            });
          }
        }, 
      
        menu: {
        
          unload: function() {
            
            if ( $("#ui-user-videos li").length ) {
              $("#ui-user-videos li").remove();
            }

            //console.log($("#ui-user-videos li"));
          },

          load: function() {
            
            //  Unload current menu state
            this.unload();

            var storedMovies = TrackStore.getStorageAsObject();

            if ( _.size( storedMovies ) > 0 ) {

              _.each( TrackStore.getStorageAsObject() , function( data, prop ) {

                var $li = $("<li/>", {

                  html: '<h4><img class="icon" src="img/dummy.png">' + data.title + '</h4>',
                  className: "span-4 select-li clickable", 
                  "data-slug" : prop

                }).appendTo( "#ui-user-videos" );
                
                
                //console.log(data);
                
                $li.data( "track",  data.data );
                $li.data( "project",  data );

              });        

            } else {

              var $li = $("<li/>", {

                html: '<h4><em class="quiet">Empty</em></h4>',
                className: "span-4"

              }).appendTo( "#ui-user-videos" );          
              
            }
          }        
        }
      };
      
    })();
    
    window.TrackMeta = TrackMeta;
    
    TrackMeta.menu.load();
    
    

    //  Editor logic module
    var TrackEditor = ( function(window) {
      
      
      return {
        
        
        videoReady: function( $p, callback ) {
          
          //  Create an interval to check the readyState of the video
          var onReadyInterval = setInterval(function() {
            
            
            //  readyState has been satisfied, 
            //  4 is preferrable, but FF reports 3
            //  Firefox gotcha: ready does not mean it knows the duration
            if ( $p.video.readyState >= 3 && !isNaN( $p.video.duration )  ) {
            
              //console.log($p.video.currentSrc);
              //console.log("REALLY READY", $p.video.readyState, $p.video.duration);
              
              //  execute callback if one was given
              callback && callback();
              
              //  Allows other unrelated parts of the 
              //  application to react when a video is ready
              $doc.trigger( "videoReady" );
              $doc.trigger( "videoLoadComplete" );
              
              //  clear the interval
              clearInterval( onReadyInterval );
            }

          }, 13);          
        
        
        }, 
        timeLineReady: function( $p, callback ) {
          
          var onReady = _.bind( function() {
            
            //  When ready, draw the timeline
            this.drawTimeLine( $p.video.duration );

            //  execute callback if one was given
            callback && callback();
            
            
            $doc.trigger( "timelineReady" );

          }, this);
          
          
          //  Ensure the video timeline is ready
          this.videoReady($p,  onReady);
        },
        
        loadVideoFromUrl: function( callback ) {
          
          
          $doc.trigger( "videoLoadStart" );
          

          var url = $ioVideoUrl.val(), 
              tokens = url.split("."), 
              type = tokens[ tokens.length - 1 ], 
              self = this;
          
          
          
          //  Remove previously created video sources
          if ( $("video").length ) {
            $("video").remove();
          }
          
          $video = $( "<video/>", {
            
            id: "video"
          
          }).prependTo( "#ui-panel-video" );
          
          
          //  Create a new source element and append to the video element
          var $source = $("<source/>", {
            
            type: formatMaps[ type ],
            src: url
          
          }).prependTo( "#video" );
          
          //  Store the new Popcorn object in the cache reference
          $popcorn = Popcorn("#video");
          
          
          var networkReadyInterval = setInterval( function () {
            
            //  Firefox is an idiot
            if ( $popcorn.video.currentSrc === url ) {
              self.timeLineReady( $popcorn, timeLineReadyFn );
              clearInterval( networkReadyInterval );
            }
            
          }, 13);
          
          
          //  When new video and timeline are ready
          var timeLineReadyFn = function() {
            
            window.$popcorn = $popcorn;
            
            //  Store refs to timeline canvas    
            var $tracktimecanvas = $("#ui-tracks-time-canvas"), 
                $prevTracks = $(".track"), 
                $plugins = $(".ui-plugin-pane"),
                increment = Math.round( $tracktimecanvas.width() / $popcorn.video.duration );
                
            
            //  Empty active track cache
            if ( _.size( activeTracks ) ) {
              activeTracks = {};
            }
            
            
            //  Check for existing tracks and remove them, do not use cached reference
            if ( $prevTracks.length ) {
              $prevTracks.remove();
            }
            
            
            //  Check for existing elements inside the plugin panes
            if ( $plugins.children().length ) {
              $plugins.children().remove();
            }
            
            
            //  Destroy scrubber draggable
            $scrubberHandle.draggable("destroy");
            
            
            //  Create scrubber draggable
            $scrubberHandle.draggable({ 
              axis: "x", 
              containment: "#ui-tracks-time-canvas",  
              grid: [ increment / 8, 0],
              //distance: increment / 4 / 2, 
              start: function() {
                TrackEditor.isScrubbing = true;
              }, 
              stop: function() {
                TrackEditor.isScrubbing = false;
              }, 
              drag: function( event, ui ) {
                
                var scrubPosition = ui.offset.left  - $tracktimecanvas.position().left, 
                    updateTo = $popcorn.video.duration / $tracktimecanvas.width() * scrubPosition, 
                    quarterTime = _( updateTo ).fourth();

                //  Force the time to be in quarters of a second
                $popcorn.currentTime( quarterTime );

                self.setScrubberPosition(  
                  ( increment / 4 * quarterTime ) + $tracktimecanvas.position().left,
                  {
                    increments: increment, 
                    current: quarterTime
                  }
                );                
                
              }
            });
            
            //  Listen on timeupdates
            $popcorn.listen( "timeupdate", function() {
              
              
              //  Updates the currenttime display
              $ioCurrentTime.val(function() {

                var $this = $(this), 
                    prop = _( this.id.replace("io-", "") ).camel(), 
                    val = $popcorn[ prop ]();

                return  formatMaps[ prop ]( _(val).fourth() ) ;

              });
              

              //  Update the scrubber handle position              
              var quarterTime = _( $popcorn.video.currentTime ).fourth();
              
              
              self.setScrubberPosition(  
                ( increment * quarterTime ) + $tracktimecanvas.position().left, 
                {
                  increments: increment, 
                  current: quarterTime
                }
              );
              
            });   
            
            
            //  Trigger timeupdate to initialize the current time display
            $popcorn.trigger( "timeupdate" );
            
            
            //  If a callback was provided, fire now
            callback && callback();
            
          };
                
        
        },
        
        isScrubbing: false, 
        inProgress: false,
        
        setScrubberPosition: function( position ) {
          
          var state, product, offset = 1;
          
          if ( arguments.length === 2 ) {
            state = arguments[1];
            
            //  Scrubber seems to get off position 
            //  every 3rd second in the timeline
            
            product = Math.round( state.current / 3 );
            
            //  If the product is meaningful, we'll use it
            if ( product > 0 ) {
              
              offset += product + product%2  ;
              
            }
            
          }
          
          //console.log(state.increments);
          
          //  Throttle scrubber position update
          if ( !this.isScrubbing ) {
            
            //  Update the scrubber handle position              
            var fixPosition = Math.floor( position - offset );
            
            $scrubberHandle.css({
              left: position - offset
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
          //canvas.style.marginLeft = "3px";
          
          document.getElementById(parent).appendChild(canvas);
          
          return canvas;
        }, 
        
        drawTimeLine: function( duration ) {

          this.deleteCanvas( "ui-tracks-time", "ui-tracks-time-canvas" );
          this.drawCanvas( "ui-tracks-time", "ui-tracks-time-canvas", 830, 25 );
          
          duration = Math.floor( duration );
          
          var context = document.getElementById("ui-tracks-time-canvas").getContext('2d'),
              tick = Math.floor( 830 / duration ), 
              durationCeil = Math.ceil(duration), 
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
              
              if ( t <= durationCeil ) {
                context.fillText( t , t * tick - offset, 9);
              }

              var posOffset = i * tick/2;
              
              //  Secondary ticks
              for ( var f = 0; f < 4; f++ ) {
                context.moveTo( posOffset + ( f * increment ), 20);
                context.lineTo( posOffset + ( f * increment ), 25);                
              }
              

            } else {
              
              // Primary ticks
              context.moveTo( i * tick/2, 10);
              context.lineTo( i * tick/2, 25);
            
            }

            context.stroke();
          }
        }   
      };
      
    })(window);
    
    //  Event editing logic module
    var TrackEvents = ( function(window) {
      
      
      return {
        
        getTrackEventById: function( id ) {
          
          if ( !$popcorn.data ) {
            return {};
          }
          
          var events = Popcorn.getTrackEvents( $popcorn ), 
              ret; 
              
          _.each( events, function( data, key ) {
            
            if ( data._id === id ) {
              ret = data;
              return;
            }
          
          });
          
          return ret;
        
        }, 
        
        destroyTrackEvent: function( $track, $popcorn, id ) {

          //  Remove the track event from the tracks ui cache
          $track.track( 'killTrackEvent', {
            _id: id
          });


          //  Remove the track event from Popcorn cache
          $popcorn.removeTrackEvent( id );

        },
        addTrackEvent: function() {
          
          if ( !$popcorn || !$popcorn.data ) {
            //  TODO: USER ERROR MESSAGE
            return;
          }
          
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
          _.forEach( trackManifest.options, function( obj, key ) {
            if ( !( key in startWith ) ) {
             //console.log("missing");
              startWith[ key ] = "";
            }
          });
          
          //console.log("trackType", trackType);
          //console.log("startWith", startWith);
          
          //  Reset startWith.id, allow Popcorn to create unique IDs
          startWith.id = false;
          
          
          //  Call the plugin to create an empty track event
          $popcorn[ trackType ]( startWith );

          
          //  Obtain the last registered track event id
          lastEventId = $popcorn.getLastTrackEventId();
          
          
          //  Obtain all current track events
          trackEvents = $popcorn.getTrackEvents();
          
          
          //  Capture this track event
          trackEvent = TrackEvents.getTrackEventById(lastEventId)

          
          //  Check for existing tracks of this type
          //  If no existing tracks, create them
          if ( !activeTracks[ trackType ] ) {

            //  Draw a new track placeholder
            $track = $("<div/>", {

              "title": trackType, 
              className: "span-21 last track track" + _.size( activeTracks )

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

          //  TODO: when a track of this type already exists... 
          //  ensure we need to actually make "track" into something
          

          $track.track( 'addTrackEvent', {
            inPoint           : startWith.start,
            outPoint          : startWith.end,
            type              : trackType,
            popcornEvent      : trackEvent,
            popcorn           : $popcorn,
            _id               : lastEventId, 
            editEvent         : function( event ) {  

              //console.log("TrackEvent clicked");
              if ( !event.shiftKey ) {
                
                $editor.dialog({
                  //width: "300px",
                  //position: [ $("#ui-panel-plugins").offset().left, $("#ui-panel-plugins").offset().top ],

                  autoOpen: false,
                  title: 'Edit ' + _( trackType ).capitalize(),

                  buttons: {
                    //'Delete': editEventDelete,
                    'Cancel': TrackEvents.editEventCancel,
                    'OK'    : function() {
                      
                      TrackEvents.editEventApply.call( trackEvent );
                      
                      $(this).dialog("close");
                    },
                    'Apply' : TrackEvents.editEventApply
                  }
                });               

                TrackEvents.drawTrackEvents.call( this ); 
              
              } else {
                
                //  If the shift key was held down when the track event was clicked.
                
                TrackEvents.destroyTrackEvent( $track, $popcorn, lastEventId );

                $doc.trigger( "removeTrackComplete", { type: trackType } );
              
              }
            }
          });

       

          $doc.trigger( "addTrackComplete" );

        },
        

        
        drawTrackEvents: function() { 



          // THIS FUNCTION IS NOT ACTUALLY EDITTING, BUT CREATING THE EDITOR DIALOG


          try{ $editor.dialog("close"); }
          catch(e ) {  if ( console && console.log ) {  console.log(e); } }

          // `this` will actually refer to the context set when the function is called.
          selectedEvent = this;    
          
          
          //console.log(this, selectedEvent);
          
         //console.log( $(selectedEvent.parent.element).attr("title") );
         //console.log(selectedEvent.type);
          

          var manifest    = selectedEvent.popcornEvent._natives.manifest,
              about       = manifest.about,
              aboutTab    = $editor.find(".about"),
              options     = manifest.options,
              optionsTab  = $editor.find(".options"),

              input,
              label
          ;

          //console.log(manifest);

          //aboutTab.children("*").remove(); // Rick, not sure if this is good practice here. Any ideas?

          //$("<h3/>").text(about.name).appendTo(aboutTab);
          //$("<p/>").html("<label>Version:</label> "+about.version).appendTo(aboutTab);
          //$("<p/>").html("<label>Author:</label> "+about.author).appendTo(aboutTab);
          //$("<a/>").html('<label>Website:</label> <a href="'+about.website+'">'+about.website+'</a>').appendTo(aboutTab);

          //optionsTab.children("*").remove(); // Rick, not sure if this is good practice here. Any ideas?

          //console.log(manifest);
         
         
          $("#ui-track-event-editor").children("*").remove();

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

              elem = $( "<" + elemType + "/>", {
                        className: "text"
                      });


              selectedEvent.manifestElems[i] = elem;
              
             //console.log(lastSelectedEvent);
              
              
              if ( _.isNull(lastSelectedEvent) || lastSelectedEvent != selectedEvent ) { 
                selectedEvent.previousValues[i] = selectedEvent.popcornEvent[i];
              }

              label = $("<label/>").attr('for', elemLabel).text(elemLabel);   
              
              
              if ( elemType === "input" ) { 
                
                elem.val( selectedEvent.popcornEvent[i] );
              }
              
              if ( elemType === "select" ) {
                
                _.each( opt.options, function( type ) {
                   
                  $( "<option/>", {
                    
                    value: type, 
                    text: _( type ).capitalize()
                  
                  }).appendTo( elem );
                
                });
                
              
              }

              elem.appendTo(label);
              label.appendTo( "#ui-track-event-editor" );
              
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

          //selectedEvent.type

          selectedEvent.inPoint = popcornEvent.start;
          selectedEvent.outPoint = popcornEvent.end;
          
          
          // check for empty stuff
          
          $("#" + selectedEvent.popcornEvent.target).children().each(function() {
            
            if ( $(this).html() === "" ) {
              $(this).remove();
            }
          
          });
          
          //  Recall _setup with new data
          selectedEvent.popcornEvent._natives._setup( selectedEvent.popcornEvent );
        
          selectedEvent.parent._draw();

          
          $doc.trigger( "videoEditComplete" );
          // TODO:  move out to own function
          // $("#video-data").val( JSON.stringify( $popcorn.data.trackEvents ) );
        }, 
        
        
        editEventCancel: function() { 
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
    
    
    /*
    $ioVideoUrl.bind( "change", function( event ) {
      TrackEditor.loadVideoFromUrl();
    });
    */


    $editor.tabs();
    $editor.css({display:"none"});
    
    
    //  Load plugins to ui-plugin-select-list
    _.each( Popcorn.registry, function( plugin, v ) {
      
      // TODO: convert to templates
      var $li = $("<li/>", {
        
        id: plugin.type, 
        className: "span-4 select-li clickable",
        html: "<h3><img class='icon' src='img/dummy.png'> " + _( plugin.type ).capitalize() + "</h3>"
        
      }).appendTo( "#ui-plugin-select-list" );      

    });



    //  Render Export menu
    _.each( [ "Preview HTML", "Embeddable HTML" ], function ( key ) {
      
      var 
      type = key.split(/\s/)[0].toLowerCase(), 
      $li = $("<li/>", {

        html: '<h4><img class="icon" src="img/dummy.png">' + key + '</h4>',
        className: "span-4 select-li clickable"

      }).appendTo( "#ui-export-to" );

      $li.data( "type",  type );
    });

    
    
    //  THIS IS THE WORST CODE EVER.
    //  TODO: MOVE OUT TO FUNCTION DECLARATION - MAJOR ABSTRACTION
    //  Export options list event
    $exporttolist.delegate( "li", "click", function () {
      
      
      if ( !$popcorn || !$popcorn.data ) {
        //  TODO: USER ERROR MESSAGE
        return;
      }
      
      
      var $this = $(this),
          type = $this.data( "type" ), 
          $exports = $('[data-export="true"]'),
          $html = $exports.filter("div"), 
          $scripts = $exports.filter("script"),
          exports = {
            open: '<!doctype html><html>',
            head: '<head>',
            meta: '<title>'+ $ioVideoTitle.val() +'</title>', 
            css: '<style>body {background:#ffffff}video {width:350px;height: 300px;background: #000;}</style>',
            scripts: '',
            body: '</head><body>',
            html: '', 
            close:'</body></html>'
          }, 
          compile = '', 
          playbackAry = [ '$(function () { ', 'var $p = Popcorn("#video")', '//$p.play();', '});' ],
          compiled = '',
          dims = {
            width: 0,
            height: 0
          };
      
      //  Compile scripts
      $scripts.each(function( iter, script ) {
        exports.scripts += '<script src="' + script.src + '"></script>';
      });
      
      //  Compile html
      $html.each( function( iter, elem ) {
        
        var $this = $(this), 
            $clone = $this.clone(), 
            width = $this.width(), 
            height = $this.height(), 
            $children,
            html = '';
        
        //  Remove unwanted content
        $clone.children("#ui-video-controls,hr").remove();
        
        //  Restore controls        
        if ( $clone.children("video").length ) {
        
          var $videoDiv = $("<div/>", { className: "butter-video-player" } ),
              $videoClone = $clone.children("video").clone();
          
              $videoClone.attr("controls", "controls");
              
          $videoDiv.append( $videoClone );        
              
          $clone.children("video").replaceWith( $videoDiv );
         
         
          //html = $.trim( $clone.html() );
          
          compile += '<div class="butter-video">' + $.trim( $clone.html() ) + '</div>';
        }
        
        
        if ( $clone.children(".ui-plugin-pane").length ) {
          
          $clone.children(".ui-plugin-pane").each(function () {

            $(this).attr("class", "butter-plugin").removeAttr("style").children().remove();
          });
          
          compile += '<div class="butter-plugins">' + $.trim( $clone.html() ) + '</div>';
        }
        
      });
      
      
      var tempStore = new TrackStore(), 
          serialized = tempStore.serialize( $popcorn.data.trackEvents.byStart ), 
          deserial = JSON.parse( serialized ), 
          methods = [];

      //  Build playback JS string
      _.each( deserial.data, function( obj, key ) {
        _.each( obj, function( data, dataKey ) {
          var dataObj = _.extend( {}, { id: dataKey }, data ), 
              temp = {};

          //  Check each value and fix numbers          
          _.each( dataObj, function( subVal, subKey ) {
            temp[ subKey ] = !isNaN( +subVal ) ? +subVal : subVal;
          });
          
          methods.push( dataKey + "(" + JSON.stringify( temp ) + ")" );
        });
      });
      
      //  Attach playback string commands
      playbackAry[ 1 ] += "." + methods.join(".") + ";";
      
      //  Wrap playback script export
      exports.scripts += '\n<script>' + playbackAry.join('\n') + '</script>';
      
      //  Wrap html export
      //  TODO: inject theme ID HERE
      exports.html = '<div class="butter-player">' + compile + '</div>';
      
      
      //  Compile all `exports`
      _.each( exports, function ( fragment, key) {
        compiled += fragment;
      });
      
      //  Render embedded html fragmant output
      if ( type === "embeddable" ) {
        
        if ( !$("#io-export").length ) {
          
          $ioExport = $("<textarea/>").width($("#ui-preview-frame").width()).height($("#ui-preview-frame").height());
        
          $("#ui-preview-frame").replaceWith( $ioExport );
        }
      
        $ioExport.val( compiled );
      } 
      
      //  Render preview frame
      if ( type === "preview" ) {
      
        var $iframe = $("<iframe/>", { id: "ui-preview-frame" }).width($ioExport.width()).height($ioExport.height());

        $ioExport.replaceWith($iframe);

        var iframe = $("#ui-preview-frame")[0],
            iframeDoc = ( iframe.contentWindow ) ? 
                            iframe.contentWindow : 
                            (iframe.contentDocument.document) ? 
                              iframe.contentDocument.document : 
                                iframe.contentDocument;

        iframeDoc.document.open();
        iframeDoc.document.write(compiled);
        iframeDoc.document.close();        
      }
      
      $doc.trigger( "exportReady" );
    });
    
    
    // ^^^^^^^^^^^^^^^^^^^ THIS IS THE WORST CODE EVER.
    
    
    
    
    //  Plugin list event
    $pluginSelectList.delegate( "li", "click", function( event ) {

      TrackEvents.addTrackEvent.call(this, event);

    });
    
    
    //  User video list event
    $uservideoslist.delegate( "li", "click", function( event ) {
      
      var $this = $(this),
          trackEvents = $this.data( "track" ), 
          projectData = $this.data( "project" );

      if ( projectData ) {
        TrackMeta.project.load( trackEvents, projectData );
      }
    });
    

    // this is awful  
    $("#ui-export-to li, #ui-user-videos li, #ui-plugin-select-list li")
      .hover(function() {
        $(this).animate({ backgroundColor: "#ffff7e" }, 200);
      }, 
      function() {
        $(this).animate({ backgroundColor: "#FFFFFF" }, 200);
    });  
    
    
    //  When the window is resized, fire a timeupdate 
    //  to reset the scrubber position
    $win.bind( "resize", function( event ) {
      $popcorn.trigger( "timeupdate" );
    });
    
    
    //  Updating the scrubber height - DEPRECATE.
    $doc.bind( "addTrackComplete" , function( event ) {

      $scrubber.css({
        height: $trackeditting.height()
      });
    });
    
    
    $doc.bind( "removeTrackComplete", function( event, data ) {
      
      var events = Popcorn.getTrackEvents( $popcorn ), 
          type = data.type, 
          count = 0, 
          ret; 

      _.each( events, function( data, key ) {
        if ( data._id.indexOf( type ) === 0 ) {
          count++;
          return;
        }
      });
      
      if ( !count ) {
        $('div[title="'+type+'"]').remove();
        
        delete activeTracks[ type ];
      }
      
    });
    
    

    //  Updating the scrubber height
    $doc.bind( "timelineReady videoReady", function( event ) {
      $scrubber.css({
        height: $trackeditting.height()
      });        
    });
    

    //  Toggling the loading progress screen
    $doc.bind( "videoLoadStart videoLoadComplete", function( event ) {
      
      if ( event.type === "videoLoadStart" ) {
        $loadready.show();
        return;
      }
      
      $loadready.hide();
    
    });

    
    //  Show export screen
    $doc.bind( "exportReady", function() {
      
      $exportready.show();
    
    });
    
    
    //  Update data view textarea
    $doc.bind( "videoEditComplete addTrackComplete", function() {
      
      var tempStore = new TrackStore();
      
      $ioVideoData.val( tempStore.serialize( $popcorn.data.trackEvents.byStart ) );
      
      
      controls.seek( "first" );
      
    });
    
    

    //  Keylistener for track delete    
    $doc.bind( "videoEditComplete addTrackComplete", function() {
      
      var tempStore = new TrackStore();
      
      $ioVideoData.val( tempStore.serialize( $popcorn.data.trackEvents.byStart ) );
      
      
      controls.seek( "first" );
      
    });    
    
    
    //  Close export screen
    $("#ui-export-over").click(function() {
      $exportready.hide();
    });    

    
    
    
    // movie into track editor object, fix redundancies
    
    var seekTo = 0, volumeTo = 0;
    
    var controls = {
      
      load: function() {
        
        seekTo = 0;
        volumeTo = 0;
        
        
        //  TODO: update to validate as url;
        if ( !!$ioVideoUrl.val() ) {
          TrackEditor.loadVideoFromUrl();
        }
      
      }, 
      
      delete: function() {
        
        //console.log(trackStore);
        
        alert("NOT IMPLEMENTED")
      
      }, 
      
      save: function() {
        
        if ( !$popcorn || !$popcorn.data ) {
          //  TODO: USER ERROR MESSAGE
          return;
        }        
        
        var store = trackStore || new TrackStore(), 
            title = $ioVideoTitle.val(), 
            desc = $ioVideoDesc.val(), 
            remote = $ioVideoUrl.val(),
            slug;
            
        
        if ( !title ) {
          //  TODO: USER ERROR MESSAGE
          return;
        }
        
        
        slug = _( title ).slug();
        
        
        store.Title( title );
        store.Description( desc );
        store.Remote( remote );
        
        
        
        if ( !store.read( slug ) ) {
          
          store.create( $popcorn.data.trackEvents.byStart );
          
        } else {
        
          store.update( slug, $popcorn.data.trackEvents.byStart );
        
        }
        
        //trackStore  = 
        
        TrackMeta.menu.load();
        
        
        $("#ui-user-videos li[data-slug='"+ slug +"']").trigger( "click" );
        
        
      }, 
      
      play: function() {
        
        $popcorn.video.play();
      }, 

      pause: function() {
        
        $popcorn.video.pause();
      }, 

      volume: function( option ) {
        

        if ( option === "up" ) {
          volumeTo = $popcorn.video.volume + 0.1;
        }
        
        if ( option === "down" ) {
          volumeTo = $popcorn.video.volume - 0.1;
        }
        
        $popcorn.video.volume = volumeTo;
        
      },
      seek: function( option ) {
      
        if ( option.indexOf(":") > -1 ) {
          
          var $input = $("#" + ( option.split(":")[1] || "" ) );
          
          seekTo = _( $input.val() ).smpteToSeconds();
        }
        
        //  TODO: DRY out
        
        if ( option === "first" ) {
          seekTo = 0;
        }

        if ( option === "prev" ) {
          
          seekTo = _($popcorn.video.currentTime - 0.25).fourth();
        }

        if ( option === "next" ) {
          
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
    
    

    $menucontrols.bind( "click", function( event ) {
      
      event.preventDefault();
      
      var $this = $(this);
      
      if ( !!$this.attr("data-control") ) {
        controls[ $this.attr("data-control") ]();
      }
    
    });

    $videocontrols.children("button").bind( "click", function( event ) {
      
      // was elegant, now its not. needs to be fixed
      var $this = $(this).children("span").children("span");
      
      controls[ $this.attr("data-control") ]( $this.attr("data-opt") );

    });    

    //  TODO: Revise
    $ioCurrentTime.bind( "keydown", function( event ) {
      
      //  Enter
      if ( event.which === 13 ) {
        $('#io-current-time').next().trigger("click");          
      }
      
      
      //  Arrow right
      if ( event.which === 39 ) {
        $('[data-opt="next"]').parents("button").trigger("click");
      }
      
      
      //  Arrow left
      if ( event.which === 37 ) {
        $('[data-opt="prev"]').parents("button").trigger("click");
      }
      
    });
    
    
    window.$popcorn = $popcorn;
  });

})( this, this.document, this.jQuery, this._, this.Popcorn );
//  Pass ref to jQuery and Underscore.js