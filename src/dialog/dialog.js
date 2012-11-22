/*! This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

/**
 * Module: Dialog
 *
 * Provides dialog functionality to Butter
 */
define( [ "util/lang", "core/eventmanager", "./modal" ],
  function( LangUtils, EventManager, Modal ){

  var __dialogs = {},
      __openDialogs = {},
      __keyboardAvoidElements = [
        "TEXTAREA"
      ];

  /**
   * Function: __createDialog
   *
   * Creates a dialog based on src for html layout and ctor for scripted construction
   *
   * @param {String} layoutSrc: String from which the dialog's DOM fragment is created
   * @param {Funtion} dialogCtor: Constructor to run after mandatory dialog constituents are created
   * @param {String} name: Name of the dialog that was constructed when spawn was called
   */
  function __createDialog( layoutSrc, dialogCtor, name ) {

    /**
     * Class: Dialog
     *
     * A Dialog
     *
     * @param {Object} spawnOptions: Can contain an 'event' object whose properties are events, and 'data' to pass to dialogCtor
     */
    return function ( spawnOptions ) {

      spawnOptions = spawnOptions || {};

      var _listeners = spawnOptions.events || {},
          _activities = {},
          _rootElement = LangUtils.domFragment( layoutSrc ),
          _enterKeyActivity,
          _escapeKeyActivity,
          _modal,
          _name = name;

      // Make sure we have a handle to the butter-dialog div. If there are comments or extra elements
      // described in layoutSrc, we don't care about them.
      if ( !( _rootElement.classList && _rootElement.classList.contains( "butter-dialog" ) ) ) {
        _rootElement = _rootElement.querySelector( ".butter-dialog" ) || _rootElement.querySelector( ".butter-first-run-dialog" );
      }

      /**
       * Member: onKeyDown
       *
       * Handler for keydown events that runs two specific activities if they're bound: Enter and Escape keys
       *
       * @param {Event} e: Standard DOM Event from a keydown occurrence
       */
      function onKeyDown( e ) {
        e.stopPropagation();
        if ( __keyboardAvoidElements.indexOf( e.target.nodeName ) === -1 ) {
          e.preventDefault();
          if (  _enterKeyActivity &&
                ( e.which === 13 || e.keyCode === 13 ) ) {
            _activities[ _enterKeyActivity ]( e );
          }
          else if ( _escapeKeyActivity &&
                    ( e.which === 27 || e.keyCode === 27 ) ) {
            _activities[ _escapeKeyActivity ]( e );
          }
        }
      }

      /**
       * Member: _internal
       *
       * Namespace for the dialog, not exposed to the rest of Butter.
       * This is mostly in place to persist the namespace division from the old method of
       * implementing dialogs (with iframes), which used a special library to talk to Butter.
       * _internal effectively replaces that library.
       * There is a purposeful API separation here as a result.
       */
      var _internal = {
        /**
         * Member: rootElement
         *
         * Element constructed from layoutSrc to represent the basis for the Dialog.
         */
        rootElement: _rootElement,

        /**
         * Member: activity
         *
         * Calls the listener corresponding to the given activity name.
         *
         * @param {String} activityName: Name of the activity to execute
         */
        activity: function( activityName ){
          _activities[ activityName ]();
        },

        /**
         * Member: enableCloseButton
         *
         * Enables access to a close butter if it exists in the layout. Using this function,
         * the layout can simply contain an element with a "close-button" class, and it will
         * be connected to the "default-close" activity.
         */
        enableCloseButton: function(){
          var closeButton = _rootElement.querySelector( ".close-button" );
          if( closeButton ){
            closeButton.addEventListener( "click", function closeClickHandler( e ){
              _internal.activity( "default-close" );
              closeButton.removeEventListener( "click", closeClickHandler, false );
            }, false );
          }
        },

        /**
         * Member: showError
         *
         * Sets the error state of the dialog to true and insert a message into the element
         * with an "error" class if one exists.
         *
         * @param {String} message: Error message to report
         */
        showError: function( message ){
          var element = _rootElement.querySelector( ".error" );
          if( element ){
            element.innerHTML = message;
            _rootElement.setAttribute( "data-error", true );
          }
        },

        /**
         * Member: hideError
         *
         * Removes the error state of the dialog.
         */
        hideError: function(){
          _rootElement.removeAttribute( "data-error" );
        },

        /**
         * Member: assignEnterKey
         *
         * Assigns the enter key to an activity.
         *
         * @param {String} activityName: Name of activity to assign to enter key
         */
        assignEnterKey: function( activityName ){
          _enterKeyActivity = activityName;
        },

        /**
         * Member: assignEscapeKey
         *
         * Assigns the escape key to an activity.
         *
         * @param {String} activityName: Name of activity to assign to escape key
         */
        assignEscapeKey: function( activityName ){
          _escapeKeyActivity = activityName;
        },

        /**
         * Member: registerActivity
         *
         * Registers an activity which can be referenced by the given name.
         *
         * @param {String} name: Name of activity
         * @param {Function} callback: Function to call when activity occurs
         */
        registerActivity: function( name, callback ){
          _activities[ name ] = callback;
        },

        /**
         * Member: assignButton
         *
         * Assigns a button's click to an activity
         *
         * @param {String} selector: Selector for the button (DOM element)
         * @param {String} activityName: Name of activity to link with the click of the given button
         */
        assignButton: function( selector, activityName ){
          var element = _rootElement.querySelector( selector );
          element.addEventListener( "click", _activities[ activityName ], false );
        },

        /**
         * Member: enableElements
         *
         * Removes the "disabled" attribute from given elements
         *
         * @arguments: Each parameter pasesd into this function is treated as the selector for an element to enable
         */
        enableElements: function(){
          var i = arguments.length;
          while ( i-- ) {
            _rootElement.querySelector( arguments[ i ] ).removeAttribute( "disabled" );
          }
        },

        /**
         * Member: disableElements
         *
         * Applies the "disabled" attribute to given elements
         *
         * @arguments: Each parameter pasesd into this function is treated as the selector for an element to enable
         */
        disableElements: function(){
          var i = arguments.length;
          while ( i-- ) {
            _rootElement.querySelector( arguments[ i ] ).setAttribute( "disabled", true );
          }
        },

        /**
         * Member: send
         *
         * Sends a message to the _external namespace.
         *
         * @param {String} activityName: Name of activity to assign to escape key
         * @param {*} data: Data to send along with the message
         */
        send: function( message, data ){
          _external.dispatch( message, data );
        }
      };

      /**
       * Member: _external
       *
       * As with _internal, _external is supplied to Butter only to persist the design
       * of dialogs as they were used in older versions. This maintains that Dialogs function
       * as independent bodies which can send and receive messages from Butter.
       * There is a purposeful API separation here as a result.
       */
      var _external = {
        /**
         * Member: send
         *
         * Sends a message to the _external namespace.
         *
         * @param {String} activityName: Name of activity to assign to escape key
         * @param {*} data: Data to send along with the message
         */
        element: _rootElement,

        /**
         * Member: open
         *
         * Opens the dialog. If listeners were supplied during construction, they are attached now.
         */
        open: function( overlay ) {
          if ( __openDialogs[ _name ] ) {
            _external.focus();
            return;
          }
          __openDialogs[ _name ] = true;
          for ( var e in _listeners ) {
            if ( _listeners.hasOwnProperty( e ) ) {
              _external.listen( e, _listeners[ e ] );
            }
          }
          _modal = new Modal( _rootElement, overlay );
          setTimeout( function() {
            _external.focus();
          }, 0 );
          document.addEventListener( "keydown", onKeyDown, false );
          _internal.dispatch( "open" );
          _external.dispatch( "open" );
        },

        /**
         * Member: close
         *
         * Closes the dialog. If listeners were supplied during construction, they are removed now.
         */
        close: function() {
          __openDialogs[ _name ] = false;
          for( var e in _listeners ){
            if ( _listeners.hasOwnProperty( e ) ) {
              if ( e !== "close" ) {
                _internal.unlisten( e, _listeners[ e ] );
              }
            }
          }
          _modal.destroy();
          _modal = null;
          document.removeEventListener( "keydown", onKeyDown, false );
          _internal.dispatch( "close" );
          _external.dispatch( "close" );
        },

        /**
         * Member: send
         *
         * Sends a message to the dialog.
         *
         * @param {String} message: Message to send to the dialog.
         * @param {*} data: Data to send along with the message.
         */
        send: function( message, data ) {
          _internal.dispatch( message, data );
        },

        /**
         * Member: focus
         *
         * Focuses the dialog as possible. Dispatches a "focus" event to the internal namespace to allow
         * the dialog to respond accordingly, since there may be a better object to focus.
         */
        focus: function() {
          _rootElement.focus();
          _internal.dispatch( "focus" );
        }

      };

      // Give both namespaces Event capabilities.
      EventManager.extend( _internal );
      EventManager.extend( _external );

      // Register the "default-close" activity for immediate use.
      _internal.registerActivity( "default-close", function(){
        _external.close();
      });

      // Register the "default-ok" activity for immediate use.
      _internal.registerActivity( "default-ok", function(){
        _external.dispatch( "submit" );
        _external.close();
      });

      // Call the dialog constructor now that everything is in place.
      dialogCtor( _internal, spawnOptions.data );

      // Return only the external namespace to Butter, since nothing else is required.
      return _external;
    };
  }

  /**
   * ModuleNamespace: Dialog
   */
  return {

    /**
     * Member: register
     *
     * Registers a dialog to be created with a given layout and constructor.
     *
     * @param {String} name: Name of the dialog to be constructed when spawn is called
     * @param {String} layoutSrc: String representing the basic DOM of the dialog
     * @param {Function} dialogCtor: Function to be run after dialog internals are in place
     */
    register: function( name, layoutSrc, dialogCtor ) {
      __dialogs[ name ] = __createDialog( layoutSrc, dialogCtor );
      __openDialogs[ name ] = false;
    },

    /**
     * Member: spawn
     *
     * Creates a dialog represented by the given name.
     *
     * @param {String} name: Name of the dialog to construct
     * @param {String} spawnOptions: Options to pass to the constructor (see __createDialog)
     */
    spawn: function( name, spawnOptions ) {
      if ( __dialogs[ name ] ) {
        return __dialogs[ name ]( spawnOptions );
      }
      else {
        throw "Dialog '" + name + "' does not exist.";
      }
    },

    modal: Modal
  };
});
