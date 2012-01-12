/*global text,expect,ok,module,notEqual,test,window*/
(function () {

  var butter,
      tracksContainer;

  module ( "Timeline", {
    setup: function() {
      stop();
      tracksContainer = document.getElementById( "target-div" );
      tracksContainer.innerHTML = "";
      new Butter({
        modules: {
          "timeline": {
            target: "target-div",
          }
        },
        ready: function( e ) {
          butter = e.data;
          start();
        }
      });
    },
    teardown: function() {
    }
  });

  test( "Check Existence", function() {
    expect( 1 );
    ok( butter.timeline, "timeline exists" );
  });

  test( "Target Containers", function() {
    expect( 1 );
    butter.addMedia({
      name: "video1",
      media: "../sample.oga"
    });
    equals( tracksContainer.children.length, 1, "track container was created via id" );
  });

  test( "timelineready", function() {
    expect( 2 );

    var mediaReady = false;
    butter.listen( "timelineready", function() {
      mediaReady = true;
    });
    var media1 = butter.addMedia({
      name: "video1",
      media: "../sample.oga"
    });
    media1.duration = 178;
    media1.dispatch( "mediaready", media1 );

    ok( mediaReady, "timelineready & mediaready event was fired" );

    var media2 = butter.addMedia({
      name: "video1", 
      media: "../sample.oga"
    });
    media2.duration = 178;
    media2.dispatch( "mediaready", media2 );
    butter.listen( "timelineready", function() {
      mediaChanged = true;
    });
    butter.currentMedia = media2;
    ok( mediaChanged, "mediaready event was fired" );
  });

  test( "currentTimeInPixels", function() {
    expect( 6 );

    var media = butter.addMedia({
      name: "video1",
      media: "../sample.oga"
    });
    media.duration = 178;
    media.dispatch( "mediaready", media );
    butter.currentMedia = media;

    equals( butter.timeline.currentTimeInPixels(), 0, "checking pixel at starting of video" );
    butter.currentTime = butter.duration;
    equals( butter.timeline.currentTimeInPixels(), tracksContainer.offsetWidth, "checking pixel at end of video" );
    butter.currentTime = butter.duration / 2;
    equals( butter.timeline.currentTimeInPixels(), tracksContainer.offsetWidth / 2, "checking pixel half way through video" );

    butter.timeline.currentTimeInPixels( 0 )
    equals( butter.currentTime, 0, "checking second at pixel 0" );
    butter.timeline.currentTimeInPixels( tracksContainer.offsetWidth );
    equals( butter.currentTime, butter.duration, "checking second at last pixel" );
    butter.timeline.currentTimeInPixels( tracksContainer.offsetWidth / 2 );
    equals( butter.currentTime, butter.duration / 2, "checking second at middle pixel" );
  });

})();

