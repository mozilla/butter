/*global text,expect,ok,module,notEqual,test,window*/

/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

( function ( window, document, undefined ){

  QUnit.config.reorder = false;

  document.addEventListener( "DOMContentLoaded", function(){

    Butter.init({
      config: "cornfield-test-config.json",
        ready: function( butter ) {
          var filename = "test" + Date.now(),
              data = {
                name: filename,
                html: "herpderp",
                data: { stuff: "derpherp" },
                template: "popup"
              },
              stringedData = JSON.stringify( data );

          module( "Server State" );

          // Make sure the cornfield server is running before bothering with all these tests.
          asyncTest( "Environment ", 1, function() {
            var request = new XMLHttpRequest();
            request.open( 'GET', '/api/whoami', false );
            request.send();
            if ( request.status === 404 ) {
              ok( false, "Cornfield server not running on node server, skipping tests." );
            } else {
              ok( true, "Cornfield server is running on node server, running Tests." );
            }
            start();
          });

          module( "Unauthenticated tests" );

          asyncTest( "Logout", 1, function() {
            butter.cornfield.logout( function( res ) {
              equal( res, true, "Clean-up" );

              start();
            });
          });

          test( "Sync API", 4, function() {
            ok( !butter.cornfield.authenticated(), "Authenticated is false" );
            ok( !butter.cornfield.email(), "Email is undefined" );
            ok( !butter.cornfield.name(), "Name is undefined" );
            ok( !butter.cornfield.username(), "Username is undefined" );
          });

          asyncTest( "Async API", 3, function() {

            butter.cornfield.list( function( res ) {
              deepEqual( res, { error: "unauthorized" }, "Not allowed to list projects" );

              butter.cornfield.load( filename, function( res ) {
                deepEqual( res, { error: "unauthorized" }, "Not allowed to get projects" );

                butter.cornfield.save( filename, stringedData, function( res ) {
                  deepEqual( res, { error: "unauthorized" }, "Not allowed to save projects" );

                  start();
                });
              });
            });
          });

          asyncTest( "/api/whoami", 1, function() {
            butter.cornfield.whoami( function( res ) {
              deepEqual( res, { error: "unauthorized" }, "Response is unauthorized" );
              start();
            });
          });

          module( "Authentication tests" );

          asyncTest( "Login (user input needed)", 6, function() {
            butter.cornfield.login( function( res ) {
              clearTimeout( failSafe );
              ok( res, "The login response has data" );
              ok( !res.error, "okay", "No errors while logging in" );
              ok( res.email, "The login has an email: " + res.email );
              equal( res.email, butter.cornfield.email(), "Email is stored" );
              equal( res.name, butter.cornfield.name(), "Name is stored" );
              equal( res.username, butter.cornfield.username(), "Name is stored" );
              start();
            });

            var failSafe = setTimeout( function() {
              clearTimeout( failSafe );
              start();
            }, 20000 );
          });

          module( "Authenticated tests" );

          test( "Sync API", 4, function() {
            ok( butter.cornfield.authenticated(), "Authenticated is true" );
            ok( butter.cornfield.email(), "Email is a truthy value" );
            ok( butter.cornfield.name(), "Name is a truthy value" );
            ok( butter.cornfield.username(), "Username is a truthy value" );
          });

          asyncTest( "Async API", 7, function() {
            var foundProject = false;

            butter.cornfield.list( function( res ) {
              ok(res, "The project list response has data" );
              equal( res.error, "okay", "Project list status is \"okay\"" );
              ok( res.projects, "There is a list of projects" );

              for( i = 0, len = res.projects.length; i < len; i++ ){
                if( res.projects[ i ].name === filename ){
                  foundProject = true;
                  break;
                }
              }

              equal( false, foundProject, filename + " is not present in the projects list" );

              butter.cornfield.load( filename, function( res ) {
                deepEqual( res, { error: "project not found" }, "The project load response is project not found" );

                butter.cornfield.save( filename, stringedData, function( res ) {
                  equal( res.error, "okay", "The project save response is okay" );

                  filename = res.project._id;

                  butter.cornfield.load( filename, function( res ) {
                    equal( res.stuff, data.data.stuff, "The project is the same" );

                    start();
                  });
                });
              });
            });

            var failSafe = setTimeout( function() {
              clearTimeout( failSafe );
              start();
            }, 20000 );
          });

          asyncTest( "/api/whoami", 1, function() {
            butter.cornfield.whoami( function( res ) {
              deepEqual( res, {
                email: butter.cornfield.email(),
                name: butter.cornfield.email(),
                username: butter.cornfield.email()
              }, "Response contains user information" );
              start();
            });
          });

          asyncTest( "Logout", 1, function() {
            butter.cornfield.logout( function( res ) {
              equal( res, true, "Clean-up" );

              start();
            });
          });

          module( "State after logout" );

          test( "Sync API", 4, function() {
            ok( !butter.cornfield.authenticated(), "Authenticated is false" );
            ok( !butter.cornfield.email(), "Email is undefined" );
            ok( !butter.cornfield.name(), "Name is undefined" );
            ok( !butter.cornfield.username(), "Username is undefined" );
          });
        }
    });
  }, false );
}( window, window.document ));
