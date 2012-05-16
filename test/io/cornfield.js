/*global text,expect,ok,module,notEqual,test,window*/

/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

( function ( window, document, undefined ){

  QUnit.config.reorder = false;

  document.addEventListener( "DOMContentLoaded", function( e ){
    var b = new Butter({
      config: "cornfield-test-config.json",
        ready: function( butter ){
          var filename = "test" + Date.now(),
              data = {
                name: filename,
                html: "herpderp",
                data: { stuff: "derpherp" },
                template: "pop"
              },
              stringedData = JSON.stringify(data.data),
              data = JSON.stringify(data);

          module( "Unauthenticated tests" );

          asyncTest("Sync API", 1, function() {
            equal(butter.cornfield.user(), null, 'Username is ""');
            start();
          });

          asyncTest("Async API", 4, function() {
            butter.cornfield.logout(function(res) {
              equal(res, true, "Cornfield server is active");

              butter.cornfield.list(function(res) {
                deepEqual( res, { error: "unauthorized" }, "Not allowed to list projects" );

                butter.cornfield.load(filename, function(res) {
                  deepEqual( res, { error: "unauthorized" }, "Not allowed to get projects" );

                  butter.cornfield.saveas(filename, data, function(res) {
                    deepEqual( res, { error: "unauthorized" }, "Not allowed to save projects" );

                    start();
                  });
                });
              });
            });
          });

          module( "Authentication tests" );

          asyncTest("Login (user input needed)", 4, function() {
            butter.cornfield.login(function(res) {
              clearTimeout(failSafe);
              ok(res, 'The login response has data');
              equal(res.status, 'okay', 'Login status is "okay"');
              ok(res.email, 'The login has an email: ' + res.email);
              equal(res.email, butter.cornfield.user(), "Email is stored");
              start();
            });

            var failSafe = setTimeout(function() {
              start();
            }, 10000);
          });

          module( "Authenticated tests" );

          asyncTest("Async API", 7, function() {
            // Create a random filename we'll use for testing
            var foundProject = false;

            butter.cornfield.list( function( res ){
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

              butter.cornfield.load( filename, function( res ){
                deepEqual( res, { error: "project not found" }, "The project load response is project not found" );

                butter.cornfield.saveas(filename, data, function(res){
                  deepEqual( res.error, "okay", "The project save response is okay" );

                  filename = res.project._id;

                  butter.cornfield.load(filename, function(res){
                    equal( res.project, stringedData, "The project is the same" );

                    start();
                  });
                });
              });
            });
          });

          asyncTest("Logout", 1, function() {
            butter.cornfield.logout(function(res) {
              equal(res, true, "Clean-up");

              start();
            });
          });
        }
    });
  }, false );
}( window, window.document ));
