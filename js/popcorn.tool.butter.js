(function($){

  $(function(){

    var p = Popcorn('#video')
      .image({
        start   : 1,
        end     : 8,
        target  : 'image-container',
        src     : 'http://upload.wikimedia.org/wikipedia/en/0/06/MMPR_Logo.png'
      })
      .image({
        start   : 12,
        end     : 19,
        target  : 'image-container',
        src     : 'http://upload.wikimedia.org/wikipedia/en/0/06/MMPR_Logo.png'
      })
      .image({
        start   : 29,
        end     : 50,
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

    var cap = function( aString ){
      return aString.charAt(0).toUpperCase() + aString.slice(1);
    };

    eventEditor = $('#event-editor');
    eventEditor.tabs();
    eventEditor.css({display:'none'});

    var editTrackEventCallback = function editTrackEventCallback(){
      try{ 
        eventEditor.dialog('close');
      }catch(e){ console.log(e); }
      var self = this;
      eventEditor.attr('title', 'Edit ' + cap(this.type) + ' Event');
      eventEditor.find('input[name$="in"]').val(this.inPoint);
      eventEditor.find('input[name$="out"]').val(this.outPoint);
      eventEditor.find('input[name$="src"]').val(this.popcornTrackEvent.src||this.popcornTrackEvent.text);
      eventEditor.dialog();
      eventEditor.find('button.OK').click(function(){
        self.popcornTrackEvent.start = self.inPoint = eventEditor.find('input[name$="in"]').val();
        self.popcornTrackEvent.out = self.outPoint = eventEditor.find('input[name$="out"]').val();        
        self.popcornTrackEvent.src = eventEditor.find('input[name$="src"]').val();
        self.parent._draw();
        eventEditor.dialog('close');
      });
    };

    var trackEventsByStart = p.data.trackEvents.byStart, i_trackEvent, type;

    for(var i=1, l=trackEventsByStart.length; i< l; i++){
      i_trackEvent = trackEventsByStart[i];
      type = i_trackEvent.natives.type;

      if( type === "image" ) {

        track1.track( 'addTrackEvent', {
            inPoint           : i_trackEvent.start,
            outPoint          : i_trackEvent.end,
            type              : type,
            popcornTrackEvent : i_trackEvent,
            popcorn           : p,
            editEvent         : function(){ editTrackEventCallback.call(this); }
        });

      } else if( type === "text" ) {

        track2.track('addTrackEvent', {
          inPoint             : i_trackEvent.start,
          outPoint            : i_trackEvent.end,
          type                : type,
          popcornTrackEvent   : i_trackEvent,
          popcorn             : p,
            editEvent         : function(){ editTrackEventCallback.call(this); }
        });

      }
    }

  });

})(jQuery);
