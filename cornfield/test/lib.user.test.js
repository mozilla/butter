var test = require( "tap" ).test,
    user,
    mockEmail = "test@example.org",
    mockData = {
      data: {
        test: "Hey Test Values"
      },
      email: mockEmail,
      name: "Test User",
      author: "Test User",
      template: "basic"
    },
    id;

test( "sqlite db setup with incorrect pool params", function( t ) {
  var poolUser = require( "../lib/user" )({
    database: "popcorn",
    options: {
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      pool: {
        maxConnections: 5,
        maxIdleTime: 1
      }
    }
  }, function( err ) {
    t.ok( !poolUser.getSequelizeInstance().connectorManager.pool, "No pool exists" );
    t.ok( !err, "User created with sqlite db and ignored pool param" );
    t.end();
  });
});

test( "sqlite db setup", function( t ) {
  user = require( "../lib/user" )({
    database: "popcorn",
    options: {
      dialect: "sqlite",
      storage: ":memory:",
      logging: false
    }
  }, function( err ) {
    t.ok( !err, "User created with sqlite db" );
    t.end();
  });
});

test( "createProject valid parameters", function( t ) {
  t.plan( 6 );

  var mockCallback = function( err, project ) {
    // Store ID for later tests
    id = project.id;

    t.ok( project, "Project has data" );
    t.equal( project.data, JSON.stringify( mockData.data ), "Properly Set Data of Project" );
    t.equal( project.email, mockData.email, "Properly Set Email of Project" );
    t.equal( project.name, mockData.name, "Properly Set Name of Project" );
    t.equal( project.author, mockData.author, "Properly Set Author of Project" );
    t.equal( project.template, mockData.template, "Properly Set Template of Project" );

    t.end();
  };

  user.createProject( mockEmail, mockData, mockCallback );
});

test( "createProject invalid parameters - Project Data", function( t ) {
  t.plan( 2 );

  var mockCallback = function( err ) {
        t.ok( err, "Successfully received an error with invalid parameters" );
        t.equal( err, "not enough parameters to update", "Reported expected error message" );

        t.end();
      };

  user.createProject( mockEmail, null, mockCallback );
});

test( "createProject invalid parameters - Email", function( t ) {
  t.plan( 2 );

  var mockCallback = function( err ) {
        t.ok( err, "Successfully received an error with invalid parameters" );
        t.equal( err, "not enough parameters to update", "Reported expected error message for creation" );

        t.end();
      };

  user.createProject( null, mockData, mockCallback );
});

test( "deleteProject invalid parameters - Project ID", function( t ) {
  t.plan( 2 );

  var mockCallback = function( err ) {
        t.ok( err, "Successfully received an error with invalid parameters" );
        t.equal( err, "not enough parameters to delete", "Reported expected error message for delete" );

        t.end();
      };

  user.deleteProject( mockEmail, null, mockCallback );
});

test( "deleteProject invalid parameters - Email", function( t ) {
  t.plan( 2 );

  var mockCallback = function( err ) {
        t.ok( err, "Successfully received an error with invalid parameters" );
        t.equal( err, "not enough parameters to delete", "Reported expected error message for delete" );

        t.end();
      };

  user.deleteProject( null, id, mockCallback );
});

test( "deleteProject valid parameters", function( t ) {
  t.plan( 1 );

  var mockCallback = function( err, project ) {
        var deleteCallback = function( err ) {
          t.false( err, "No error was passed back. Project successfully removed." );

          t.end();
        };

        user.deleteProject( mockEmail, project.id, deleteCallback );
      };

  user.createProject( mockEmail, mockData, mockCallback );
});

test( "findAllProjects valid parameters", function( t ) {
  t.plan( 2 );

  var mockCallback = function( err, docs ) {
        t.ok( Array.isArray( docs ), "Returned an array of projects" );
        t.ok( docs, "Successfully returned all projects for " + mockEmail );

        t.end();
      };

  user.findAllProjects( mockEmail, mockCallback );
});

