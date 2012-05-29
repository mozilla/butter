/*global text,expect,ok,module,notEqual,Butter,test,window*/
(function (window, undefined) {

  require( [ "../src/core/config" ], function( Config ){

    module( "Config" );

    test( "Config members", function(){
      ok( Config.parse, "Config.parse exists" );

      var config = Config.parse( '{"foo":"bar"}' );
      ok( config.value, "Config.value exists" );
    });


    test( "Config.parse expects proper JSON string", function(){
      raises( function(){ Config.parse(); },
              "Config.parse expects an argument" );

      raises( function(){ Config.parse( '{"foo":"bar"' ); },
              "Config.parse throws if given bad JSON" );
    });


    test( "Variable substitution for baseDir", function(){
      // Specify a baseDir value, use replacement, use variable name
      // without substitution.
      var configJSON = JSON.stringify({
        "baseDir": "../../",
        "usesBaseDir": "{{baseDir}}sub/dir",
        "noBaseDir": "baseDir/sub/dir"
      });

      var config = Config.parse( configJSON );

      equal( config.value( "baseDir" ), "../../", "Getting property returns correct value" );
      equal( config.value( "usesBaseDir" ), "../../sub/dir", "Property with variable works" );
      equal( config.value( "noBaseDir" ), "baseDir/sub/dir", "Property with variable name works" );

    });


    test( "Variable validation works", function(){
      var configJSON = JSON.stringify({
        "number": 1,
        "bool": false,
        "object": {},
        "string": "string",
        "array": [ 1, 2, 3 ]
      });

      var config = Config.parse( configJSON );

      equal( config.value( "number" ), 1, "Config numbers works" );
      equal( config.value( "bool" ), false, "Config bool works" );
      deepEqual( config.value( "object" ), {}, "Config object works" );
      equal( config.value( "string" ), "string", "Config string works" );
      deepEqual( config.value( "array" ), [ 1, 2, 3 ], "Config array works" );

    });

    test( "Variable validation works", function(){
      var configJSON = JSON.stringify({
        "baseDir": "../../"
      });

      var config = Config.parse( configJSON );

      // Use an override, but leave out trailing /
      config.value( "baseDir", ".." );
      equal( config.value( "baseDir" ), "../", "Validate for baseDir added trailing /" );

      // Use an override, but leave out trailing /
      config.value( "baseDir", "../../../" );
      equal( config.value( "baseDir" ), "../../../", "Validate for baseDir didn't add a trailing /" );

    });

    test( "Overriding values", function(){
      var configJSON = JSON.stringify({
        "foo": "bar"
      });

      var config = Config.parse( configJSON );

      equal( config.value( "foo" ), "bar", "Parse sets proper initial value" );
      config.value( "foo", 2 );
      equal( config.value( "foo" ), 2, "Changing existing value works" );
      config.value( "baz", 1 );
      equal( config.value( "baz" ), 1, "Adding new config value works" );

    });

  });
}(window));
