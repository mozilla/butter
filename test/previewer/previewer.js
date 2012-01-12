/*global text,expect,ok,module,notEqual,test,window*/
(function () {

  var butter;

  module ( "Previewer Setup", {
    setup: function() {
      stop();
      new Butter({
        modules: {
          "previewer": {
            target: "target-iframe",
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

  var oldVideo;

  if( /file/.test( location.protocol ) ) {
    throw "Tests must be run from a web server";
  }

  test( "Previewer startup", function () {
    expect( 2 );
    ok( butter.previewer !== undefined, "previewer exists" );
    ok( butter.previewer.Preview !== undefined, "Preview exists" );
  });

  asyncTest( "Preview basic functionality", function() {
    expect( 7 );
    butter.previewer.Preview({
      template: "template-basic.html",
      defaultMedia: "../sample.oga",
      importData: undefined,
      onload: function( preview ) {
        start();
        equal( preview.type, "basic", "booted up properly" );
        ok( butter.currentMedia.registry, "registry is not empty" );
        ok( butter.media.length === 1, "1 media" );
        ok( butter.media[ 0 ].url === "../sample.oga", "media url is correct" );
        ok( butter.targets.length === 2, "2 targets" );
        ok( butter.getTarget({ name: "sample-div-1" }), "target1 is correct" );
        ok( butter.getTarget({ name: "sample-div-2" }), "target2 is correct" );
      }
    });
  });

  asyncTest( "Preview custom functionality", function() {
    expect( 6 );
    butter.previewer.Preview({
      template: "template-custom.html",
      defaultMedia: "../sample.oga",
      importData: undefined,
      onload: function( preview ) {
        start();
        equal( preview.type, "custom", "booted up properly" );
        ok( butter.currentMedia.registry, "registry is not empty" );
        ok( butter.media.length === 1, "1 media" );
        ok( butter.media[ 0 ].url === "../sample.oga", "media url is correct" );
        ok( butter.targets.length === 1, "1 target" );
        ok( butter.targets[ 0 ].name === "div2", "target is correct" );
      } //onload
    });
  });

})();
