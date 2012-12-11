/* This Source Code Form is subject to the terms of the MIT license.
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

/*
 * saving, and logging out.
 */
define( [ "dialog/dialog" ],
  function( Dialog ) {

  return function( butter ) {
    var _this = this;

    /*
     * Method: showErrorDialog
     *
     * Opens a dialog that informs the user an error has occured
     * @params {String} message: the message to be displayed to the user
     * @params {Function} callback: option callback function to be called once the dialog has be closed
     */
    this.showErrorDialog = function( message, callback ) {
      var dialog = Dialog.spawn( "error-message", {
        data: message,
        events: {
          cancel: function() {
            dialog.close();
            if ( callback && typeof callback === "function" ) {
              callback();
            }
          }
        }
      });
      dialog.open();
    };

    this.authenticationRequired = function( successCallback, errorCallback ) {
      if ( butter.cornfield.authenticated() ) {
        butter.dispatch( "authenticated" );
        if ( successCallback && typeof successCallback === "function" ) {
          successCallback();
          return;
        }
      }

      butter.cornfield.login( function( response ) {
        if ( response.status === "okay" ) {
          butter.dispatch( "authenticated" );
          if ( successCallback && typeof successCallback === "function" ) {
            successCallback();
            return;
          }
        } else {
          _this.showErrorDialog( "There was an error logging in. Please try again." );
            if ( errorCallback && typeof errorCallback === "function" )  {
              errorCallback();
            }
        }
      });
    };


    /*
     * Method: save
     *
     * Allows the user the save their project.
     * @param {function} successCallback: A callback function that is fired when the user has successfully saved
     * @param {function} errorCallback: A callback function that is fired when the user attempts to save with no project name
     */
    this.save = function( successCallback, errorCallback ) {
      successCallback = successCallback || function(){};
      errorCallback = errorCallback || function(){};

      if ( !butter.project.name ) {
        errorCallback();
      } else {
        butter.ui.loadIndicator.start();
        butter.project.save( function( e ){
          butter.ui.loadIndicator.stop();
          if ( e.error !== "okay" ) {
            _this.showErrorDialog(  "There was a problem saving your project, so it was backed up to your browser's storage (i.e., you can close or reload this page and it will be recovered). Please try again." );
            errorCallback();
            return;
          }
          successCallback();
        });
      }
    };

    this.logout = function( callback ) {
      butter.cornfield.logout( function() {
        if ( callback && typeof callback === "function" ) {
          callback();
        }
        butter.dispatch( "logout" );
      });
    };

  };
});
