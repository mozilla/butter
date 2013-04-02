var test = require( "tap" ).test,
    project,
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
  var poolProject = require( "../lib/project" )({
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
    t.ok( !poolProject.getSequelizeInstance().connectorManager.pool, "No pool exists" );
    t.ok( !err, "User created with sqlite db and ignored pool param" );
    t.end();
  });
});

test( "sqlite db setup", function( t ) {
  project = require( "../lib/project" )({
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

test( "create valid parameters", function( t ) {
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

  project.create( { email: mockEmail, data: mockData }, mockCallback );
});

test( "create invalid parameters - Project Data", function( t ) {
  t.plan( 2 );

  var mockCallback = function( err ) {
        t.ok( err, "Successfully received an error with invalid parameters" );
        t.equal( err, "Expected email and data on options object", "Reported expected error message" );

        t.end();
      };

  project.create( { email: mockEmail, data: null }, mockCallback );
});

test( "create invalid parameters - Email", function( t ) {
  t.plan( 2 );

  var mockCallback = function( err ) {
        t.ok( err, "Successfully received an error with invalid parameters" );
        t.equal( err, "Expected email and data on options object", "Reported expected error message for creation" );

        t.end();
      };

  project.create( {email: null, data: mockData }, mockCallback );
});

test( "delete invalid parameters - Project ID", function( t ) {
  t.plan( 2 );

  var mockCallback = function( err ) {
        t.ok( err, "Successfully received an error with invalid parameters" );
        t.equal( err, "not enough parameters to delete", "Reported expected error message for delete" );

        t.end();
      };

  project.delete( { email: mockEmail, id: null }, mockCallback );
});

test( "delete invalid parameters - Email", function( t ) {
  t.plan( 2 );

  var mockCallback = function( err ) {
        t.ok( err, "Successfully received an error with invalid parameters" );
        t.equal( err, "not enough parameters to delete", "Reported expected error message for delete" );

        t.end();
      };

  project.delete( { email: null, id: id }, mockCallback );
});

test( "delete valid parameters", function( t ) {
  t.plan( 1 );

  var mockCallback = function( err, p ) {
        var deleteCallback = function( err ) {
          t.false( err, "No error was passed back. Project successfully removed." );

          t.end();
        };

        project.delete( { email: mockEmail, id: p.id }, deleteCallback );
      };

  project.create( { email: mockEmail, data: mockData }, mockCallback );
});

test( "findAll valid parameters", function( t ) {
  t.plan( 2 );

  var mockCallback = function( err, docs ) {
        t.ok( Array.isArray( docs ), "Returned an array of projects" );
        t.ok( docs, "Successfully returned all projects for " + mockEmail );

        t.end();
      };

  project.findAll( { email: mockEmail }, mockCallback );
});

test( "findAll invalid parameters", function( t ) {
  t.plan( 2 );

  var mockCallback = function( err ) {
        t.ok( err, "Successfully received an error with invalid parameters" );
        t.equal( err, "Missing email parameter", "Reported expected error message for retrieving all projects" );

        t.end();
      };

  project.findAll( { email: null }, mockCallback );
});

test( "find valid parameters", function( t ) {
  t.plan( 2 );

  var mockCallback = function( err, project ) {
        t.ok( project, "Successfully received a project" );
        t.deepEqual( project.id, id, "ID of retrieved project matches." );

        t.end();
      };

  project.find( { id: id }, mockCallback );
});

test( "find invalid parameters", function( t ) {
  t.plan( 2 );

  var mockCallback = function( err ) {
        t.ok( err, "Successfully received an error with invalid parameters" );
        t.equal( err, "Missing Project ID", "Reported expected error message for retrieving by ID" );

        t.end();
      };

  project.find( null, mockCallback );
});

test( "find valid parameters", function( t ) {
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

  project.find( { email: mockEmail, id: id }, mockCallback );
});

test( "find invalid parameters - Project ID", function( t ) {
  t.plan( 2 );

  var mockCallback = function( err ) {
        t.ok( err, "Successfully received an error with invalid parameters" );
        t.equal( err, "Missing Project ID", "Reported expected error message for project retrieval" );

        t.end();
      };

  project.find( { email: mockEmail, id: null }, mockCallback );
});

test( "update valid parameters", function( t ) {
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

  project.update( { email: mockEmail, id: id, data: updateData }, mockCallback );
});

test( "update invalid parameters - Project Data", function( t ) {
  t.plan( 2 );

  var mockCallback = function( err ) {
        t.ok( err, "Successfully received an error with invalid parameters" );
        t.equal( err, "Expected email, id, and data parameters to update",
                 "Reported expected error message for project updating" );

        t.end();
      };

  project.update( { email: mockEmail, id: id, data: null }, mockCallback );
});

test( "update invalid parameters - Project ID", function( t ) {
  t.plan( 2 );

  var mockCallback = function( err ) {
        t.ok( err, "Successfully received an error with invalid parameters" );
        t.equal( err, "Expected email, id, and data parameters to update",
                 "Reported expected error message for project updating" );

        t.end();
      };

  project.update( { email: mockEmail, id: null, data: mockData }, mockCallback );
});

test( "update invalid parameters - Email", function( t ) {
  t.plan( 2 );

  var mockCallback = function( err ) {
        t.ok( err, "Successfully received an error with invalid parameters" );
        t.equal( err, "Expected email, id, and data parameters to update",
                 "Reported expected error message for project updating" );

        t.end();
      };

  project.update( { email: null, id: id, data: mockData }, mockCallback );
});
