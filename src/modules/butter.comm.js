(function (window, document, undefined, Butter) {

  Butter.registerModule( "comm", {

    setup: function ( options ) {
    },

    extend: {

      CommClient: function ( name, onmessage ) {

        var listeners = {};

        window.addEventListener('message', function (e) {
          if ( e.source !== window ) {
            onmessage && onmessage( e.data );
          } //if
        }, false);

        this.listen = function ( type, callback ) {
          if (type && callback) {
            if ( !listeners[ type ] ) {
              listeners[ type ] = [];
            } //if
            listeners[ type ].push( callback );
            return callback;
          }
          else {
            throw new Error('Must provide a type and callback for CommClient listeners');
          } //if
        };

        this.forget = function ( type, callback ) {
          if ( !callback ) {
            delete listeners[ type ];
          }
          else {
            var idx = listeners[ type ].indexOf( callback );
            if ( idx > -1 ) {
              var callback = listeners[ type ][ idx ];
              listeners.splice( idx, 1 );
              return callback;
            } //if
          } //if
        };

        this.send = function ( message, type ) {
          if ( !type ) {
            postMessage( message, "*" );
          }
          else {
            postMessage( { type: type, message: message }, "*" );
          } //if
        };

      }, //CommClient

      CommServer: function () {

        var clients = {};
        var that = this;

        function Client ( name, client, callback ) {

          var listeners = {};

          this.getName = function () {
            return name;
          };

          this.listen = function ( type, callback ) {
            if (type && callback) {
              if ( !listeners[ type ] ) {
                listeners[ type ] = [];
              } //if
              listeners[ type ].push( callback );
              return callback;
            }
            else {
              throw new Error('Must provide a type and callback for CommServer listeners');
            } //if
          };

          this.forget = function ( type, callback ) {
            if ( !callback ) {
              delete listeners[ type ];
            }
            else {
              var idx = listeners[ type ].indexOf( callback );
              if ( idx > -1 ) {
                var callback = listeners[ type ][ idx ];
                listeners.splice( idx, 1 );
                return callback;
              } //if
            } //if
          };

          this.send = function ( message, type ) {
            if ( !type ) {
              client.postMessage( message, "*" );
            }
            else {
              client.postMessage( { type: type, message: message }, "*" );
            } //if
          }; //send

          client.addEventListener( "message", function (e) {
            if ( e.source === client ) {
              if ( e.data.type && listeners[ e.data.type ] ) {
                var list = listeners[ e.data.type ];
                for ( var i=0; i<list.length; ++i ) {
                  list[i]( e.data.message );
                } //for
              } //if
              callback && callback( e.data );
            } //if
          }, false );

        } //Client

        this.bindFrame = function ( name, frame, readyCallback, messageCallback ) {
          frame.addEventListener( "load", function (e) {
            that.bindClientWindow( name, frame.contentWindow, messageCallback );
            readyCallback( e );
          }, false );
        };

        this.bindClientWindow = function ( name, client, callback ) {
          clients[ name ] = new Client( name, client, callback );
        };

        this.listen = function ( name, type, callback ) {
          clients[ name ] && clients[ name ].listen( type, callback );
        };

        this.forget = function ( name, type, callback ) {
          clients[ name ] && clients[ name ].forget( type, callback );
        };

        this.send = function ( name, message, type ) {
          clients[ name ] && clients[ name ].send( message, type );
        };

      } //CommServer

    }, //extend

  });
})(window, document, undefined, Butter);
