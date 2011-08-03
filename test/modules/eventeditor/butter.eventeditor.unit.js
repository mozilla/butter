/*global text,expect,ok,module,notEqual,Butter,test,window*/
(function (window, document, undefined, Butter) {

  module ( "Editor Setup" );
  
  test( "Setup method", function() {
    var b = new Butter();
    expect(3);
    try {
      b.eventeditor();
      ok ( false, "did not throw error for missing param" );
    } catch (e) {
      ok ( true, "error properly thrown" );
    }
    try {
      b.eventeditor( 9001 );
      ok ( false, "did not throw error for invalid param (number)" );
    } catch (e) {
      ok ( true, "error properly thrown" );
    }
    try {
      b.eventeditor( "Hello World" );
      ok ( false, "did not throw error for invalid param ( string )" );
    } catch (e) {
      ok ( true, "error properly thrown" );
    }
  });
  
  test( "Extended Methods", function() {
    
    var b =  new Butter(),
      methodNames = [ "editTrackEvent", "addCustomEditor", "changeEditorTarget", "setDefaultEditor", "setEditorDims", "removeCustomEditor" ],
      method;
      
    expect( methodNames.length * 2 );
    b.eventeditor( { defaultEditor: "./../../../src/modules/eventeditor/defaultEditor.html" } );
    
    for ( var i = 0, l = methodNames.length; i < l; i++ ) {
      method = methodNames[i];
      ok ( b[ method ], method + " exists on the butter instance" );
      ok ( typeof b[ method ] === "function", method + " is a function" );
    }
  });
  
  test( "setEditorDims( dims )", function() {
    var b = new Butter();
    expect( 6 );
    b.eventeditor( { defaultEditor: "./../../../src/modules/eventeditor/defaultEditor.html" } );
     
    ok( !( b.setEditorDims() ) , "setEditorDims returns false with invalid param" );
    ok( !( b.setEditorDims( {} ) ), "setEditorDims returns false with invalid param" );
    ok( !( b.setEditorDims( function() {} ) ), "setEditorDims returns false with invalid param" );     
    ok( b.setEditorDims( { height: 100 } ), "setEditorDims succeeded in changing the height" );
    ok( b.setEditorDims( { width: 100 } ), "setEditorDims succeeded in changing the width" );
    ok( b.setEditorDims( { width: 100, height: 100 } ), "setEditorDims succeeded in changing height and width" );

  });
  
  test( "setDefaultEditor( newEditor)", function() {
    var b = new Butter(),
      sde;
    expect( 5 );
    b.eventeditor( { defaultEditor: "./../../../src/modules/eventeditor/defaultEditor.html" } );
    sde = b.setDefaultEditor;
    
    ok ( !sde(), "returns false without a param" );
    ok ( !sde( 9001 ), "returns false with numerical param" );
    ok ( !sde( {} ), "returns false with object as param" );
    ok ( !sde( function() {} ), "returns false with function as param" );
    ok ( sde( "pretendThisIsAnEditor.html" ) === "pretendThisIsAnEditor.html", "returns the new default editor url" );
  });
  
  test( "changeEditorTarget( newTarget, type )", function() {
    var b = new Butter(),
      wind;
    b.eventeditor( { defaultEditor: "./../../../src/modules/eventeditor/defaultEditor.html" } );
    expect(7);
    
    ok( b.changeEditorTarget(), "set to use new window when no params specified" );
    ok( !b.changeEditorTarget( "target" ), "returns false with missing type param" );
    ok( b.changeEditorTarget( undefined, "domtarget" ), "Set to use a new window if newEditor is undefined / falsy" );
    ok( !b.changeEditorTarget( "target", "gobbledygook" ), "returns false with invalid type param" );
    ok( b.changeEditorTarget( document.createElement( "div" ), "domtarget" ), "returns the new editorTarget" );
    ok( b.changeEditorTarget( "target-div", "domtarget" ), "returns the new editorTarget" );
    wind = window.open();
    ok( b.changeEditorTarget( wind, "domtarget" ), "returns the new editorTarget" );
    wind.close();
  });
  
  test( "addCustomEditor( editorSource, pluginType )", function() {
    var b = new Butter();
    expect( 4 );
    b.eventeditor( { defaultEditor: "./../../../src/modules/eventeditor/defaultEditor.html" } );
    
    ok( !b.addCustomEditor(), "returns false if no params provided");
    ok( !b.addCustomEditor( "URL.HTML" ), "returns false if only one param provided");
    ok( !b.addCustomEditor( undefined , ""), "returns false if first param is undefined");
    ok( b.addCustomEditor( "URL.HTML", "SOME-PLUGIN-TYPE"), "Sets the editor source for a plug-in type");
  });
  
  test( "removeCustomEditor( editorSource, pluginType )", function() {
    var b = new Butter();
    expect( 4 );
    b.eventeditor( { defaultEditor: "./../../../src/modules/eventeditor/defaultEditor.html" } );
    
    ok( !b.removeCustomEditor(), "returns false if no params provided");
    ok( !b.removeCustomEditor( "URL.HTML" ), "returns false if only one param provided");
    ok( !b.removeCustomEditor( undefined , ""), "returns false if first param is undefined");
    ok( !b.removeCustomEditor( "URL.HTML", "SOME-PLUGIN-TYPE"), "Sets the editor source for a plug-in type");
  });
  
  test( "editTrackEvent( trackEvent )", function() {
    var b = new Butter();
    b.eventeditor( { defaultEditor: "./../../../src/modules/eventeditor/defaultEditor.html" } );
    
    expect( 2 );
    
    b.listen( "trackeditstarted", function() {
      ok( false, "should return before calling trigger" );
    });
    
    ok( !b.editTrackEvent(), "returned false when no track event is provided" );
    ok( !b.editTrackEvent( { fakeData: "abc123" } ), "returns false if param is not a trackEvent instance" );
    
  });

})(window, document, undefined, Butter);
