/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

/*
 * This file exposes various helper methods centered around user-data, such as logging in,
 * saving, and logging out.
 */
define( [ "dialog/dialog", "util/lang", "text!layouts/header.html" ],
  function( Dialog, Lang, HEADER_TEMPLATE ) {

  return function( butter ) {
    var _this = this,
        _rootElement = Lang.domFragment( HEADER_TEMPLATE, ".butter-header" ),
        _saveButton = _rootElement.querySelector( ".butter-save-btn" ),
        _buttonGroup = _rootElement.querySelector( ".butter-login-project-info" ),
        _authButton = _rootElement.querySelector( ".butter-login-btn" ),
        _projectTitle = _rootElement.querySelector( ".butter-project-title" ),
        _projectName = _projectTitle.querySelector( ".butter-project-name" );

    this.element = _rootElement;

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
          cancel: function( e ) {
            dialog.close();
            if ( callback ) {
              callback();
            }
          }
        }
      });
      dialog.open();
    };

    this.authenticationRequired = function( successCallback, errorCallback ) {
      if ( butter.cornfield.authenticated() && successCallback && typeof successCallback === "function" ) {
        successCallback();
        return;
      }

      butter.cornfield.login(function( response ) {
        if ( !response.error ) {
          if ( successCallback ) {
            successCallback();
          }
        } else {
          _this.showErrorDialog( "There was an error logging in. Please try again." );
          if ( errorCallback ) {
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

      function execute(){
        var saveString;

        butter.project.data = butter.exportProject();
        saveString = JSON.stringify( butter.project, null, 4 );
        butter.ui.loadIndicator.start();
        butter.cornfield.save( butter.project.id, saveString, function( e ) {
          butter.ui.loadIndicator.stop();
          if ( e.error !== "okay" || !e.project || !e.project._id ) {
            _this.showErrorDialog( "There was a problem saving your project. Please try again." );
            return;
          }
          butter.project.id = e.project._id;
          if ( successCallback ) {
            successCallback();
          }
        });
      }

      if ( !butter.project.name && errorCallback ) {
        errorCallback();
      } else {
        execute();
      }
    };

    this.logout = function( callback ) {
      butter.dispatch( "logout" );
      butter.cornfield.logout( callback );
    };

    Object.defineProperties( this, {
      rootElement: {
        enumerable: true,
        get: function() {
          return _rootElement;
        }
      },
      saveButton: {
        enumerable: true,
        get: function() {
          return _saveButton;
        }
      },
      buttonGroup: {
        enumerable: true,
        get: function() {
          return _buttonGroup;
        }
      },
      authButton: {
        enumerable: true,
        get: function() {
          return _authButton;
        }
      },
      projectTitle: {
        enumerable: true,
        get: function() {
          return _projectTitle;
        }
      },
      projectName: {
        enumerable: true,
        get: function() {
          return _projectName;
        }
      }
    });
  };
});
