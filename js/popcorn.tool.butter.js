(function($, _ ) { 

  _.mixin({
    capitalize : function(string) {
      return string.charAt(0).toUpperCase() + string.substring(1).toLowerCase();
    }
  });
  
  
  $(function( ) { 
    
    var $popcorn = Popcorn("#video"), 
        
        $pluginSelect = $("#ui-plugin-select"), 
        $addTrackButton = $("#ui-addtrackevent-button"), 
        $editor = $("#ui-track-event-editor"),
        $tracks = $("#ui-tracks").children("div.track:not(.zoom)"),

        selectedEvent = null,
        lastSelectedEvent = null, 
        
        activeTracks = {};
        
    
    $("button").button();
    
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

    
    
    
    //  Load plugins to ui-plugin-select 
    _.each( Popcorn.registry, function ( plugin, v ) {
      
      var $opt = $("<option/>", {
        
        val: plugin.type, 
        text: _( plugin.type ).capitalize()
        
      }).appendTo( "#ui-plugin-select" );
      
    });

    $addTrackButton.bind( "click", function () {
      
      var $track, lastEventId, trackEvents, 
          trackType = $pluginSelect.children(':selected').val(), 
          startWith = {
            start   : 5,
            end     : 10,
            src     : ''
          };
      
      
      // add better checks for this...
      
      
      //console.log(Popcorn.manifest[ $pluginSelect.children(':selected').val() ].options);
      
      
      _.extend( startWith, {
        
        target: Popcorn.manifest[ trackType ].options.target
        
      });
      
      //console.log("startWith", startWith);
      
      //  create an empty track event
      $popcorn[ trackType ]({
        start   : 5,
        end     : 10,
        src     : ''
      });
      
      lastEventId = $popcorn.getLastTrackEventId();
      trackEvents = $popcorn.getTrackEvents();
      
      
      
      if ( !activeTracks[ trackType ] ) {
        //  draw a new track placeholder
        $track = $("<div/>", {

          className: "track track" + ( $tracks.length + 1 )

        }).prependTo( "#ui-tracks" );

        //  convert the placeholder into a track, with a track event
        $track.track({
          target: $('#video'),
          duration: $popcorn.duration()
        });
        
        activeTracks[ trackType ] = $track;
        
      } else {
        
        $track = activeTracks[ trackType ];
      
      }
      
      
      $track.track( 'addTrackEvent', {
        inPoint           : 0,
        outPoint          : 10,
        type              : trackType,
        popcornEvent      : trackEvents[ trackEvents.length - 1 ],
        popcorn           : $popcorn,
        editEvent         : function() {  
        
          editTrackEventCallback.call(this); 
        
        }
      });

    });
    
    
    // to do: rewire all refs to .natives.manifest
    
    
    
    
    //// EVENT EDITOR //////////////////////////////////////////////////////////


    
    $editor.tabs();
    $editor.css({display:"none"});
    
    
    var editEventOK = function( ) { 
      editEventApply();
      $editor.dialog("close");
    };

    var editEventApply = function( ) { 
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

    var editEventCancel = function( ) { 
      var popcornEvent = selectedEvent.popcornEvent;
      for( var i in selectedEvent.previousValues ) { 
        popcornEvent[i] = selectedEvent.previousValues[i];
      }
      selectedEvent.inPoint = popcornEvent.start;
      selectedEvent.outPoint = popcornEvent.end;
      selectedEvent.parent._draw();
      $editor.dialog("close");
    };
   

    var editTrackEventCallback = function ( ) { 

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
              elemLabel = opt.label
          ;
          
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
          'Cancel': editEventCancel,
          'OK'    : editEventOK,
          'Apply' : editEventApply
        }
      });
    };

    
    /*

    var trackEventsByStart = p.data.trackEvents.byStart, i_trackEvent, type;

    for(var i=1, l=trackEventsByStart.length; i< l; i++ ) { 
      i_trackEvent = trackEventsByStart[i];
      type = i_trackEvent.natives.type;

      if ( type === "image" ) {

        track1.track( 'addTrackEvent', {
            inPoint           : i_trackEvent.start,
            outPoint          : i_trackEvent.end,
            type              : type,
            popcornEvent      : i_trackEvent,
            popcorn           : p,
            editEvent         : function( ) {  editTrackEventCallback.call(this); }
        });

      } else if ( type === "text" ) {

        track2.track('addTrackEvent', {
          inPoint             : i_trackEvent.start,
          outPoint            : i_trackEvent.end,
          type                : type,
          popcornEvent        : i_trackEvent,
          popcorn             : p,
            editEvent         : function( ) {  editTrackEventCallback.call(this); }
        });

      }
    }
    
    
    */
    

  });

})(jQuery, _);
