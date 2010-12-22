(function($, _ ) { 

  _.mixin({
    capitalize : function(string) {
      return string.charAt(0).toUpperCase() + string.substring(1).toLowerCase();
    }
  });
  
  
  $(function( ) { 
    
    var $popcorn = Popcorn("#video"), 
        
        $pluginSelect = $("#ui-plugin-select"), 
        $pluginSelectList = $("#ui-plugin-select-list"), 
        $addTrackButton = $("#ui-addtrackevent-button"), 
        $editor = $("#ui-track-event-editor"),
        $uitracks = $("#ui-tracks"), 
        $tracks = $("#ui-tracks").children("div.track:not(.zoom)"),

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
            startWith = {
              start: 5,
              end: 10,
              src: ''
            };


        // add better checks for this...

        _.extend( startWith, {

          target: Popcorn.manifest[ trackType ].options.target

        });

        //  create an empty track event
        $popcorn[ trackType ]({
          start   : 0,
          end     : 10,
          src     : ''
        });

        lastEventId = $popcorn.getLastTrackEventId();
        trackEvents = $popcorn.getTrackEvents();

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
          
          /*
          $track.tooltip({
            offset: "15 15"
          });
          */
          
          //  cache the track widget
          activeTracks[ trackType ] = $track;

        } else {

          //  if a track of this type exists
          $track = activeTracks[ trackType ];

        }


        $track.track( 'addTrackEvent', {
          inPoint           : 0,
          outPoint          : 10,
          type              : trackType,
          popcornEvent      : trackEvents[ trackEvents.length - 1 ],
          popcorn           : $popcorn,
          editEvent         : function() {  

            TrackEditor.editTrackEvent.call(this); 

          }
        });

      };

      this.editTrackEvent = function() { 

        //try{ $editor.dialog("close"); }
        //catch(e ) {  if ( console && console.log ) {  console.log(e); } }

        selectedEvent = this;    

        console.log(this);

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

        $editor.dialog({
          width: "400px", 
          title: 'Edit ' + _( this.type ).capitalize(),
          buttons: {
            //'Delete': editEventDelete,
            'Cancel': TrackEditor.editEventCancel,
            'OK'    : TrackEditor.editEventOK,
            'Apply' : TrackEditor.editEventApply
          }
        });
      };    

      this.editEventOK = function( ) { 
        TrackEditor.editEventApply();
        $editor.dialog("close");
      };

      this.editEventApply = function( ) { 
        var popcornEvent = selectedEvent.popcornEvent,
            manifest = popcornEvent.natives.manifest;

        for( var i in manifest.options ) { 
          if ( typeof manifest.options[i] === "object" ) {
            popcornEvent[i] = selectedEvent.manifestElems[i].val();
          }
        }
        selectedEvent.inPoint = popcornEvent.start;
        selectedEvent.outPoint = popcornEvent.end;
        selectedEvent.parent._draw();
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
    
    $("#ui-scrubber").draggable({ 
      axis: "x", 
      drag: function (event, ui) {
        
        var scrubPosition = ui.offset.left - $uitracks.position().left, 
            updateTo = $popcorn.duration() / $uitracks.width() * scrubPosition;
        
        
        
        $popcorn.currentTime( updateTo );
      }
    });
    
    
  });

})(jQuery, _);
//  Pass ref to jQuery and Underscore.js
