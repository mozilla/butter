(function($){
$(function(){

  var p = Popcorn('#video')
    .image({
      start   : 1,
      end     : 3,
      target  : 'image-container',
      src     : 'http://upload.wikimedia.org/wikipedia/en/0/06/MMPR_Logo.png'
    })
    .image({
      start   : 5,
      end     : 7,
      target  : 'image-container',
      src     : 'http://upload.wikimedia.org/wikipedia/en/0/06/MMPR_Logo.png'
    })
    .image({
      start   : 29,
      end     : 29.25,
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

  var trackEventsByStart = p.data.trackEvents.byStart, i_trackEvent, type;

  for(var i=1, l=trackEventsByStart.length; i< l; i++){
    i_trackEvent = trackEventsByStart[i];
    type = i_trackEvent.natives.type;
    if( type === "image" ) {
      track1.track('addTrackEvent', {inPoint: i_trackEvent.start, outPoint: i_trackEvent.end, popcornTrackEvent: i_trackEvent, popcorn: p });
    } else if( type === "text" ) {
      track2.track('addTrackEvent', {inPoint: i_trackEvent.start, outPoint: i_trackEvent.end, popcornTrackEvent: i_trackEvent, popcorn: p });
    }
  }


});
})(jQuery);
