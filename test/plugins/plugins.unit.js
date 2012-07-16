/*global Butter,asyncTest,equal,start,ok*/
(function(){
  // All modules that create Butter objects (e.g., Butter())
  // should use this lifecycle, and call rememberButter() for all
  // created butter instances.  Any created using createButter()
  // already have it done automatically.
  var butterLifeCycle = (function(){

    var _tmpButter;

    return {
      setup: function(){
        _tmpButter = [];
      },
      teardown: function(){
        var i = _tmpButter.length;
        while( i-- ){
          _tmpButter[ i ].clearProject();
          delete _tmpButter[ i ];
        }
      },
      rememberButter: function(){
        var i = arguments.length;
        while( i-- ){
          _tmpButter.push( arguments[ i ] );
        }
      }
    };

  }());

  function createButter( callback ) {
    Butter({
      config: "../test-config-core.json",
      debug: false,
      ready: callback
    });
  }

  module( "Plugins", butterLifeCycle );

  asyncTest( "Plugins added", 2, function() {
    createButter( function( butter ) {
      ok( !!Popcorn.manifest[ "text" ], "text plugin was loaded" );
      ok( !!Popcorn.manifest[ "image" ], "image plugin was loaded" );
      start();
    });
  });

  asyncTest( "Create element", 2, function() {
    createButter( function( butter ) {
      var plugin1 = butter.plugin.plugins[0],
          plugin2 = butter.plugin.plugins[1];

      // Taken from src/ui/module
      butter.ui.loadIcons( butter.config.value( "icons" ), butter.config.value( "dirs" ).resources || "" );

      plugin1.generateHelper();
      plugin2.generateHelper();

      equal( plugin1.helper.src, document.getElementById( "default-icon" ).src, "Default plugin icon is correct" );
      equal( plugin2.helper.src, document.getElementById( "image-icon" ).src, "Image plugin icon is correct" );

      start();
    });
  });

}());
