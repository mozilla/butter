/*global text,expect,ok,module,notEqual,Butter,test,window*/
(function (window, document, undefined, Butter) {

  module ( "Tray Setup" );
  
  test( "Check Existence", function() {
    var b = new Butter();
    expect(2);
    ok( b.plugintray, "plugintray method exists" );
    ok( typeof b.plugintray === "function", "butter.plugintray() is a function" );
  });

})(window, document, undefined, Butter);
