(function ( window, document, undefined, Butter ) {

  module( "Previewer", {
    setup: function () {
    },
    teardown: function () {
    }
  } );

  test( "Iframe empty check", function () {
    expect( 1 );
    ok( document.getElementById( "notIframe" ).innerHTML === "", "Iframe is initially empty" );
  } );

  test( "Start Previewer", function() {
    expect( 0 );
    var butter = new Butter();

    butter.previewer( {
      layout: "../../../src/modules/previewer/layout.html",
      target: "notIframe",
      popcornURL: "http://popcornjs.org/code/dist/popcorn-complete.js",
      media: "http://videos-cdn.mozilla.net/serv/webmademovies/Moz_Doc_0329_GetInvolved_ST.webm",
      callback: function() {
        test( "Inside Callback", function() {
          expect( 9 );
          var layoutSrc = document.getElementById( "notIframe" ).src;
          ok( true, "Inside callback function" );
          ok( document.getElementById( "notIframe" ).contentWindow.document.innerHTML !== "", "Iframe has contents" );
          ok( layoutSrc.split("/")[ layoutSrc.split("/").length - 1 ] === "layout.html", "Iframes source is layout.html" );
          ok( butter.getTargets().length === 1, "Targets successfully scraped" );
          ok( butter.getTargets()[ 0 ].getName() === "div2", "Targets getName function working" );
          ok( butter.getAllMedia().length === 1, "Media targets successfully scraped" );
          ok( butter.getAllMedia()[ 0 ].getName() === "outerVideo", "Media targets getName function working" );
          ok( butter.getAllMedia()[ 0 ].getMedia() === "http://videos-cdn.mozilla.net/serv/webmademovies/Moz_Doc_0329_GetInvolved_ST.webm", "Media targets getMedia function working" );
          butter.buildPopcorn( "videoz", function() {
            test( "Popcorn functionality", function() {
              expect( 1 );
              
              ok( !!document.getElementById( "notIframe" ).contentWindow.popcorn, "Instance of popcorn available" );
            } );
          } );

          ok( butter.getPopcorn() !== "", "getPopcorn function working properly" );

        var track = butter.getTracks()[ 0 ] || butter.addTrack( new Butter.Track() );
        butter.addTrackEvent( track, new Butter.TrackEvent( {
          start: 1, end: 100, type: type, popcornOptions: {
            start: 1,
            end: 10,
            text: "ITS WORKING",
            target: butter.getTargets()[ 0 ].getName()
          }
        } ) );

          
        } );
      }
    } );
  } );

} )( window, document, undefined, Butter );
