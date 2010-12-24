(function($, _ ) { 

  _.mixin({
    capitalize : function( string ) {
      return string.charAt(0).toUpperCase() + string.substring(1).toLowerCase();
    },
    camel: function( string ) {
      return string.replace(/(\-[a-z])/g, function($1){return $1.toUpperCase().replace('-','');});
    },
    pad: function( number ) {

      return ( number < 10 ? '0' : '' ) + number;

    },
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
  
  
  $(function( ) { 
    
    var $popcorn = Popcorn("#video"), 
        
        $pluginSelect = $("#ui-plugin-select"), 
        $pluginSelectList = $("#ui-plugin-select-list"), 
        $addTrackButton = $("#ui-addtrackevent-button"), 
        $editor = $("#ui-track-event-editor"),
        $editorPane = $("#ui-event-editor"),
        $uitracks = $("#ui-tracks"), 
        $tracks = $("#ui-tracks").children("div.track:not(.zoom)"),
        $scrubber = $("#ui-scrubber"), 
        $scrubberHandle = $("#ui-scrubber-handle"),

        selectedEvent = null,
        lastSelectedEvent = null, 
        
        activeTracks = {};
        
    
    $("button").button();
    
    $("#ui-tools-accordion,#ui-track-details").accordion();

  

    
    
    /*
    var p = Popcorn('#video')
      .image({
        start   : 1,
        end     : 8,
        target  : 'image-container',
        src     : 'http://upload.wikimedia.org/wikipedia/en/0/06/MMPR_Logo.png'
      })
      .text({
        start   : 9,
        end     : 22,
        target  : 'text-container',
        text     : 'testing'
      })
    ;

    var track1 = $('.track1').track({
      target  : $('#video'),
      duration: 100
    });

    var track2 = $('.track2').track({
      target  : $('#video'),
      duration: 100
    });

    var zoom = $('.zoom').track({
      duration     : 100,
      mode         : 'smartZoom',
      linkedTracks : [ track1, track2 ]
    });    
    */

    var TrackEditor = new function () {
    
      this.addTrackEvent = function () {

        var $track, lastEventId, trackEvents, 
            trackType = $(this).attr("id"), 
            trackManifest = Popcorn.manifest[ trackType ], 
            startWith = {
              start: 2,
              end: 10
            };


        // add better checks for this...

        _.extend( startWith, {

          target: Popcorn.manifest[ trackType ].options.target

        });
        
        
        _.forEach( trackManifest.options, function ( obj, key ) {
          if ( !( key in startWith ) ) {
            startWith[ key ] = "";
          }
        });
        
        //console.log("startWith", startWith);

        //  create an empty track event
        $popcorn[ trackType ]( startWith );

        
        lastEventId = $popcorn.getLastTrackEventId();
        trackEvents = $popcorn.getTrackEvents();
        
        
        // uncomment for multiple events per track
        //  check for existing tracks of this type
        //  if no existing tracks, create them
        if ( !activeTracks[ trackType ] ) {

          //  draw a new track placeholder
          $track = $("<div/>", {
            
            "title": trackType, 
            className: "span-21 last track track" + ( $tracks.length + 1 )

          }).prependTo( "#ui-tracks" );

          //  convert the placeholder into a track, with a track event
          $track.track({
            target: $('#video'),
            duration: $popcorn.duration()
          });

          
          $track.prepend('<span class="large track-label large" >' + _( trackType ).capitalize() + '</span>');
          
          //  cache the track widget
          activeTracks[ trackType ] = $track;

        } else {

          //  if a track of this type exists
          $track = activeTracks[ trackType ];

        }
        
        var _trackEvent = trackEvents[ trackEvents.length - 1 ];

        $track.track( 'addTrackEvent', {
          inPoint           : startWith.start,
          outPoint          : startWith.end,
          type              : trackType,
          popcornEvent      : _trackEvent,
          popcorn           : $popcorn,
          editEvent         : function() {  
            
           //console.log("TrackEvent clicked");
            
            
            TrackEditor.editTrackEvent.call(this); 

          }
        });
        
        $editor.dialog({
          width: "400px",
          autoOpen: false,
          title: 'Edit ' + _( this.type ).capitalize(),
          buttons: {
            //'Delete': editEventDelete,
            'Cancel': TrackEditor.editEventCancel,
            'OK'    : function () {
              
              TrackEditor.editEventApply.call(_trackEvent); 
              
              $(this).dialog("close");
            },
            'Apply' : TrackEditor.editEventApply
          }
        });        
        
        $(document).trigger( "addTrackComplete.track" );

      };

      this.editTrackEvent = function() { 
        
        
        
        try{ $editor.dialog("close"); }
        catch(e ) {  if ( console && console.log ) {  console.log(e); } }
        
        // `this` will actually refer to the context set when the function is called.
        selectedEvent = this;    

        
        var manifest    = selectedEvent.popcornEvent.natives.manifest,
            about       = manifest.about,
            aboutTab    = $editor.find(".about"),
            options     = manifest.options,
            optionsTab  = $editor.find(".options"),
            elemType,
            input,
            label,
            opt
        ;
        
        //console.log(manifest);
        
        aboutTab.children("*").remove(); // Rick, not sure if this is good practice here. Any ideas?

        $("<h3/>").text(about.name).appendTo(aboutTab),
        $("<p/>").html("<label>Version:</label> "+about.version).appendTo(aboutTab);
        $("<p/>").html("<label>Author:</label> "+about.author).appendTo(aboutTab);
        $("<a/>").html('<label>Website:</label> <a href="'+about.website+'">'+about.website+'</a>').appendTo(aboutTab);

        optionsTab.children("*").remove(); // Rick, not sure if this is good practice here. Any ideas?


        for ( var i in options ) { 

          if ( typeof options[i] === "object" ) {

            var opt = options[i],
                elemType = opt.elem,
                elemLabel = opt.label;

            elem = $("<"+elemType+"/>");

            if ( !selectedEvent.manifestElems ) {  
              selectedEvent.manifestElems = {}; 
            }

            if ( !selectedEvent.previousValues ) {  
              selectedEvent.previousValues = {}; 
            }

            selectedEvent.manifestElems[i] = elem;

            if ( lastSelectedEvent != selectedEvent ) { 
              selectedEvent.previousValues[i] = selectedEvent.popcornEvent[i];
            }

            if ( elemType === "input" ) { 
              label = $("<label/>").attr('for', elemLabel).text(elemLabel);
              elem.val( selectedEvent.popcornEvent[i] );
              elem.appendTo(label);
              label.appendTo(optionsTab);
            }
          }
        }

        lastSelectedEvent = this;

        
        $editor.dialog("open");
      };    

      this.editEventOK = function( ) { 
        TrackEditor.editEventApply();
        $editor.dialog("close");
      };

      this.editEventApply = function( ) { 
      
        
        //console.log("selectedEvent", selectedEvent);
      
        var popcornEvent = selectedEvent.popcornEvent,
            manifest = popcornEvent.natives.manifest;
        
        //console.log("manifest", manifest);
        //console.log("popcornEvent", popcornEvent);
        
        for( var i in manifest.options ) { 
          if ( typeof manifest.options[i] === "object" ) {
            popcornEvent[i] = selectedEvent.manifestElems[i].val();
          }
        }
        selectedEvent.inPoint = popcornEvent.start;
        selectedEvent.outPoint = popcornEvent.end;
        selectedEvent.parent._draw();
        
        
        // TODO:  move out to own function
        // $("#data-view").val( JSON.stringify( $popcorn.data.trackEvents ) );
      };

      
      
      this.editEventCancel = function( ) { 
        var popcornEvent = selectedEvent.popcornEvent;
        for( var i in selectedEvent.previousValues ) { 
          popcornEvent[i] = selectedEvent.previousValues[i];
        }
        selectedEvent.inPoint = popcornEvent.start;
        selectedEvent.outPoint = popcornEvent.end;
        selectedEvent.parent._draw();
        $editor.dialog("close");
      };
    }   

    // to do: rewire all refs to .natives.manifest

    $editor.tabs();
    $editor.css({display:"none"});
    
    
    //  Load plugins to ui-plugin-select 
    _.each( Popcorn.registry, function ( plugin, v ) {
      
      
      // todo: convert to templates
      var $li = $("<li/>", {
        
        id: plugin.type, 
        className: "span-4 select-li clickable",
        html: "<h3><img class='icon' src='img/dummy.png'> " + _( plugin.type ).capitalize() + "</h3>"
        
      }).appendTo( "#ui-plugin-select-list" );      

    });

    $pluginSelectList.delegate( "li", "click", function (event) {

      TrackEditor.addTrackEvent.call(this, event);

    });
    

    // this is awful  
    $("#ui-plugin-select-list li")
      .hover(function () {
        $(this).animate({ backgroundColor: "#ffff7e" }, 200);
      }, 
      function () {
        $(this).animate({ backgroundColor: "#FFFFFF" }, 200);
    });  
    
    
    $uitracks.disableSelection();
    
    $scrubberHandle.draggable({ 
      axis: "x", 
      containment: "#ui-tracks",  
      drag: function (event, ui) {
        
        
        var scrubPosition = ui.offset.left - $uitracks.position().left, 
            updateTo = $popcorn.duration() / $uitracks.width() * scrubPosition;
        
        $popcorn.currentTime( updateTo );
      }
    });

    
    
    $("body").disableSelection();
    
    
    $(document).bind( "addTrackComplete.track" , function () {
      
      //console.log('addTrackComplete');
      
      $("#ui-scrubber,#ui-scrubber-handle").css({
        height: $uitracks.height()
      })
    });
    
    
    
    var formats = {
      
      currentTime: function( float ) {
        
        var mm  = (""+float).split(".")[1] ;
        
        return  _( Math.floor( float / 3600 ) ).pad() + ":" + 
                  _( Math.floor( float / 60 ) ).pad() + ":" + 
                    _( Math.floor( float % 60 ) ).pad() + ":" +
                      _( ( mm || "" ).substr(0,2) ).pad().substr(0,2);// + float.split(".")[1]/1000
      }
    
    };
    
    $popcorn.listen( "timeupdate", function () {
      $(".video-prop").val(function () {
        
        var $this = $(this), 
            prop  = _(this.id).camel(), 
            val = $popcorn[ prop ]();
        
        return  formats[ prop ]( val );
      
      });
    });
    
    $(".video-prop").bind( "blur", function () {
      
      //$popcorn.trigger( "timeupdate" );
    
    });
    
    
    
    
    // movie into track editor object, fix redundancies
    var controls = {
      
      play: function () {
        
        $popcorn.video.play();
      }, 
      pause: function () {
        
        $popcorn.video.pause();
      }, 
      seek: function ( option ) {
      
        var seekTo;
        
        if ( option.indexOf(":") > -1 ) {
          
          var $input = $("#" + ( option.split(":")[1] || "" ) );
          
          seekTo = _( $input.val() ).smpteToSeconds();
        }
        

        if ( option === "first" ) {
          seekTo = 0;
        }

        if ( option === "prev" ) {
          seekTo = $popcorn.video.currentTime - 0.10;
        }

        if ( option === "next" ) {
          seekTo = $popcorn.video.currentTime + 0.10
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
    
    
    
    $("#ui-video-controls button").bind( "click", function ( event ) {
      
      // was elegant, now its not. needs to be fixed
      var $this = $(this).children("span").children("span");
      
      
      controls[ $this.attr("data-control") ]( $this.attr("data-opt") );

    });
    
    
    
    
    window.$popcorn = $popcorn;
  });

})(jQuery, _);
//  Pass ref to jQuery and Underscore.js
