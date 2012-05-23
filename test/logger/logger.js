/*global text,expect,ok,module,notEqual,Butter,test,window*/
(function (window, undefined) {

  require( [ "../src/core/logger" ], function( Logger ){

    // Re-route console.log to a callback
    var initialLoggerState = Logger.enabled(),
      nativeConsole = window.console,
      console = {
        callback: null,
        log: function( m ){
          var callback = this.callback;
          callback && callback( m );
        }
      };
    window.console = console;

    // Clean-up the Logger.enabled state after each test run
    module( "Logger", {
      setup: function(){},
      teardown: function(){
        Logger.enabled( initialLoggerState );
      }
    });

    test( "Logging.enabled", function(){
      ok( !Logger.enabled(), "Logging.enabled is false by default" );
    });

    asyncTest( "Logger.log", 1, function (){
      console.callback = function( s ){
        equal( s, "[test] message", "Logger.log prints correct value" );
        start();
      };

      Logger.enabled( true );
      var logger = new Logger( "test" );
      logger.log( "message" );
    });

    asyncTest( "Logger.log and Logger.enabled", 1, function (){
      var logs = "";

      // Custom logger to accumulate log messages
      console.callback = function( s ){
        logs += s;
      };

      // By default, logging is off, these shouldn't get added to logs
      var logger = new Logger( "test" );
      logger.log( "message-1" );
      logger.log( "message-2" );

      // Now enable logging and make sure last message is only one we've seen
      Logger.enabled( true );
      console.callback = function( s ){
        logs += s;
        equal( logs, "[test] message-3", "Logger.log obeys Logger.enabled" );
        start();
      };
      logger.log( "message-3" );
    });

    asyncTest( "Logger.error", 1, function (){
      Logger.enabled( true );
      var logger = new Logger( "test" );
      try {
        logger.error( "message" );
      } catch( e ){
        equal( e.message, "[test] message", "Logger.error throws correct error" );
      } finally {
        start();
      }
    });

    asyncTest( "Logger.error obeys Logger.enabled", 1, function (){
      Logger.enabled( false );
      var logger = new Logger( "test" ),
        count = 0;
      try {
        logger.error( "message" );
      } catch( e ){
        count++;
      } finally {
        count++;
        equal( 1, count, "Logger.error doesn't throw when Logger.enabled is false" );
        start();
      }
    });

  });
}(window));
