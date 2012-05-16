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
          module( "Unauthenticated tests" );

          asyncTest("Sync API", 1, function() {
            equal(butter.cornfield.user(), null, 'Username is ""');
            start();
          });

          asyncTest("Async API", 4, function() {
            butter.cornfield.logout(function(res) {
              equal(res, true, "Cornfield server is active");
            });

            butter.cornfield.list(function(res) {
              deepEqual( res, { error: 'unauthorized' }, 'Not allowed to list files' );
            });

            butter.cornfield.pull("test1", function(res) {
              deepEqual( JSON.parse(res), { error: 'unauthorized' }, 'Not allowed to get files' );
            });

            butter.cornfield.push("test1", "test1", function(res) {
              deepEqual( res, { error: 'unauthorized' }, 'Not allowed to put files' );
            });

            setTimeout(function() {
              start();
            }, 500);
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
            var filename = "test" + Date.now();

            butter.cornfield.list(function(res){
              ok(res, 'The file list response has data');
              equal(res.error, 'okay', 'File list status is "okay"');
              ok(res.filenames, 'There is a list of filenames');
              equal(res.filenames.indexOf(filename), -1, filename + ' is not present in the file list');

              butter.cornfield.pull(filename, function(res){
                deepEqual(JSON.parse(res), { error: 'file not found' }, 'The file pull response is file not found');

                butter.cornfield.push(filename, filename, function(res){
                  deepEqual(res, { error: 'okay' }, 'The file push response is okay');

                  butter.cornfield.pull(filename, function(res){
                    equal(res, filename, 'The file is the same');
                  })
                });
              });
            });

            setTimeout(function() {
              start();
            }, 1000);
          });

          asyncTest("Logout", 1, function() {
            butter.cornfield.logout(function(res) {
              equal(res, true, "Clean-up");
            });

            setTimeout(function() {
              start();
            }, 500);
          });
        }
    });
  }, false );
}( window, window.document ));
