document.addEventListener( "DOMContentLoaded", function(){
  var popcornInstances,
    popcorn,
    i;

    $('.bigtext').hide();
    
    window.setTimeout(function(){
      $('.bigtext').fadeIn().bigtext();
    }, 1000);
      

  $(window).scroll(function(e){
    if( $(window).scrollTop() > 40 ){
      $("#banner").addClass("scroll");
      $(".transform").addClass("transform3D");
      $("html").addClass("dark");
    } else {
      $("#banner").removeClass("scroll");
      $(".transform3D").removeClass("transform3D");
      $("html").removeClass("dark");
    }
  });


  //find Popcorn instances
  if( window.Popcorn ) {
      popcornInstances = Popcorn.instances();
    for( i=popcornInstances.length;i>0;i--) {
      if ( !popcornInstances[i].isDestroyed ) {
        popcorn = popcornInstances[i];
        break;
      }
    }

    console.log( popcorn );
  }

}, false);


