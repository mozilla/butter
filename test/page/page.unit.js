/*global text,expect,ok,module,notEqual,Butter,test,window*/
require( [ "../src/core/page", "../src/core/config", "../src/dependencies" ], function( Page, Config, Dependencies ) {
  var _iframe,
      _butter,
      _config = Config.parse( JSON.stringify( {
          "baseDir": "../../", 
          "dirs": { 
            "popcorn-js": "{{baseDir}}external/popcorn-js/"
          },
          "player": {
            "players": [
              {
                "type": "youtube",
                "path": "{{baseDir}}external/popcorn-js/players/youtube/popcorn.youtube.js"
              }
            ]
          }
        }
      )),
      _loader = Dependencies( _config ),
      _page = new Page( _loader, _config );

  module( "Page" );

  function startTests() {

    asyncTest( "scrape media target and media elements", 3, function() {
      var scrapedPage;

      scrapedPage = _butter.page.scrape();

      ok( scrapedPage, "Scrape Returned an Object" );
      equal( scrapedPage.media.length, 1, "Scrape retrieved one media element" );
      equal( scrapedPage.target.length, 2, "Scrape retrieved two target elements" );
      start();
    });

    asyncTest( "getHTML generation", 1, function() {
      var html = _butter.page.getHTML(),
          xhr = new XMLHttpRequest();

      xhr.open( "GET", "expectedPage.html", false );
      xhr.onreadystatechange = function() {
        if ( xhr.readyState === 4 ) {
          equal( xhr.responseText, html, "getHTML generated expected html." );
          start();
          addPlayerScript();
        }
      }
      xhr.send();
    });
  }

  function loadIframe() {
    // Halt the tests from running
    stop();
    // load iframe into current doc
    _iframe = document.createElement( "iframe" );
    _iframe.onload = function() {
      setTimeout( function() {
        _butter = _iframe.contentWindow.Butter.instances[ 0 ];
        start();
        _butter.media[ 0 ].onReady( startTests );
      }, 1500 );
    }
    _iframe.src = "test.html";
    document.body.appendChild( _iframe );
  }

  asyncTest( "prepare script loading", 2, function() {
    function checkScripts() {
      ok( window.Popcorn, "prepare successfully loaded the Popcorn script" );
      ok( window.Popcorn.player, "prepare successfully loaded the Popcorn Player Module script" );
      start();
    }

    _page.prepare( checkScripts );
  });

  asyncTest( "addPlayerType player script loading", 1, function() {
    var _type = "vimeo";
    function checkPlayerScript( type ) {
      ok( true, "addPlayerType made it through to it's callback. " + type + " script will have been added to the page" );
      start();
      loadIframe();
    }
    _page.addPlayerType( _type, checkPlayerScript( _type ) );
  });
  
});