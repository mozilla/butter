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
    .text({
      start   : 9,
      end     : 11,
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

  var rangesByStart = p.data.ranges.byStart, i_range, type;

  for(var i=1, l=rangesByStart.length; i< l; i++){
    i_range = rangesByStart[i];
    type = i_range.natives.type;
    if( type === "image" ) {
      track1.track('addRange', {inPoint: i_range.start, outPoint: i_range.end, popcornRange: i_range, popcorn: p });
    } else if( type === "text" ) {
      track2.track('addRange', {inPoint: i_range.start, outPoint: i_range.end, popcornRange: i_range, popcorn: p });
    }
  }


});
})(jQuery);
