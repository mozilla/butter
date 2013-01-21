var test = require( "tap" ).test,
    userLibrary = require( "../lib/user" );

var DB_USERNAME = process.env.DB_USERNAME || "root";
var DB_DATABASE = process.env.DB_DATABASE || "popcorn";
var DB_PASSWORD = process.env.DB_PASSWORD || "";
var DB_HOST = process.env.DB_HOST || "127.0.0.1";

var mockEmail = "test@example.org",
    mockData = {
      data: {
        test: "Hey Test Values"
      },
      email: mockEmail,
      name: "Test User",
      author: "Test User",
      template: "basic"
    };

var configWithPool = {
  database: DB_DATABASE,
  username: DB_USERNAME,
  password: DB_PASSWORD,
  options: {
    host: DB_HOST,
    dialect: "mysql",
    logging: false,
    pool: {
      maxConnections: 5,
      maxIdleTime: 1
    }
  }
};

var configWithoutPool = {
  database: DB_DATABASE,
  username: DB_USERNAME,
  password: DB_PASSWORD,
  options: {
    host: DB_HOST,
    dialect: "mysql",
    logging: false
  }
};

function Waiter( numItems, onCompleted, onCancelled ) {
  var _callbacks = [],
      _usedCallbacked = 0,
      _cancelled = false;

  this.wait = function( callback ) {
    _callbacks.push( callback );
    return function() {
      if ( ++_usedCallbacked === _callbacks.length ) {
        for ( var i = 0; i < _callbacks.length; ++i ) {
          if ( !_cancelled ) {
            _callbacks[ i ].apply( this, arguments );
            if ( _cancelled ) {
              onCancelled();
              return;
            }
          }
        }
        onCompleted();
      }
    };
  };

  this.cancel = function() {
    _cancelled = true;
  };

}

test( "mysql db pooling", function( t ) {
  var poolingUser, nonPoolingUser;

  var waiter = new Waiter( 2,
    function(){
      var projectWaiter = new Waiter( 2,
        function() {
          t.end();
        },
        function() {
          t.end();
        });

      poolingUser.createProject( mockEmail, mockData, projectWaiter.wait( function( err ) {
        t.ok( !err, "Pooling project created" );
        if ( err ) {
          projectWaiter.cancel();
        }
      }));
      nonPoolingUser.createProject( mockEmail, mockData, projectWaiter.wait( function( err ) {
        t.ok( !err, "Non-pooling project created" );
        if ( err ) {
          projectWaiter.cancel();
        }
      }));
    },
    function() {
      t.comment(  "\nWARNING: MySQL tests did NOT run.\n" +
                  "Make sure that the mysql server is running and a user '" + DB_USERNAME + "' exists with no password for the '" + DB_DATABASE + "' database." );
      // Just to leave room in comments.
      t.comment( "" );
      t.end();
    });

  poolingUser = userLibrary( configWithPool, waiter.wait( function( err ) {
    if ( err ) {
      waiter.cancel();
      return;
    }
    t.ok( poolingUser.getSequelizeInstance().connectorManager.pool, "Pool exists" );
  }));

  nonPoolingUser = userLibrary( configWithoutPool, waiter.wait( function( err ) {
    if ( err ) {
      waiter.cancel();
      return;
    }
    t.ok( !nonPoolingUser.getSequelizeInstance().connectorManager.pool, "No pool exists" );
  }));

});
