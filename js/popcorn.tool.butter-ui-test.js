
$(function () {
  
  
  /*
  //  Select a track event type
  var interval = setInterval(function () {
    
    if ( $popcorn.video.readyState >= 3  ) {
    
      $('#ui-plugin-select-list li').eq(0).trigger("click");
      
      clearInterval(interval);
    }
  
  }, 13);


  
  $("#io-video-url").trigger("change");
  
  
  */
  
  var videos = [
        "http://media.w3.org/2010/05/sintel/trailer.ogv",
        "http://media.w3.org/2010/05/bunny/trailer.ogv",
        "http://dl.dropbox.com/u/3531958/CIMG1253.ogv"
        
      ];

  
  
  
  
  
  setTimeout(function () {
    
    
    
    //$("#io-video-url").val( videos[ Math.floor( Math.random() * videos.length ) ] );
    
    cload();
  
  }, 500 );
  

  
  //  console callable
  
  crand = function () {
    
    $("#io-video-url").val( videos[ Math.floor( Math.random() * videos.length ) ] );
    
  };
  
  cload = function () {
    crand();
    
    $('[ data-control="load"]').trigger("click");
    
    
    var ary = $("#io-video-url").val().split("/"), 
        str = ary[ ary.length-2 ] + " " + ary[ ary.length-1 ];
        
    
    
    $("#io-video-title").val( str );
    $("#io-video-description").val( ary.join(" ") );
    
  };
  
  
  if ( localStorage.length ) {
  
    //localStorage.removeItem('3531958-cimg1253-ogv');
    //localStorage.removeItem('bunny-trailer-ogv');
    //localStorage.removeItem('sintel-trailer-ogv');

    for ( var prop in localStorage ) {
      if ( prop.indexOf("_") === 0 ) {
        localStorage.removeItem( prop );
      }
    }    
  }
  
  //console.log(localStorage);  
  
  
  
    

});
