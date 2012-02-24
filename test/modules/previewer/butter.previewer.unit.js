(function ( window, document, undefined, Butter ) {

  module( "Previewer", {
    setup: function () {
    },
    teardown: function () {
    }
  } );

  var butter = new Butter(),
      oldVideo;

  test( "Iframe empty check", function () {
    expect( 1 );
    ok( document.getElementById( "notIframe" ).innerHTML === "", "Iframe is initially empty" );
  } );

  test( "Inside Callback", function() {
    expect( 0 );

    butter.previewer( {
      layout: "../../../src/modules/previewer/layout.html",
      target: "notIframe",
      popcornURL: "http://popcornjs.org/code/dist/popcorn-complete.js",
      media: "http://videos-cdn.mozilla.net/serv/webmademovies/Moz_Doc_0329_GetInvolved_ST.webm",
      callback: function() {
        test( "Previewer Method Test", function() {
          expect( 9 );
          var layoutSrc = document.getElementById( "notIframe" ).src;
          ok( true, "Inside callback function" );
          ok( document.getElementById( "notIframe" ).contentWindow.document.innerHTML !== "", "Iframe has contents" );
          ok( layoutSrc.split("/")[ layoutSrc.split("/").length - 1 ] === "layout.html", "Iframes source is layout.html" );
          ok( butter.getTargets().length === 1, "Targets successfully scraped" );
          ok( butter.getTargets()[ 0 ].getName() === "div2", "Targets getName function working" );
          ok( butter.getAllMedia().length === 1, "Media targets successfully scraped" );
          ok( butter.getAllMedia()[ 0 ].getTarget( "id", "outerVideo" ) === "outerVideo", "Media targets getTarget function working" );
          ok( butter.getAllMedia()[ 0 ].getUrl() === "http://videos-cdn.mozilla.net/serv/webmademovies/Moz_Doc_0329_GetInvolved_ST.webm", "Media targets getUrl function working" );
          butter.buildPopcorn( butter.getAllMedia()[ 0 ], function() {
            test( "Popcorn functionality", function() {
              expect( 3 );
              
              ok( !!document.getElementById( "notIframe" ).contentWindow.Popcorn, "Popcorn is now available for use" );
              ok ( !!document.getElementById( "notIframe" ).contentWindow[ "popcorn0" ], "Uniquely named instance of popcorn is available" );
              ok ( typeof butter.getRegistry() === "object", "getRegistry is working properly" );
            } );
          } );

          ok( butter.getPopcorn() !== "", "getPopcorn function working properly" );
          setTimeout(function(){
            var track = butter.getTracks()[ 0 ] || butter.addTrack( new Butter.Track() );
            butter.addTrackEvent( track, new Butter.TrackEvent( {
              start: 1, end: 100, type: 'footnote', popcornOptions: {
                start: 1,
                end: 10,
                text: "ITS WORKING",
                target: butter.getTargets()[ 0 ].getName()
              }
            } ) ); 
          }, 1000 );
        } );
      }      
    } );
  } );


  butter.listen( "trackeventadded", function( e ) {
    test ( "TrackEvent Added", function() {
      ok( true, "Inside track Event added" );
      var add = function() {
        for( item in butter.getTrackEvents() ) {
          if( butter.getTrackEvents()[ item ].length > 0 ) {
            ok( butter.getTrackEvents()[ item ].length > 0, "Track Event exists" );
            butter.removeTrackEvent( e.data.getName() );
          } else { 
           setTimeout( function() { add(); }, 10 ); 
          }
        } 
      }
      add();
    } );
  } );

  butter.listen( "trackeventremoved", function( e ) {
     test( "TrackEvent Removed", function() {
          
      var media = butter.addMedia( { 
        target: "outerVideo", 
        url: "http://clips.vorwaerts-gmbh.de/VfE.ogv" 
      } );

      ok( true, "Inside trackEvent removed" );

      var remove = function( item ) {
        if( butter.getTrackEvents()[ item ][ 0 ] === undefined ) {

          butter.listen( "mediachanged", function( e ) {

            test( "Media Changed", function() {

            ok( true, "Inside Media Changed listener" );
            ok( butter.getAllMedia()[ 0 ].getName() !== oldVideo, "Current video is different from previous video" );

            } );
          } );

          setTimeout( function() {
            butter.setMedia( media );
          }, 1000);
              
        } else {
         setTimeout( function() {
          remove( item );
         }, 10 ); 
        }
      }
      for( item in butter.getTrackEvents() ) {

        ok( butter.getTrackEvents()[ item ][ 0 ] === undefined, "No Track Events Exist" );
        remove( item );
      }
    } );
  } );
} )( window, document, undefined, Butter );
