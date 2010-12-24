
$(function () {
  
  
  
  //  Select a track event type
  var interval = setInterval(function () {
    
    if ( $popcorn.video.readyState >= 3  ) {
    
      $('#ui-plugin-select-list li').eq(0).trigger("click");
      
      clearInterval(interval);
    }
  
  }, 13);




});
