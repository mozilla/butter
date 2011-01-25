/*
 * Butter Application butter.application.js
 * Version 0.1.0
 *
 * Developed by Bocoup on behalf of the Mozilla Foundation
 * Copyright (c) 2011 Bocoup, LLC
 * Authors: Rick Waldron, Alistair McDonald, Boaz Sender
 * Dual licensed under the MIT and GPL licenses.
 * http://code.bocoup.com/license/
 *
 */

(function( global, _ ) { 
  
  //  Mixin any random, misc functions
  
  var parseFloat = global.parseFloat, 
      parseInt = global.parseInt;
  
  
  _.mixin({
    //  Capitalize the first letter of the string
    capitalize : function( string ) {
      return string.charAt(0).toUpperCase() + string.substring(1).toLowerCase();
    },
    // Camel-cases a dashed string
    camel: function( string ) {
      return string.replace(/(\-[a-z])/g, function($1){return $1.toUpperCase().replace("-","");});
    },
    //  Create a slug string, ex: "This is a test" > "this-is-a-test"
    slug: function(str) {
      return str.toLowerCase().match(/[a-z0-9]+/ig).join("-");
    },
    //  Zero pads a number
    pad: function( number ) {
      return ( number < 10 ? "0" : "" ) + number;
    },
    fract: function( number, fract ) {
      return ( Math.round(number * fract) / fract );
    },
    //  
    fourth: function( number ) {
      return _( number ).fract( 4 );
    },
    // Convert an SMPTE timestamp to seconds
    smpteToSeconds: function( smpte ) {
      var t = smpte.split(":");

      if ( t.length === 1 ) {
        return parseFloat( t[0], 10 );
      } 

      if (t.length === 2) {
        return parseFloat( t[0], 10 ) + parseFloat( t[1] / 12, 10 );
      } 

      if (t.length === 3) {
        return parseInt( t[0] * 60, 10 ) + parseFloat( t[1], 10 ) + parseFloat( t[2] / 12, 10 );
      } 

      if (t.length === 4) {
        return parseInt( t[0] * 3600, 10 ) + parseInt( t[1] * 60, 10 ) + parseFloat( t[2], 10 ) + parseFloat( t[3] / 12, 10 );
      }
    }, 
    secondsToSMPTE: function( time ) {

      var timeStamp = new Date( 1970,0,1 ), 
          seconds;

      timeStamp.setSeconds( time );

      seconds = timeStamp.toTimeString().substr( 0, 8 );

      if ( seconds > 86399 )  {

        seconds = Math.floor( (timeStamp - Date.parse("1/1/70") ) / 3600000) + seconds.substr(2);

      }
      return seconds;
    }
  });
  
})( window, _);



(function( global, document, $, _, Popcorn ) { 

  //  TrackStore: Storage object constructor

  function TrackStore( title, desc, remote, theme, layout ) {
    
    this.title = title || null;
    this.description = desc || null;
    this.remote = remote || null;
    this.theme = theme || null;
    this.layout = layout || null;
    this.data = null;

    return this;
  }
  
  TrackStore.properties = [ "title", "description", "remote", "theme", "layout" ];


  //  Property getter/setter factory
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
    return ( this.title || "" ).toLowerCase().match(/[a-z0-9]+/ig).join("-");
  };

  TrackStore.prototype.create = function( slug, from ) {
    
    //  If slug is not a string, shift the arguments
    //  !_.isString( slug ) && ( from = slug, slug = this.slug() );
    if ( !_.isString( slug ) ) {
      from = slug;
      slug = this.slug();
    }
    
    var prepared = this.prepare( from ), 
        stored = TrackStore.getStorageAsObject( TrackStore.NS ),
        projects = {
          projects: {}
        }, 
        entry = {};
    
    
    //  Create new storage entry    
    entry[ slug ] = prepared;
    

    //  Rebuild storage object
    _.extend( projects.projects, stored.projects, entry );
    
    
    localStorage.setItem( 
      //  Namespace stored data
      TrackStore.NS,  
      //  Stringified video and track data
      JSON.stringify( projects )
    );
    
    return {
      slug: slug, 
      serial: JSON.stringify( prepared )
    };
  };
  
  TrackStore.prototype.read = function( slug ) {
    //var stored = TrackStore.getStorageAsObject();
    //  NOT IMPLEMENTED
    return false;
  };

  TrackStore.prototype.update = function( slug, from ) {
    return this.create( slug, from );
  };  
  
  TrackStore.prototype.remove = function( slug, callback ) {
    
    var stored = TrackStore.getStorageAsObject();
    
    if ( stored.projects[ slug ] ) {
      
      delete stored.projects[ slug ];
    
    }        

    localStorage.setItem( 
      //  Namespace stored data
      TrackStore.NS,  
      //  Stringified video and track data
      JSON.stringify( stored )
    );
    
    
    callback && callback.call( null, stored );
    
  };
  
  //  Utility Functions
  TrackStore.deleteProject = function( id ) {
    
    
  
  
  };
  
  TrackStore.getStorageAsObject = function( prop ) {
    
    prop = prop || TrackStore.NS;
    
    if ( !prop ) {
      //throw msg;
      return false;
    }

    var storedStr = localStorage.getItem( prop ),
        storedObj = new Function( "return " + storedStr )();
        
    if ( !!storedStr ) {
      return storedObj || null;
    }

    return {};
  };
  
  TrackStore.getStorageByProperty = function( prop ) {
  
    var storage = TrackStore.getStorageAsObject( TrackStore.NS );
    
    return ( storage && storage[ prop ] ) || null;
  };
  
  TrackStore.NS = null;

  
  //  Expose TrackStore as a global constructor  
  global.TrackStore = TrackStore;

})(window, document, $, _, Popcorn);





