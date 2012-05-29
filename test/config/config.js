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

    test( "Merging Configurations", function(){
      var config1 = Config.parse( JSON.stringify({"foo1": "bar1"}) ),
          config2 = Config.parse( JSON.stringify({"foo2": "bar2"}) );

      config1.merge( config2 );

      equal( config1.value( "foo1" ), "bar1", "config1 uses its own values" );
      equal( config1.value( "foo2" ), config2.value( "foo2" ), "config1 uses merged values" );

    });

    test( "Deep property access", function(){
      var baseDirString = "../../../",
          configJSON = JSON.stringify({
            "baseDir": baseDirString,
            "parent": {
              "child1": {
                "grandchild1": "{{baseDir}}grandchild1"
              },
              "child2": "{{baseDir}}child2"
            }
          }), config = Config.parse( configJSON );

      equal( config.value( "baseDir" ), baseDirString, "baseDir variable is present." );
      equal( config.value( "parent" ).child2, baseDirString + "child2", "child2 path replaced" );
      equal( config.value( "parent" ).child1.grandchild1,
             baseDirString + "grandchild1",
             "grandchild1 path replaced" );

    });

    test( "Merge and override", function(){

      var configJSON1 = JSON.stringify({
        "baseDir": "./",
        "child": "{{baseDir}}child"
      }),
      configJSON2 = JSON.stringify({
        "baseDir": "../../",
        "child": "{{baseDir}}child"
      }),
      configJSON3 = JSON.stringify({
        "baseDir": "../../../",
        "child": "{{baseDir}}child"
      }),
      config1 = Config.parse( configJSON1 ),
      config2 = Config.parse( configJSON2 ),
      config3 = Config.parse( configJSON3 );

      // Sanity test value substitution with no overrides
      notEqual( config1.value( "child" ), config2.value( "child" ), "Merged values use override values" );
      equal( config1.value( "child" ), "./child", "Proper baseDir value used for config1" );
      equal( config2.value( "child" ), "../../child", "Proper baseDir value used for config2" );

      // Override config1 with config2
      config1.merge( config2 );
      equal( config1.value( "child" ), config2.value( "child" ), "Merged values use override values" );

      // Override config1 with config3
      config1.merge( config3 );
      equal( config1.value( "child" ), config3.value( "child" ), "Merged values use override values" );
    });

  });

}(window));
