/*global text,expect,ok,module,notEqual,Butter,test,window*/
(function (window, document, undefined, Butter) {

  module("Comm", {
    setup: function () {
    },
    teardown: function () {
    }
  });

  document.addEventListener( 'DOMContentLoaded', function (e) {

    var butter = Butter();

    var server = new Butter.CommServer();

    test( "iframe communication" , function () {
      var iframe = document.createElement( 'iframe' );
      iframe.src = "commtest.html";

      var tests = [];

      server.bindFrame( "test", iframe, 
        function ( e ) {
          server.listen( "test", "test1", function ( message ) {
            tests[1] = message;
          });
          server.listen( "test", "test2", function ( message ) {
            tests[2] = message;
          });
          server.send( "test", "joy" );
          server.send( "test", "joy", "test1" );
          server.send( "test", "joy", "test2" );
        },
        function ( message ) {
          tests[3] = message;
        });

      document.body.appendChild( iframe );

      stop();

      setTimeout( function () {
        ok( tests[1] === "test1 received", "test1 event handler" );
        ok( tests[2] === "test2 received", "test2 event handler" );
        ok( tests[3] !== undefined, "general message handler" );
        start();
      }, 2000 );
    });

    test( "window communication" , function () {
      var win = window.open( "commtest.html" );

      var tests = [];

      server.bindWindow( "wintest", win, 
        function ( e ) {
          server.listen( "wintest", "test1", function ( message ) {
            tests[1] = message;
          });
          server.listen( "wintest", "test2", function ( message ) {
            tests[2] = message;
          });
          server.send( "wintest", "joy" );
          server.send( "wintest", "joy", "test1" );
          server.send( "wintest", "joy", "test2" );
        },
        function ( message ) {
          tests[3] = message;
        });

      stop();

      setTimeout( function () {
        ok( tests[1] === "test1 received", "test1 event handler" );
        ok( tests[2] === "test2 received", "test2 event handler" );
        ok( tests[3] !== undefined, "general message handler" );
        start();
      }, 2000 );
    });


  }, false );

})(window, document, undefined, Butter);
