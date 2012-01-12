/*global text,expect,ok,module,notEqual,test,window*/
(function () {

  var butter;

  module ( "Editor Setup", {
    setup: function() {
      stop();
      new Butter({
        modules: {
          "eventeditor": {
            target: "target-div",
            defaultEditor: "defaultEditor.html",
            defaultTarget: "window"
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
  
  test( "Extended Methods", function() {
    
    var methodNames = [ "editTrackEvent", "addEditor", "removeEditor" ],
        method;
      
    expect( methodNames.length * 2 );
    
    for ( var i = 0, l = methodNames.length; i < l; i++ ) {
      method = methodNames[i];
      ok ( butter.eventeditor[ method ], method + " exists on the butter instance" );
      ok ( typeof butter.eventeditor[ method ] === "function", method + " is a function" );
    }
  });
  
  test( "setDimensions and size property", function() {
    expect( 4 );

    var te = butter.addMedia().addTrack().addTrackEvent({ type: "test" }),
        editor = butter.eventeditor.editTrackEvent( te );

    editor.setDimensions( 100, 200 );
    ok( editor.size.width === 100 && editor.size.height === 200, "setDimensions succeeded in changing the height" );
    editor.setDimensions( { width: 300 } );
    ok( editor.size.width === 300, "setDimensions succeeded in changing the width" );
    editor.setDimensions( { width: 400, height: 500 } )
    ok( editor.size.width === 400 && editor.size.height === 500, "setDimensions succeeded in changing height and width" );
    editor.size = { width: 600, height: 700 };
    ok( editor.size.width === 600 && editor.size.height === 700, "setDimensions succeeded in changing height and width" );

  });
  
  test( "addEditor( editorSource, pluginType )", function() {
    expect( 3 );
    try {
      butter.eventeditor.addEditor();
      ok( false, "throws error no params provided");
    }
    catch( e ) {
      ok( true, "throws error if no params provided" );
    }
    try {
      butter.eventeditor.addEditor( "beep" );
      ok( false, "throws error one param provided");
    }
    catch( e ) {
      ok( true, "throws error if one param provided" );
    }
    ok( butter.eventeditor.addEditor( "URL.HTML", "SOME-PLUGIN-TYPE"), "Sets the editor source for a plug-in type");
  });
  
  test( "removeEditor( pluginType )", function() {
    expect( 3 );
    var eventeditor = butter.eventeditor;
    ok( !eventeditor.removeEditor(), "returns nothing if no params provided");
    ok( !eventeditor.removeEditor( "some editor" ), "returns nothing if only one param provided");
    eventeditor.addEditor( "some editor", "some editor", "sometarget" );
    ok( eventeditor.removeEditor( "some editor" ), "editor is returned when removed" );
  });
  
  test( "editTrackEvent( trackEvent )", function() {
    expect( 2 );
    butter.listen( "trackeditstarted", function() {
      ok( false, "should return before calling trigger" );
    });
    
    try {
      butter.editTrackEvent();
      ok( false, "threw error when no track event is provided" );
    }
    catch( e ) {
      ok( true, "threw error when no track event is provided" );
    }

    try {
      butter.editTrackEvent( { foo: "bar" } );
      ok( false, "threw error when bad track event is provided" );
    }
    catch( e ) {
      ok( true, "threw error when bad track event is provided" );
    }
    
  });

})();
