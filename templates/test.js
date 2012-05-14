document.addEventListener( "DOMContentLoaded", function( e ){
  
  (function( Butter ) {
    var t = new Butter.Template();
    t.name = "Test Template";
    t.config = "../config/default.conf";
    t.debug = true; //Comment out for production

    t.butterInit = function( butter, media, popcorn, callback ) {
    // This function runs only once, when butter initializes. 
    // You should create tracks & starting track events here.
      var track = media.addTrack( "Track1" );
        media.addTrack( "Track" + Math.random() );
        media.addTrack( "Track" + Math.random() );

        var event = track.addTrackEvent({
          type: "text",
          popcornOptions: {
            start: 0,
            end: 3,
            text: "test",
            target: "Area1"
          }
        });

        butter.tracks[ 2 ].addTrackEvent({ 
          type: "footnote",
          popcornOptions: {
            start: 1,
            end: 2,
            target: "Area2"
          }
        });

        butter.tracks[ 1 ].addTrackEvent({ 
          type: "image",
          popcornOptions: {
            start: 4,
            end: 5,
            target: "Area2"
          }
        });

        document.getElementById("title").setAttribute("contenteditable", true);

        callback && callback();
    }

    t.initCallback = function(){
    // This function runs after butter first initializes.
      t.showTray( true );

      //In javascript...
      var controls = document.getElementById( "template-controls");
      var btn1 = document.createElement( "button" );
      btn1.innerText = "Remove all text and footnote tracks";
      btn1.addEventListener( "click", function(){
        var text = t.getTrackEvents( { type: ["text", "footnote"] } );
        text.remove();
      }, false);

      var btn2 = document.createElement( "button" );
      btn2.innerText = "Change text";
      btn2.addEventListener( "click", function(){
        var text = t.getTrackEvents( { type: ["text", "footnote"] } );
        text.update( { text: "OMG!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" } );
      }, false);

      controls.appendChild( btn1 );
      controls.appendChild( btn2 );

      //Or, in jQuery....
      var btn3 = document.createElement("button");
      $(btn3).text( "Reset!" );
      $(btn3).click( function() {
        t.reset();
      });

      var btn4 = document.createElement("button");
      $(btn4).text( "Hide tray");
      $(btn4).toggle( function(){
        t.showTray(false);
        $(this).text("Show tray");
      }, function() {
        t.showTray(true);
        $(this).text("Hide tray");
      });

      $("#template-controls").append( btn3, btn4 );

    }

    t.butterMediaLoaded = function( butter, media, popcorn ) {
    // This function runs every time the media source changes, or a project is loaded.
  
    }

    t.popcornReady = function( popcorn ) {
    //This function runs once in butter AND once in exported projects.
      
    }


    //RUN -------------------------------------

    if( Butter ) {

      Butter({
        config: t.config,
        ready: function( butter ){

          butter.media[ 0 ].onReady( function(){ console.log("foo") });

          function start() {
            t.butter = butter;

            t.butterMediaLoaded( butter, butter.media[ 0 ], butter.media[ 0 ].popcorn.popcorn );
            t.debug && console.log ( t.name + ": butterMediaLoaded" );

            t.popcornReady( butter.media[ 0 ].popcorn.popcorn );  
            t.eventWrapper( butter.media[ 0 ], "canplayall" ); //if canplay or canplayall is used, it must be removed.

            if( t.debug ) { t.tests(); } //tests for helpers
          }

          t.butterInit( butter, butter.media[ 0 ], butter.media[ 0 ].popcorn.popcorn, t.initCallback );
          t.debug && console.log( t.name + ": butterInit" );

          start();
          butter.listen( "mediaready", start );

          window.butter = butter;
        }
      });
    } else {
      t.popcornReady( Popcorn.instances[ 0 ] );
      t.debug && console.log( t.name + ": popcornReady" );
    }

  }(window.Butter));
}, false );