(function( global, document, $, _, Popcorn ) { 

  //  Random key=>val/method maps
  
  //  TODO: refactor for reusability.
  //  Setup data store
  if ( !localStorage.getItem( "Butter" ) ) {
    //console.log("reset");
    //  Initialize Butter storage
    localStorage.setItem( "Butter", "" );
  }
  
  //  Initialize TrackStore.NS (namespace)
  TrackStore.NS = "Butter";
  
  
  
  var formatMaps = {

    currentTime: function( time ) {
      
      
      var mm  = (""+ Math.round(time*100)/100 ).split(".")[1], 
          ss  = ( mm || "" );
      
      // this is awful.
      if ( ss.length === 1 ) {
        ss = ss + "0";
      }
      // this is awful.
      if ( !ss ) {
        ss = "00";
      }
       
      return  _( Math.floor( time / 3600 ) ).pad() + ":" + 
                _( Math.floor( time / 60 ) ).pad() + ":" + 
                  _( Math.floor( time % 60 ) ).pad() + ":" +
                    ( ss === "0" ? "00" : ss );
    }, 
    
    mp4: 'video/mp4; codecs="avc1, mp4a"',
    ogv: 'video/ogg; codecs="theora, vorbis"', 
    mov: 'video/mp4', 
    m4v: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"', 
    
    
    
    accepts: [ ".ogv", ".mp4", ".mov", ".webm", ".m4v" ]
  }, 
  
  //  Cached global methods
  setInterval = global.setInterval, 
  setTimeout = global.setTimeout,
  clearInterval = global.clearInterval, 
  clearTimeout = global.clearTimeout;  
  
  
  //  DOM ready block
  $(function() { 
    
    var $popcorn, 
        $doc = $(document),
        $win = $(global),
        $body = $("body"), 

        $video = $("video"), 
        $source = $("source"),
        
        $pluginSelectList = $("#ui-plugin-select-list"), 
        $editor = $("#ui-track-event-editor"),
        
        $trackeditting = $("#ui-track-editting"), 
        $uitracks = $("#ui-tracks"), 
        $tracktime = $("#ui-tracks-time"), 
        $scrubberHandle = $("#ui-scrubber-handle"),
        $scrubber = $("#ui-scrubber,#ui-scrubber-handle"), 
        
        $menucontrols = $(".ui-menu-controls"), // change to id?
        $videocontrols = $("#ui-video-controls"), 
        
        $themelist = $("#ui-theme"), 
        $layoutlist = $("#ui-layout"), 
        $exporttolist = $("#ui-export-to"), 
        
        //  io- prefix ids map to inputs elements 
        $ioCurrentTime = $("#io-current-time"), 
        $ioVideoUrl = $("#io-video-url"), 
        $ioVideoTitle = $("#io-video-title"),
        $ioVideoDesc = $("#io-video-description"),
        $ioVideoData = $("#io-video-data"), 
        
        //  -ready suffix class has 2 matching elements
        $loadready = $(".ui-load-ready"),

        
        //  
        $uiLoadingHtml = $("#ui-loading-html"),
        $uiStartScreen = $("#ui-start-screen"), 
        
        $uiApplicationMsg = $("#ui-application-error"), 
        
        
        selectedEvent = null,
        lastSelectedEvent = null, 
        activeTracks = {}, 
        trackStore, 
        
        
        // Modules
        TrackEditor, 
        TrackMeta, 
        TrackEvents, 
        TrackExport;
        
        
    
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
      height: $body.height()
    };
    

    //  Varying width listener
    $win.bind( "load resize", function () {

      $body.dims = {
        width: $body.width(),
        height: $body.height()
      };

      //  Set placement of loading icon
      $uiLoadingHtml.css({
        left: ( $body.dims.width / 2 ) - 64,
        top: ( $body.dims.height / 2 ) - 120,
        width: 130
      });


      $(".ui-menuset ~ ul").hide().css({top:0, left:0 });
    

      TrackEditor.setScrubberHeight();
    
    
    });
    
    
    //  Start with overlay scenes hidden
    $loadready.hide();
    
    
    //  Storage logic module
    TrackMeta   = ( function() {
      
      return {
      
        project: {
          
          unload: function() {
          
            
            // unload the project
            
            
          },
        
          load: function( tracks, project ) {
          
         //console.log(project);
        
            $ioVideoUrl.val( project.remote );

            $layoutlist
                .children()
                .removeClass( "active" )
                .each( function( index, elem ) {
                  var $elem = $( elem );
                  if ( $elem.text().replace(/\s/g, "").toLowerCase() === project.layout ){
                    $elem.addClass( "active" );
                    $layoutlist.attr( "data-layout", project.layout );
                  }
                });

            $themelist
              .children()
              .removeClass( "active" )
              .each( function( index, elem ) {
                var $elem = $( elem );
                if ( $elem.text().replace(/\s/g, '').toLowerCase() === project.theme ){
                  $elem.addClass( "active" );
                  $themelist.attr( "data-theme", project.theme );
                }
              });
            
            TrackEditor.loadVideoFromUrl( function () {
            
              _.each( tracks, function( trackDataObj ) {

                _.each( trackDataObj, function( data, key ) {

                  var options = _.extend( {}, { id: key }, data );  
                  
                  TrackEvents.addTrackEvent.call( options, options );

                });

              });
              
              
              //  Load meta data
              $ioVideoTitle.val( project.title );
              $ioVideoDesc.val( project.description );
              
            
            });
          }
        }, 
      
        menu: {
        
          unload: function( selector ) {
            
            var $list = $( selector + " li");
            
            if ( $list.length ) {
              $list.remove();
            }
          },

          load: function( selector ) {
            
            //  Unload current menu state
            this.unload( selector );

            var stored = TrackStore.getStorageAsObject( TrackStore.NS ),
                projects = stored.projects || false, 
                $li;
                
                
           //console.log(projects);
                
            
            if ( projects ) {

              _.each( projects, function( data, prop ) {

                $li = $("<li/>", {

                  html: '<h4><img class="icon" src="img/dummy.png">' + data.title + '</h4>',
                  className: "select-li clickable", 
                  "data-slug" : prop

                }).appendTo( selector );
                
                
                //  Store track and project data for later access
                $li.data( "track",  data.data );
                $li.data( "project",  data );

              });

            } else {

              $li = $("<li/>", {
                html: '<h4><em class="quiet">You have no saved movies</em></h4>'
              }).appendTo( selector );          
              
            }
          }        
        }
      };
      
    })();
    
    global.TrackMeta = TrackMeta;
    
    
    TrackMeta.menu.load( "#ui-user-videos" );
    
    
    //  #8043415 
    TrackMeta.menu.load( "#ui-start-screen-list" );
    
    
    //  TrackEditor Module - define
    
    TrackEditor = ( function(global) {
      
      return {
      
        timeLineWidth: 0, 
        increment: 0, 
        isScrubbing: false, 
        inProgress: false,
        
        videoReady: function( $p, callback ) {
          
          //  Create an interval to check the readyState of the video
          var onReadyInterval = setInterval(function() {
            
            //  readyState has been satisfied, 
            //  4 is preferrable, but FF reports 3
            //  Firefox gotcha: ready does not mean it knows the duration
            if ( $p.video.readyState >= 3 && !isNaN( $p.video.duration )  ) {

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
        
        unload: {
          
          video: function() {
          
            //  Remove previously created video sources
            if ( $("video").length ) {
              $("video").remove();
            }

            $video = $( "<video/>", {

              id: "video"

            }).prependTo( "#ui-panel-video" );          
          
          }, 
          
          workspace: function() {
          
          }, 
          
          timescale: function() {
            TrackEditor.deleteCanvas( "ui-tracks-time", "ui-tracks-time-canvas" );            
          }
        
        
        }, 
        
        loadVideoFromUrl: function( callback ) {
          
          
          $doc.trigger( "videoLoadStart" );
          

          var url = $ioVideoUrl.val(), 
              tokens = url.split("."), 
              type = tokens[ tokens.length - 1 ], 
              self = this, 
              
              
              
              //  Ready state
              netReadyInt, 
              timelineReadyFn;
          
          
          this.unload.video();

          
          //  Create a new source element and append to the video element
          $source = $("<source/>", {
            
            //type: formatMaps[ type ],
            src: url
          
          }).prependTo( "#video" );
          
          //  Store the new Popcorn object in the cache reference
          $popcorn = Popcorn("#video");
          
          //  Ensure that the network is ready
          netReadyInt = setInterval( function () {
            
           
            //  Firefox is an idiot
            if ( $popcorn.video.currentSrc === url ) {
           
              self.timeLineReady( $popcorn, timelineReadyFn );
              clearInterval( netReadyInt );
           
            }
            
          }, 13);
          
          
          //  When new video and timeline are ready
          timelineReadyFn = function() {
            
            global.$popcorn = $popcorn;
            
            //  Store refs to timeline canvas    
            var $tracktimecanvas = $("#ui-tracks-time-canvas"), 
                $prevTracks = $(".track"), 
                $plugins = $(".ui-plugin-pane"),
                increment = Math.round( $tracktimecanvas.width() / $popcorn.video.duration );
                
            
            $ioVideoTitle.val("");
            $ioVideoDesc.val("");
            
            
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
            
              scroll: true, 
              scrollSensitivity: 50, 
              scrollSpeed: 200, 
              
              
              axis: "x", 
              containment: "#ui-track-editting",  
              
              grid: [ increment / 8, 0 ],
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
                $popcorn.video.currentTime = quarterTime;
                
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
              var quarterTime = _( $popcorn.video.currentTime ).fourth(), 
              //  Create ready state check interval              
              isReadyInterval = setInterval(function() {
                
                //console.log( "$tracktimecanvas.position().left", $tracktimecanvas.position().left);
                //console.log("$uitracks.position().left", $uitracks.position().left);
                
                if ( $popcorn.video.readyState >= 3 ) {

                  self.setScrubberPosition(  
                    ( increment * quarterTime ) + $tracktimecanvas.position().left, 
                    {
                      increments: increment, 
                      current: quarterTime
                    }
                  );                
                  
                  //  #8402231
                  if ( $scrubberHandle.position().left >= $uitracks.position().left + $uitracks.width() ) {
                    //$uitracks.scrollLeft( $tracktimecanvas.width() ); //stable
                    
                    $uitracks.animate({
                      scrollLeft: "+=" + $tracktimecanvas.width()
                    }, "slow");
                  }
                  

                  TrackEditor.inProgress = false;
                  clearInterval( isReadyInterval );
                }

              }, 13);
              

              
              $doc.trigger( "seekComplete", {
                type: "update", 
                time: quarterTime, 
                increment: increment, 
                special: function () {
                 //console.log("special function");
                }
              });
              
            });   
            
            
            //  Trigger timeupdate to initialize the current time display
            $popcorn.trigger( "timeupdate" );
            
            
            //  If a callback was provided, fire now
            callback && callback();
            
          };

        },
        
        isScrubberWithin: function( trackEvent ) {          
          
          var realLeft = ( $scrubberHandle.position().left - $trackeditting.position().left ) - 1, 
              sIncrement = TrackEditor.increment * 4,
              posInTime = realLeft / sIncrement;
              
          
          return ( posInTime >= trackEvent.start && 
                    posInTime <= trackEvent.end );

        },
        
        setScrubberHeight: function( height ) {
          
          $scrubber.css({
            height: height || ( $trackeditting.height() - 20 ) 
          });        
        
        },
        
        setScrubberPosition: function( position ) {
          
          var offset = 1, fixPosition, state, product;
          
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
          

          //  Throttle scrubber position update
          if ( !this.isScrubbing ) {
            
            //  Update the scrubber handle position              
            fixPosition = Math.floor( position - offset );
            
            $scrubberHandle.css({
              left: position - offset
            });
            
            //  Makes scrubber UI movement smoother
            //  CHOKES IN FIREFOX
            //$scrubberHandle.animate({
            //  left: position - offset
            //}, "fast");            
            
          }
        
        }, 
        
        deleteCanvas: function( parent, id ) {
          
          //  TODO: change to jQuery API
          var canvas = document.getElementById(id);
          
          if ( canvas ) {
            document.getElementById(parent).removeChild( canvas );
          }
        
        }, 
        
        drawCanvas: function( parent, id, width, height ) {
          
          //  TODO: change to jQuery API
          var canvas = document.createElement("canvas");
          
          canvas.id = id;
          canvas.width = width;
          canvas.height = height;
          
          document.getElementById(parent).appendChild(canvas);
          
          return canvas;
        }, 
        
        drawTimeLine: function( duration ) {
        
        
          //TrackEditor.timeLineWidth = Math.ceil( Math.ceil( duration ) / 30 ) * 800;
          TrackEditor.timeLineWidth = Math.ceil( Math.ceil( duration ) / 30 ) * 1600;
          

          this.deleteCanvas( "ui-tracks-time", "ui-tracks-time-canvas" );
          this.drawCanvas( "ui-tracks-time", "ui-tracks-time-canvas", TrackEditor.timeLineWidth, 25 );
          

          var context = document.getElementById("ui-tracks-time-canvas").getContext('2d'),
              tick = TrackEditor.timeLineWidth / duration,
              durationCeil = Math.ceil(duration), 
              increment = tick/4, 
              offset = 2, 
              primary = 0, 
              secondary = 0,
              seconds = 0, 
              posOffset;

          TrackEditor.increment = increment;
          
          context.font = "10px courier";
          context.fillStyle = "#000";
          context.lineWidth = 1;
          
          for ( ; primary < durationCeil * 2; primary++ ) {

            //if ( primary >= 10 ) {
            offset = 25;
            //}

            context.lineWidth = 1;
            context.beginPath();

            if ( primary % 2 || primary === 0 ) {

              seconds++;
              
              if ( seconds <= durationCeil ) {
                
                context.fillText( _( seconds ).secondsToSMPTE() , seconds * tick - offset, 9 );
              }

              
              posOffset = primary * tick / 2;

              
              //  Secondary ticks
              for ( secondary = 0; secondary < 4; secondary++ ) {
                context.moveTo( posOffset + ( secondary * increment ), 20 );
                context.lineTo( posOffset + ( secondary * increment ), 25 );                
              }
              

            } else {
              
              // Primary ticks
              context.moveTo( primary * tick/2, 10 );
              context.lineTo( primary * tick/2, 25 );

            }

            context.stroke();
          }
        }   
      };
      
    })(global);
    
    
    //   TrackEvents Module - define
    
    
    TrackEvents = ( function(global) {
      
      
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
        
        destroyTrackEvent: function( $track, $popcorn, id, trackType ) {
          
          //  Remove the track event from the tracks ui cache
          $track.track( "killTrackEvent", {
            _id: id
          });


          //  Remove the track event from Popcorn cache
          $popcorn.removeTrackEvent( id );
          
          
          //  Fire event if track removed successfully
          if ( $popcorn.data.history.indexOf( id ) === -1 ) {
            $doc.trigger( "removeTrackComplete", { 
              type: trackType, 
              supress: true
            });
          }

        },
        
        addTrackEvent: function( type ) {
          
          if ( !$popcorn || !$popcorn.data ) {

            $doc.trigger( "applicationError", {
              type: "No Video Loaded",
              message: "I cannot add a Track Event - there is no movie loaded."
            });        

            return;
          }
          
          var $track, lastEventId, trackEvents, trackEvent, settings = {}, 
              trackType = this.id, 
              trackManifest = Popcorn.manifest[ trackType ], 
              
              currentPlayHeadTime = _( $popcorn.video.currentTime ).fourth(), 
              startWith = {
              
                //  Drop new track event at playhead
                start: currentPlayHeadTime,
                
                //  
                end: currentPlayHeadTime + 8
              };
              
              
          //  GET PLAYHEAD POSITION AS SECONDS
          
          arguments.length && ( settings = arguments[0] );// && _;

          
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
              startWith[ key ] = "";
            }
          });
          

          //  Reset startWith.id, allow Popcorn to create unique IDs
          startWith.id = false;
          
          
          //  Call the plugin to create an empty track event
          $popcorn[ trackType ]( startWith );

          
          //  Obtain the last registered track event id
          lastEventId = $popcorn.getLastTrackEventId();
          
          
          //  Obtain all current track events
          trackEvents = $popcorn.getTrackEvents();
          
          
          //  Capture this track event
          trackEvent = TrackEvents.getTrackEventById(lastEventId);

          
          //  Check for existing tracks of this type
          //  If no existing tracks, create them
          if ( !activeTracks[ trackType ] ) {

            //  Draw a new track placeholder
            $track = $("<div/>", {

              "title": trackType, 
              className: "span-21 last track track" + _.size( activeTracks )

            }).insertAfter( "#ui-tracks-time" ); //"#ui-tracks"
            
           
            $track.width( TrackEditor.timeLineWidth );

            //  Convert the placeholder into a track, with a track event
            $track.track({
              target: $("#video"),
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
          
          $track.track( "addTrackEvent", {
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
                  autoOpen: false,
                  title: "Edit " + _( trackType ).capitalize(),
                  buttons: {
                    
                    //  TODO
                    //"Delete": editEventDelete,
                    
                    "Cancel": TrackEvents.editEventCancel,
                    "OK"    : function() {
                      
                      TrackEvents.editEventApply.call( trackEvent, $track, $popcorn, lastEventId, trackType );
                      
                      $(this).dialog("close");
                    }
                    
                    //,
                    //"Apply" : function() {
                    //  TrackEvents.editEventApply.call( trackEvent, $track, $popcorn, lastEventId, trackType );
                    //}
                  }
                });               

                TrackEvents.drawTrackEvents.call( this ); 
              
              } else {
                
                //  If the shift key was held down when the track event was clicked.
                
                
                $doc.trigger( "applicationNotice", {
                  
                  message: 'Are you sure you want to remove this Track Event? <br><br> <hr class="space">' +
                            'This action is permanent and cannot be undone.', 
                  
                  callback: function () {
                    
                    //  Remove the track when user selects "ok"
                    TrackEvents.destroyTrackEvent( $track, $popcorn, lastEventId, trackType );
                    
                    
                  }
                });
                
              }
            }
          });

          
          if ( !type ) {
            
            $doc.trigger( "addTrackComplete" );
            return;
          }
          
          
          $doc.trigger( type + "Complete" );
          
          
        },
        
        drawTrackEvents: function() { 



          // THIS FUNCTION IS NOT ACTUALLY EDITTING, BUT CREATING THE EDITOR DIALOG


          try{ 
            
            $editor.dialog("close"); 
          
          } catch( e ) {  
            // supress
          }

          // `this` will actually refer to the context set when the function is called.
          selectedEvent = this;    
          
          var manifest    = selectedEvent.popcornEvent._natives.manifest,
              //about       = manifest.about,
              //aboutTab    = $editor.find(".about"),
              options     = manifest.options,
              //optionsTab  = $editor.find(".options"),

              //input,
              label,
              prop;

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

          for ( prop in options ) { 

            if ( typeof options[ prop ] === "object" ) {

              var opt = options[ prop ],
                  elemType = opt.elem,
                  elemLabel = opt.label, 
                  elem;

              elem = $( "<" + elemType + "/>", {
                        className: "text"
                      });


              selectedEvent.manifestElems[ prop ] = elem;
              
             //console.log(lastSelectedEvent);
              
              
              if ( _.isNull(lastSelectedEvent) || lastSelectedEvent !== selectedEvent ) { 
                selectedEvent.previousValues[ prop ] = selectedEvent.popcornEvent[ prop ];
              }

              label = $("<label/>").attr("for", elemLabel).text(elemLabel);   
              
              
              if ( elemType === "input" ) { 
                
                var rounded = selectedEvent.popcornEvent[ prop ];
                
                //  Round displayed times to nearest quarter of a second
                if ( _.isNumber( +rounded ) && [ "start", "end" ].indexOf( prop ) > -1 ) {
                  
                  rounded = _( +rounded ).fourth();
                }
                
                elem.val( rounded );

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
        
        
        editEventApply: function( $track, $p, id, trackType ) { 

          var popcornEvent = selectedEvent.popcornEvent,
              manifest = popcornEvent._natives.manifest, 
              rebuiltEvent = {}, 
              prop, refEvent, _val;

          for( prop in manifest.options ) { 
            if ( typeof manifest.options[ prop ] === "object" ) {
              
              _val = selectedEvent.manifestElems[ prop ].val();
            
              popcornEvent[ prop ] = _val;
              
              if ( !!_val && [ "start", "end" ].indexOf(prop) === -1 && !isNaN( _val )  ) {
                popcornEvent[ prop ] = +_val;
              }
            }
          }

          selectedEvent.inPoint = popcornEvent.start;
          selectedEvent.outPoint = popcornEvent.end;          
          
          //  Save a ref to the latest track event data
          //  selectedEvent.popcornEvent
          
          refEvent = selectedEvent.popcornEvent;
          
          _.each( refEvent, function( eventProp, eventKey ) {
            if ( eventKey.indexOf("_") !== 0 && !!eventProp ) {
              rebuiltEvent[ eventKey ] = eventProp;
            }
          });

          
          //  Re-assign id back to rebuiltEvent
          _.extend( rebuiltEvent, {
            
            id: trackType
          
          });
          
          
          //TrackEvents.destroyTrackEvent( $track, $p, id, trackType )
          $track.track( "killTrackEvent", {
            _id: id
          });
          //  Remove the track event from Popcorn cache
          $popcorn.removeTrackEvent( id );
          
          
          $( refEvent._container ).remove();
          
          
          TrackEvents.addTrackEvent.call( rebuiltEvent, rebuiltEvent );
          
          
          //  If the scrubber is currently over the track event being editted
          //  "pre fire" the plugin start to update the preview pane display
          if ( TrackEditor.isScrubberWithin( refEvent ) ) {
            
            var lastId = $popcorn.getLastTrackEventId(), 
                newTrackEvent = TrackEvents.getTrackEventById( lastId );
            
            newTrackEvent._natives.start( null, newTrackEvent );
          
          }
          
          $doc.trigger( "videoEditComplete" );

        }, 
        
        
        editEventCancel: function() { 
          var popcornEvent = selectedEvent.popcornEvent, 
              prop;

          for( prop in selectedEvent.previousValues ) { 
            if ( prop ) {
              popcornEvent[ prop ] = selectedEvent.previousValues[ prop ];
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
    
    })(global);
    
    //   TrackExport Module

    TrackExport = (function (global) {
      
      return {
      
        typemap: {
          
          "preview" : "iframe", 
          "embeddable" : "textarea",
          "full" : "textarea"
          
        }, 
        exports: function( options ) {
          
          this.render[ this.typemap[ options.type ] ](
            options.parent,
            options.content
          );
        
        }, 
        render: {
          
          iframe: function( $parent, compiled ) {
          
            var $iframe = $("<iframe/>", { id: "ui-preview-rendered" }).width("100%").height($parent.height()-100), 
                iframe, iframeDoc;

            $parent.html( $iframe );

            iframe = $("#ui-preview-rendered")[0];
            iframeDoc = ( iframe.contentWindow ) ? 
                          iframe.contentWindow : 
                          ( iframe.contentDocument.document ) ? 
                            iframe.contentDocument.document : 
                              iframe.contentDocument;

            iframeDoc.document.open();
            iframeDoc.document.write(compiled);
            iframeDoc.document.close();             
            
          }, 
          textarea: function ( $parent, compiled ) {
            
            var $textarea = $("<textarea/>", { id: "ui-preview-rendered" }).width($parent.width()-100).height($parent.height()-100);
            
            $textarea.val( compiled );
            
            $parent.html( $textarea );
          
          }
        }
      };
    
    })(global);
    

    
    
    var seekTo = 0, 
    volumeTo = 0, 
    controls = {
      
      load: function() {
        
        seekTo = 0;
        volumeTo = 0;
        
        var videoUri = $ioVideoUrl.val(), 
            raccepts = /(.ogv)|(.mp4)|(.webm)|(.mov)|(.m4v)/gi;

        
        //  If no remote url given, stop immediately
        //if ( !videoUri || !raccepts.test( videoUri ) ) {
        if ( !videoUri ) {
        
          $doc.trigger( "applicationError", {
            type: !raccepts.test( videoUri ) ? "Invalid Movie Url" : "No Video Loaded",
            message: "Please provide a valid movie url. ("+ formatMaps.accepts.join(", ") +") "
          });        
          
          return;
        }
        
        //  TODO: really validate urls
        
        //  If all passes, continue to load a movie from
        //  a specified URL.
        TrackEditor.loadVideoFromUrl();
      }, 

      remove: function() {

        var store = trackStore || new TrackStore(), 
            title = $ioVideoTitle.val(), 
            slug = _( title ).slug();
        
        
        store.remove( slug, function () {
        
          
          //  Reload the menu
          TrackMeta.menu.load( "#ui-user-videos" );


          controls.load(); 
        
        });
        
        
        
        
      },
      save: function() {
        
        if ( !$popcorn || !$popcorn.data ) {

          $doc.trigger( "applicationError", {
            type: "No Video Loaded",
            message: "I cannot add a Track Event - there is no movie loaded."
          });       

          return;
        }        
        
        var store = trackStore || new TrackStore(), 
            title = $ioVideoTitle.val(), 
            desc = $ioVideoDesc.val(), 
            remote = $ioVideoUrl.val(),
            theme = $themelist.attr( "data-theme" ),
            layout = $layoutlist.attr( "data-layout" ),
            slug;
            
        
        if ( !title ) {

          $doc.trigger( "applicationError", {
            type: "No Title",
            message: "You will need to add a title in order to save your project."
          });       

          return;
        }
        
        
        slug = _( title ).slug();
        
        
        store.Title( title );
        store.Description( desc );
        store.Remote( remote );
        store.Theme( theme );
        store.Layout( layout );
        
        
        
        
        if ( !store.read( slug ) ) {
          
         //console.log("creating....");

          store.create( $popcorn.data.trackEvents.byStart );
          
        } else {
          
         //console.log("updating....");
          store.update( slug, $popcorn.data.trackEvents.byStart );
        
        }
        
        //trackStore  = 
        
        TrackMeta.menu.load( "#ui-user-videos" );
        
        
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
          
          $doc.trigger("seeked", "first");
        }

        if ( option === "prev" ) {
          
          seekTo = _($popcorn.video.currentTime - 0.25).fourth();
          
          $doc.trigger("seeked", "prev");
        }

        if ( option === "next" ) {
          
          seekTo = _($popcorn.video.currentTime + 0.25).fourth();
          
          $doc.trigger("seeked", "next");
        }

        if ( option === "last" ) {
          seekTo = $popcorn.video.duration;
          
          $doc.trigger("seeked", "last");
        }        
        
        
        if ( seekTo > $popcorn.video.duration ) {
          seekTo = $popcorn.video.duration;
        }

        if ( seekTo < 0 ) {
          seekTo = 0;
        }        
        
        
        //  Update current time
        $popcorn.video.currentTime = seekTo;
        
        
        //  Watch for readiness
        var isReadyInterval = setInterval(function() {
          
          if ( $popcorn.video.readyState >= 3 ) {
          
            $doc.trigger( "seekComplete", {
              type: option, 
              time: seekTo
            });
            
            clearInterval( isReadyInterval );
          }
        
        }, 1);
        
      }       
    };    
    
    
    //  UI Logic
    

    $uiStartScreen.dialog({
      modal: true, 
      autoOpen: true, 
      width: 400, 
      height: 435,
      buttons: {
        "Start": function() {
          var $this = $(this),
              value = $this.children( "input" ).val();
              
          $this.dialog( "close" );
              
          $ioVideoUrl.val( value );
          $('[data-control="load"]').trigger( "click" );
        }
      }
    });
    

    $editor.tabs();
    $editor.css({display:"none"});
    
    
    //  Load plugins to ui-plugin-select-list
    _.each( Popcorn.registry, function( plugin, v ) {
      // TODO: convert to templates
      var $li = $("<li/>", {
        
        id: plugin.type, 
        className: "span-4 select-li clickable",
        html: "<h3><img class='icon' src='img/" + plugin.type.split(/\s/)[0].toLowerCase() + ".png'> " + _( plugin.type ).capitalize() + "</h3>"
        
      }).appendTo( "#ui-plugin-select-list" );      

    });

    //  Render layout menu
    $.getJSON('layouts/layouts.json', function( response ){
      _.each( response.layouts, function ( key ) {
        var type = key.replace(/\s/g, '').toLowerCase(), 
        $li = $("<li/>", {
          html: '<h4><img class="icon" src="img/dummy.png">' + key + '</h4>',
          className: "select-li clickable" + ( $layoutlist.attr( "data-layout" ) === type ? " active" : "")
        }).appendTo( $layoutlist );
        $li.data( "type",  type );
      });
    });

    //  Render theme menu
    $.getJSON('themes/themes.json', function( response ){
      _.each( response.themes, function ( key ) {
        var type = key.replace(/\s/g, '').toLowerCase(), 
        $li = $("<li/>", {
          html: '<h4><img class="icon" src="img/dummy.png">' + key + '</h4>',
          className: "select-li clickable" + ( $themelist.attr( "data-theme" ) === type ? " active" : "")
        }).appendTo( $themelist );
        $li.data( "type",  type );
      });
    });

    //  Render Export menu
    _.each( [ "Full Page", "Embeddable Fragment", "Preview" ], function ( key ) {      
      var type = key.split(/\s/)[0].toLowerCase(), 
      $li = $("<li/>", {

        html: '<h4><img class="icon" src="img/' + type + '.png">' + key + '</h4>',
        className: "select-li clickable"

      }).appendTo( "#ui-export-to" );

      $li.data( "type",  type );
    });
    

    //  Bind layout picker
    $layoutlist.delegate( "li", "click", function () {
      var $this = $( this );
      $this.toggleClass( "active" )
        .parents( ".is-menu" )
        .attr('data-layout', $(this).data( "type" ) );

      $this.siblings()
        .removeClass('active');
    });

    //  Bind theme picker
    $themelist.delegate( "li", "click", function () {
      var $this = $( this );
      $this.toggleClass( "active" )
        .parents( ".is-menu" )
        .attr('data-theme', $(this).data( "type" ) );

      $this.siblings()
        .removeClass('active');
    });
    

    //  THIS IS THE WORST CODE EVER.
    //  TODO: MOVE OUT TO FUNCTION DECLARATION - MAJOR ABSTRACTION
    //  Export options list event
    $exporttolist.delegate( "li", "click", function () {
      
      
      if ( !$popcorn || !$popcorn.data ) {

        $doc.trigger( "applicationError", {
          type: "No Video Loaded",
          message: "I cannot export your movie - there is no video loaded."
        });        

        return;
      }
      var locationHref = location.href, 
          isPath = locationHref[locationHref.length - 1] === "/", 
          locationAry;
      
      if ( !isPath ) {
        
        locationAry = locationHref.split("/");
        locationHref = "//" + locationAry.slice(2, locationAry.length -1 ).join("/") + "/";
         
      }
          
      
      var $this = $(this),
          type = $this.data( "type" ), 
          theme = $themelist.attr( "data-theme" ),
          layout = $layoutlist.attr( "data-layout" ),
          $exports = $('[data-export="true"]'),
          $html = $exports.filter("div"), 
          exports = {
            open: '<!doctype html>\n<html>',
            head: '\n<head>\n',
            meta: '<title>'+ $ioVideoTitle.val() +'</title>\n', 
            theme: '<link rel="stylesheet" href="' + locationHref + 'themes/' + theme + '/theme.css" type="text/css" media="screen">\n',
            layout: '<link rel="stylesheet" href="' + locationHref + 'layouts/' + layout + '/layout.css" type="text/css" media="screen">\n',
            scripts: '',
            body: '\n</head>\n<body>\n',
            html: '', 
            close:'\n</body>\n</html>\n'
          }, 
          compile = '', 
          playbackAry = [ '$(function () { ', '  var $p = Popcorn("#video")', '  //uncomment to auto play', '  //$p.play();', '});\n' ],
          compiled = '',
          stripAttrs = [ "style", "width", "height" ];

      //  Compile scripts
      //  TODO: generate this from loaded plugins
      //  this is really awful
      _.each( [
          "js/jquery.js", 
          "popcorn-js/popcorn.js", 
          "popcorn-js/plugins/googlemap/popcorn.googlemap.js", 
          "popcorn-js/plugins/footnote/popcorn.footnote.js", 
          "popcorn-js/plugins/webpage/popcorn.webpage.js", 
          "popcorn-js/plugins/flickr/popcorn.flickr.js", 
          "popcorn-js/plugins/image/popcorn.image.js", 
          "popcorn-js/plugins/wikipedia/popcorn.wikipedia.js", 
          "popcorn-js/plugins/twitter/popcorn.twitter.js"
        ], function( sourceUri ) { 
        
        
        // THIS IS A SERIOUS WTF WORKAROUND - THE LIVE GOOGLEMAPS PLUGIN THROWS ERRORS
        if ( /plugins/.test( sourceUri ) ) {
          sourceUri = sourceUri.replace("plugins", "plugins-playback");
        }
        
        exports.scripts += '<script src="' + locationHref + sourceUri + '"></script>\n';
      });

      
      //  Declare instance of the track store
      var tempStore = new TrackStore(), 
          serialized = tempStore.serialize( $popcorn.data.trackEvents.byStart ), 
          deserial = JSON.parse( serialized ), 
          methods = [], panels = [];
      
      //console.log(serialized);
      
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
          panels.push( dataKey );
          
        });
      });
      
      
      //  If no mthods were compiled, then there are no tracks and 
      //  hence, nothing to preview. Doing so will throw an exception
      if ( !methods.length ) {
        
        $doc.trigger( "applicationError", {
          type: "Stage Empty",
          message: "I cannot export your movie - the stage is totes empty!"
        });        

        return;
      }
      
      //  Compile html
      $html.each( function( iter, elem ) {
        
        var $this = $(this), 
            $clone = $this.clone(), 
            width = $this.width(), 
            height = $this.height(), 
            $children,
            html = '';
        
        //  Remove unwanted nodes
        $clone.children("#ui-video-controls,hr").remove();
        
        //  Restore controls        
        if ( $clone.children("video").length ) {
        
          var $videoDiv = $("<div/>", { className: "butter-video-player" } ),
              $videoClone = $clone.children("video").clone();
          
              $videoClone.attr("controls", "controls");
              
          $videoDiv
            .append( '\n        <h1 id="videoTitle">' + $ioVideoTitle.val() + '</h1>\n        ')
            .append( $videoClone )
            .append('\n        <p id="videoDescription">' + $ioVideoDesc.val() + '</p>\n      ');

          $clone.children("video").replaceWith( $videoDiv );

          compile += '\n    <div class="butter-video">\n      ' + $.trim( $clone.html() ) + '\n    </div>\n  ';
        }
        
        
        if ( $clone.children(".ui-plugin-pane").length ) {
          
          $clone.children(".ui-plugin-pane").each(function () {

            var $this = $(this);
            
            //  If the plugin pane is not actually in the movie, remove it
            if ( !_.contains( panels, $this.data("plugin") ) ) {
              var ref = $this.data("plugin");

              $clone.children('[data-plugin="' + ref + '"]').remove();
              return;
            }
            
            //  Remove any unwanted child nodes            
            $this.attr("class", "butter-plugin").children().remove();
            
            //  Strip out all defined attributes             
            _.each( stripAttrs, function ( key ) {
              $this.removeAttr( key );
            });
          });
          
          compile += '\n    <div class="butter-plugins">\n       ' + $clone.html() + '\n    </div>\n';
        }
        
      });
      
      
      //  Attach playback string commands
      playbackAry[ 1 ] += "." + methods.join(".") + ";";
      
      //  Wrap playback script export
      exports.scripts += '\n<script>' + playbackAry.join('\n') + '</script>';
      
      //  Wrap html export
      //  TODO: inject theme ID HERE
      exports.html = ' <div class="butter-player">' + compile + '  </div>';
      
      
      if( type === "full" ) {
        //  Compile all `exports`
        _.each( exports, function ( fragment, key) {
          compiled += fragment;
        });        
      } else {
        //  Only compile fragment
        compiled = exports.scripts + "\n" + exports.theme + "\n" + exports.layout + "\n" + exports.html;
      }

      $doc.trigger( "exportReady", {
        type: type,
        content: compiled
      });
      
      
    });
    
    $doc.bind( "applicationError applicationNotice applicationAlert", function( event, options ) {
      
      var defaultHandler = function() {

        $uiApplicationMsg.dialog( "close" );
        
        //  Cleanup
        $("#ui-error-rendered").remove();
        
        $uiApplicationMsg.empty();

      }, 
      buttons = {
        "Close": defaultHandler
      };
      
      
      if ( event.type === "applicationNotice" ) {
        
        buttons = {
          "Cancel": defaultHandler, 
          "Ok": function() {

            //  If a callback specified, execute
            options.callback && options.callback();
            
            //$uiApplicationMsg.dialog( "close" );
            
            //  Run default handler to clean and close
            defaultHandler.call( this );
            
          }
        };
        
        
        if ( !options.type ) {
          options.type = "Confirm";
        }
      }
      
      //  Remove previous html
      $uiApplicationMsg.empty();
      

      $("<div/>", {
        id: "ui-error-rendered", 
        html: options.message
      }).appendTo( "#ui-application-error" );
      

      $uiApplicationMsg.dialog({
        
        title: options.type, 
        height: !!options.message ? 200 : 0, 
        buttons: buttons, 
        
        width: 300, 
        modal: true, 
        autoOpen: true, 
        
        beforeClose: function() {
          
          //defaultHandler.call(this);
          
        }
        
               
      });    
    });
    
    
    //  Show export screen
    $doc.bind( "exportReady", function( event, options ) {
      
      //$exportready.show();
      
      
      
      var $div = $("#ui-preview-viewer").dialog({
        modal: true, 
        width: $body.width() - 50, 
        height: $body.height() - 50, 
        autoOpen: true,
        title: _( options.type ).capitalize(), 
        
        beforeClose: function() {
          
          $("#ui-preview-viewer").empty();
          $("#ui-preview-rendered").remove();
        
        }, 
        buttons: {
          
          'Close': function() {
            
            $(this).dialog( "close" );
            
            $("#ui-preview-rendered").remove();
          
          }
        }        
      });
      
      _.extend( options, {
        
        parent: $div
      
      });
      
      
      TrackExport.exports(options);
      
    
    });

    
    // ^^^^^^^^^^^^^^^^^^^ THIS IS THE WORST CODE EVER.
    
    
    
    
    //  Plugin list event
    $pluginSelectList.delegate( "li", "click", function( event ) {

      TrackEvents.addTrackEvent.call(this, event);

    });
    
    
    //  User video list event
    $("#ui-start-screen-list, #ui-user-videos").delegate( "li", "click", function( event ) {
      
      var $this = $(this),
          trackEvents = $this.data( "track" ), 
          projectData = $this.data( "project" );
      
      if ( projectData ) {
        TrackMeta.project.load( trackEvents, projectData );
      }
      
      
      if ( $this.parents("#ui-start-screen-list").length ) {
        
        $("#ui-start-screen").dialog( "close" );
      
      }
      
      
    });
    
    
    //  When the window is resized, fire a timeupdate 
    //  to reset the scrubber position
    $win.bind( "resize", function( event ) {
      
      if ( $popcorn.video ) {
        $popcorn.trigger( "timeupdate" );
      }
    });
    
    
    //  Updating the scrubber height - DEPRECATE.
    $doc.bind( "addTrackComplete" , function( event ) {

      TrackEditor.setScrubberHeight();
      
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
      
      //  Complete with saving
      if ( !!$ioVideoTitle.val() ) {
      
        if ( data.suppress ) {
          return;
        }
        
        controls.save();

      }
    });
    
    

    //  Updating the scrubber height
    $doc.bind( "timelineReady videoReady", function( event ) {

      TrackEditor.setScrubberHeight();
    
    });
    

    //  Toggling the loading progress screen
    $doc.bind( "videoLoadStart videoLoadComplete", function( event ) {
      
      if ( event.type === "videoLoadStart" ) {
        $loadready.show();
        return;
      }
      
      $loadready.hide();
    
    });

    

    
    
    $doc.bind( "seekComplete", function( event, options ) {

      options.special &&  options.special();
      
      if ( options.type === "last" ) {
        $("#ui-tracks").scrollLeft( $("#ui-tracks-time-canvas").width() );
      }
      
      if ( options.type === "first" ) {
        $("#ui-tracks").scrollLeft( 0 );
      }
    }); 
    
    
    //  Update data view textarea
    $doc.bind( "videoEditComplete addTrackComplete", function( event, data ) {
      
      var tempStore = new TrackStore();
      
      $ioVideoData.val( tempStore.serialize( $popcorn.data.trackEvents.byStart ) );
      
    });
    
    

    
    
    $tracktime.bind( "click", function( event ) {
      
      if ( !$popcorn.video ) {
        return;
      }
      
      var $this = $(this), 
          increment = Math.round( $("#ui-tracks-time-canvas").width() / $popcorn.video.duration ), 
          quarterTime = _( event.offsetX / increment ).fourth();
      
      $popcorn.video.currentTime = quarterTime;      
    });



    //$uitracks.bind( "scrollstart", function(){
      //console.log("scrollstart");
    //});

    $uitracks.bind( "scrollstop", function(e){
    
      //console.log("scrollstop");
      
      if ( !$popcorn.video ) {
        return;
      }    
      
      var increment = Math.round( $("#ui-tracks-time-canvas").width() / $popcorn.video.duration ), 
          scrubberTime = 0, 
          timeDistance = 0,
          quarterTime = 0;

      //  The scrubber handle may have been moved, we must account for this
      if ( $scrubberHandle.position().left > $trackeditting.position().left ) {

        scrubberTime = ( $scrubberHandle.position().left - $trackeditting.position().left ) / increment;

      }
          
      //  Calculate distance scrolled by baseline editting area left - scrolling area left / increment = time
      timeDistance = ( $trackeditting.position().left - $("#ui-tracks-time-canvas").position().left )  / increment;
      
      //  Get the quarterTime and pad with a 1/4 of a sec      
      quarterTime = _( timeDistance ).fourth() + 0.25;
      
      //  Update currentTime to trigger scrubber position update
      $popcorn.video.currentTime = quarterTime + ( scrubberTime || 0 );      

    });

    
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

      if ( !$popcorn || !$popcorn.data ) {

        $doc.trigger( "applicationError", {
          type: "No Video Loaded",
          message: "I cannot " + $this.attr("data-control") + " - there is no video loaded"
        });       

        return;
      }      
      
      controls[ $this.attr("data-control") ]( $this.attr("data-opt") );

    });    

    //  TODO: Revise
    $ioCurrentTime.bind( "keydown", function( event ) {
      
      //  Enter
      //if ( event.which === 13 ) {
        //controls.seek( "seek:io-current-time" );
      //}
      
      //  Arrow right
      if ( event.which === 39 && event.shiftKey ) {
        $('[data-opt="next"]').parents("button").trigger("click");
      }
      
      
      //  Arrow left
      if ( event.which === 37 && event.shiftKey ) {
        $('[data-opt="prev"]').parents("button").trigger("click");
      }
      
    });
    
    
    global.$popcorn = $popcorn;
  });

})( this, this.document, this.jQuery, this._, this.Popcorn );
//  Pass ref to jQuery and Underscore.js
