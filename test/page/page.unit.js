/*global text,expect,ok,module,notEqual,Butter,test,window*/
require( [ "../src/core/page", "../src/core/config", "../src/dependencies" ], function( Page, Config, Dependencies ) {
  var _config = Config.parse( JSON.stringify({
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

  function createButter( callback ){

    Butter({
      config: "test-config.json",
      debug: false,
      ready: function( butter ){
        function runTests() {
          callback( butter );
        }
        butter.currentMedia.onReady( runTests );
      }
    });
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
    createButter( function( butter ) {
      var _type = "youtube";
      function checkPlayerScript( type ) {
        ok( true, "addPlayerType made it through to it's callback. " + type + " script will have been added to the page" );
        start();
      }
      butter.page.addPlayerType( _type, checkPlayerScript( _type ) );
    });
  });

  asyncTest( "scrape media target and media elements", 2, function() {
    createButter( function( butter ) {
      var scrapedPage;

      scrapedPage = butter.page.scrape();

      equal( scrapedPage.media.length, 1, "Scrape retrieved one media element" );
      equal( scrapedPage.target.length, 2, "Scrape retrieved two target elements" );
      start();
    });
  });

  asyncTest( "getHTML functionality", 9, function() {
    createButter( function( butter ) {
      var fakeScript = [ "var i = 1 + 1;" ],
          html = butter.page.getHTML( fakeScript ),
          testDiv = document.createElement( "div" ),
          headString = html.substring( html.indexOf( "<head>" ) + 6, html.indexOf( "</head>" ) ),
          expectedBaseSrc = location.protocol + "//" + location.hostname + ( location.port ? ":" + location.port : "" ) + "/test/page/",
          bodyString = html.substring( html.indexOf( "<body>" ) + 6, html.indexOf( "</body>" ) );

      // inject elements into div to test for expected elements
      testDiv.innerHTML = headString;

      // Check that all the expected butter attributes were removed
      equal( html.indexOf( "data-butter-source" ), -1, "Removed all data-butter-source attributes" );
      equal( html.indexOf( "data-butter-exclude" ), -1, "Removed all data-butter-exclude elements" );
      equal( html.indexOf( "data-butter-default" ), -1, "Removed all data-butter-default attributes" );

      var baseTag = testDiv.getElementsByTagName( "base" )[ 0 ];

      equal( baseTag.href, expectedBaseSrc, "Generated expected base tag" );

      testDiv.innerHTML = bodyString;

      var popcornScripts = testDiv.getElementsByTagName( "script" )[ 0 ],
          butterCleanDiv = testDiv.querySelector( "#test" );

      ok( !butterCleanDiv.hasAttribute( "butter-clean" ), "Removed the butter-clean attribute" );
      ok( !butterCleanDiv.hasAttribute( "data-butter" ), "Removed the data-butter attribute on element with butter-clean=true" );
      ok( !butterCleanDiv.hasAttribute( "data-butter-default" ), "Removed the data-butter-default attribute on element with butter-clean=true" );
      ok( popcornScripts, "getHTML generated a script element in the body" );
      ok( popcornScripts.innerHTML.indexOf( fakeScript[ 0 ] ), "Added expected popcornScripts to the HTML" );
      start();
    });
  });

});