test( "findAllProjects invalid parameters", function( t ) {
  t.plan( 2 );

  var mockCallback = function( err ) {
        t.ok( err, "Successfully received an error with invalid parameters" );
        t.equal( err, "not enough parameters to search", "Reported expected error message for retrieving all projects" );

        t.end();
      };

  user.findAllProjects( null, mockCallback );
});

test( "findById valid parameters", function( t ) {
  t.plan( 2 );

  var mockCallback = function( err, project ) {
        t.ok( project, "Successfully received a project" );
        t.deepEqual( project.id, id, "ID of retrieved project matches." );

        t.end();
      };

  user.findById( id, mockCallback );
});

test( "findById invalid parameters", function( t ) {
  t.plan( 2 );

  var mockCallback = function( err ) {
        t.ok( err, "Successfully received an error with invalid parameters" );
        t.equal( err, "not enough parameters for search", "Reported expected error message for retrieving by ID" );

        t.end();
      };

  user.findById( null, mockCallback );
});

test( "findProject valid parameters", function( t ) {
  t.plan( 7 );

  var mockCallback = function( err, project ) {
        t.ok( project, "Project was retrieved" );
        t.deepEqual( project.id, id, "Project has correct id" );
        t.equal( project.data, JSON.stringify( mockData.data ), "Properly Set Data of Project" );
        t.equal( project.email, mockData.email, "Properly Set Email of Project" );
        t.equal( project.name, mockData.name, "Properly Set Name of Project" );
        t.equal( project.author, mockData.author, "Properly Set Author of Project" );
        t.equal( project.template, mockData.template, "Properly Set Template of Project" );

        t.end();
      };

  user.findProject( mockEmail, id, mockCallback );
});

test( "findProject invalid parameters - Project ID", function( t ) {
  t.plan( 2 );

  var mockCallback = function( err ) {
        t.ok( err, "Successfully received an error with invalid parameters" );
        t.equal( err, "not enough parameters to search", "Reported expected error message for project retrieval" );

        t.end();
      };

  user.findProject( mockEmail, null, mockCallback );
});

test( "findProject invalid parameters - Email", function( t ) {
  t.plan( 2 );

  var mockCallback = function( err ) {
        t.ok( err, "Successfully received an error with invalid parameters" );
        t.equal( err, "not enough parameters to search", "Reported expected error message for project retrieval" );

        t.end();
      };

  user.findProject( null, id, mockCallback );
});

test( "updateProject valid parameters", function( t ) {
  t.plan( 4 );

  var updateData = {
        data: {
          test: "NEW TEXT"
        },
        name: "Test Userd",
        author: "Test Userd",
        template: "advanced"
      },
      mockCallback = function( err, project ) {
        t.equal( project.data, JSON.stringify( updateData.data ), "Properly updated Data of Project" );
        t.equal( project.name, updateData.name, "Properly updated Name of Project" );
        t.equal( project.author, updateData.author, "Properly updated Author of Project" );
        t.equal( project.template, updateData.template, "Properly updated Template of Project" );

        t.end();
      };

  user.updateProject( mockEmail, id, updateData, mockCallback );
});

test( "updateProject invalid parameters - Project Data", function( t ) {
  t.plan( 2 );

  var mockCallback = function( err ) {
        t.ok( err, "Successfully received an error with invalid parameters" );
        t.equal( err, "not enough parameters to update", "Reported expected error message for project updating" );

        t.end();
      };

  user.updateProject( mockEmail, id, null, mockCallback );
});

test( "updateProject invalid parameters - Project ID", function( t ) {
  t.plan( 2 );

  var mockCallback = function( err ) {
        t.ok( err, "Successfully received an error with invalid parameters" );
        t.equal( err, "not enough parameters to update", "Reported expected error message for project updating" );

        t.end();
      };

  user.updateProject( mockEmail, null, mockData, mockCallback );
});

test( "updateProject invalid parameters - Email", function( t ) {
  t.plan( 2 );

  var mockCallback = function( err ) {
        t.ok( err, "Successfully received an error with invalid parameters" );
        t.equal( err, "not enough parameters to update", "Reported expected error message for project updating" );

        t.end();
      };

  user.updateProject( null, id, mockData, mockCallback );
});
