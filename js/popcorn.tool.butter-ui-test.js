
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
        
        "http://dl.dropbox.com/u/3531958/sintel.ogv",
        "http://dl.dropbox.com/u/3531958/eich.ogv",
        "http://dl.dropbox.com/u/3531958/crockford.ogv"
        
        
      ];

  
  
  
  
  
  setTimeout(function () {
    
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
        title = _( ary[ ary.length-1 ].split(".")[0] ).capitalize();
        
    
    
    $("#io-video-title").val( title );
    $("#io-video-description").val( "Check it out rizzle shiz sit mah nizzle, consectetuer adipiscing elizzle. Nullizzle uhuh ... yih! velizzle, gangster crunk, dizzle pimpin', that's the shizzle vel, arcu. Owned sure tortizzle. Fo shizzle my nizzle eros. Get down get down ghetto dolor dapibus turpis tempizzle i'm in the shizzle. Maurizzle break it down brizzle i saw beyonces tizzles and my pizzle went crizzle turpis. Funky fresh in tortor. Dang bow wow wow rhoncizzle get down get down. In i saw beyonces tizzles and my pizzle went crizzle fo shizzle platea dictumst. Donec dapibizzle. Curabitizzle shit urna, pretizzle shiz, yippiyo ac, crackalackin you son of a bizzle, nunc. Da bomb suscipit. Integer sempizzle stuff sizzle own yo'." );
    
  };
  
  clearstorage = function () {
    for ( var prop in localStorage ) {
      localStorage.removeItem( prop );
    }    
  }
  
  
  
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
  
  
  
  $("#ui-test-stuff").dialog({
    autoOpen: true,
    width: "175px",
    autoOpen: true,
    title: "Test",
    position: [0,0],
    
    buttons: {
      'Close'    : function () {
         $(this).dialog("close");
      }
    }
  });
  
    


  $("#io-video-url").trigger("change");
  
});
