(function ( window, document, undefined ) {

  define( [ "core/logger", "core/eventmanager" ] , function( Logger, EventManager ) {

    var MESSAGE_PREFIX = "BUTTER", MESSAGE_PREFIX_LENGTH = MESSAGE_PREFIX.length;

    var parseEvent = function ( e, win ) {
      if ( e.source !== win && e.data.indexOf( MESSAGE_PREFIX ) === 0 ) {
        return JSON.parse( e.data.substring( MESSAGE_PREFIX_LENGTH ) );
      } //if
    }; //parseEvent

    var CommClient = function ( name, onmessage ) {

      var id = CommClient.guid++,
          logger = new Logger( id ),
          em = new EventManager( { logger: logger } ),
          that = this;

      em.apply( "CommClient", this );

      window.addEventListener('message', function ( e ) {
        var data = parseEvent( e, window );
        if ( data ) {
          em.dispatch( data.type, data.message );
          onmessage && onmessage( data );
        } //if
      }, false);

      this.send = function ( message, type ) {
        if ( !type ) {
          postMessage( MESSAGE_PREFIX + JSON.stringify( message ), "*" );
        }
        else {
          postMessage( MESSAGE_PREFIX + JSON.stringify( { type: type, message: message } ), "*" );
        } //if
      }; //send

      this.async = function( message, type, handler ) {
        var wrapper = function( message ) {
          that.unlisten( type, wrapper );
          handler( message );
        }; //wrapper
        that.listen( type, wrapper ); 
        that.send( message, type );
      }; //async

      this.returnAsync = function( type, handler ) {
        that.listen( type, function( message ) {
          that.send( handler( message ), type );
        });
      }; //returnAsync

    }; //CommClient
    CommClient.guid = 0;

    var CommServer = function () {

      var id = CommServer.guid++,
          clients = {},
          logger = new Logger( id ),
          em = new EventManager( { logger: logger } ),
          that = this;

      em.apply( "CommServer", this );

      var Client = function( name, client, callback ) {

        var id = Client.guid++,
            clientWindow = client,
            logger = new Logger( id ),
            em = new EventManager( { logger: logger } ),
            that = this;

        em.apply( "Client", this );

        this.getName = function () {
          return name;
        };

        this.send = function ( message, type ) {
          if ( clientWindow ) {
            if ( !type ) {
              clientWindow.postMessage( MESSAGE_PREFIX + JSON.stringify( message ), "*" );
            }
            else {
              clientWindow.postMessage( MESSAGE_PREFIX + JSON.stringify( { type: type, message: message } ), "*" );
            } //if
          } //if
        }; //send

        this.async = function( message, type, handler ) {
          var wrapper = function( message ) {
            that.unlisten( type, wrapper );
            handler( message );
          }; //wrapper
          that.listen( type, wrapper ); 
          that.send( message, type );
        }; //async

        this.init = function( readyClient ) {
          clientWindow = readyClient;
          clientWindow.addEventListener( "message", function ( e ) {
            var data = parseEvent( e, window );
            if ( data ) {
              em.dispatch( data.type, data.message );
              callback && callback( data );
            } //if
          }, false );
        }; //init

        this.destroy = function() {
        }; //destroy

      }; //Client
      Client.guid = 0;

      this.bindFrame = function ( name, frame, readyCallback, messageCallback ) {
        clients[ name ] = new Client( name, frame.contentWindow, messageCallback );
        frame.addEventListener( "load", function ( e ) {
          clients[ name ].init( frame.contentWindow );
          readyCallback && readyCallback( e );
        }, false );
      };

      this.bindWindow = function ( name, win, readyCallback, messageCallback ) {
        clients[ name ] = new Client( name, win, messageCallback );
        win.addEventListener( "load", function ( e ) {
          clients[ name ].init( win );
          readyCallback && readyCallback( e );
        }, false );
      };

      this.bindClientWindow = function ( name, client, callback ) {
        clients[ name ] = new Client( name, client, callback );
        clients[ name ].init( client );
      };

      this.listen = function ( name, type, callback ) {
        clients[ name ] && clients[ name ].listen( type, callback );
      };

      this.unlisten = function ( name, type, callback ) {
        clients[ name ] && clients[ name ].unlisten( type, callback );
      };

      this.send = function ( name, message, type ) {
        clients[ name ] && clients[ name ].send( message, type );
      };

      this.async = function( name, message, type, handler ) {
        clients[ name ] && clients[ name ].async( message, type, handler );
      };

      this.destroy = function( name ) {
        if ( name ) {
          clients[ name ] && clients[ name ].destroy();
          delete clients[ name ];
        }
        else {
          for ( var clientName in clients ) {
            if ( clients.hasOwnProperty( clientName ) ) {
              clients[ clientName ].destroy();
              delete clients[ clientName ];
            } //if
          } //for
        } //if
      }; //destroy

    }; //CommServer
    CommServer.guid = 0;

    return {
      CommClient: CommClient,
      CommServer: CommServer,
      parseStartEvent: parseEvent
    };

  }); //define
})( window, window.document );
