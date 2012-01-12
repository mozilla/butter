/*global text,expect,ok,module,notEqual,test,window*/
(function () {

  module ( "Plugin Manager" );
  
  asyncTest( "Check Existence and function availability", function() {
    expect( 4 );
    document.getElementById( "target-div" ).innerHTML = "";

    var b = new Butter({
      modules: {
        "pluginmanager": {
          target: "target-div"
        }
      },
      ready: function() {
        start();
        ok( b.pluginmanager, "pluginmanager method exists" );
        ok( b.pluginmanager.plugins, "plugins array available" );
        ok( b.pluginmanager.clear, "clear available" );
        ok( b.pluginmanager.add, "add available" );
      }
    });
  });

  asyncTest( "Check Existence and function availability", function() {
    expect( 3 );
    document.getElementById( "target-div" ).innerHTML = "";
    var b = new Butter({
      modules: {
        "pluginmanager": {
          target: "target-div"
        }
      },
      ready: function( e ) {
        var butter = e.data;
        start();
        butter.pluginmanager.add({
          name: "test1",
          type: "test1"
        });
        ok( butter.pluginmanager.plugins.length === 1, "There is one plugin" );
        ok( butter.pluginmanager.get( "test1" ), "Can grab the plugin instance" );
        butter.pluginmanager.clear();
        ok( butter.pluginmanager.plugins.length === 0, "No more plugins after clear" );
      }
    });
  });

})();
