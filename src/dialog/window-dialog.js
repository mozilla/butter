/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [
          "core/comm",
          "core/eventmanager",
          "dialog/modal"
        ],
        function( Comm, EventManagerWrapper, Modal ){

  var DEFAULT_WINDOW_WIDTH = 640,
      DEFAULT_WINDOW_HEIGHT = 479,
      WINDOW_CHECK_INTERVAL = 300;

  return function( dialogOptions ) {
    dialogOptions = dialogOptions || {};

    if( !dialogOptions.url ){
      throw new Error( "Window dialog requires a url." );
    } //if

    var _this = this,
        _url = dialogOptions.url,
        _comm,
        _window,
        _modalLayer,
        _statusInterval,
        _commQueue = [],
        _open = false,
        _features = [
          "width=" + ( dialogOptions.width || DEFAULT_WINDOW_WIDTH ),
          "height=" + ( dialogOptions.height || DEFAULT_WINDOW_HEIGHT ),
          "toolbar=no",
          "menubar=no",
          "titlebar=yes",
          "location=no",
          "resizable=yes"
        ],
        _listeners = dialogOptions.events || {};

    EventManagerWrapper( _this );

    _this.modal = dialogOptions.modal;

    function onSubmit( e ){
      _this.dispatch( e.type, e.data );
    } //onSubmit

    function onCancel( e ){
      _this.dispatch( e.type, e.data );
      _this.close();
    } //onCancel

    function onError( e ){
      if( e.data.type === "connectionclosed" ){
        _this.close();
      } //if
      _this.dispatch( "error", e.data );
    } //onError

    this.close = function(){
      // Send a close message to the dialog first, then actually close the dialog.
      // A setTimeout is used here to ensure that its associated function will be run
      // almost right after the postMessage happens. This ensures that messages get to
      // their destination before we remove the dom element (which will basically ruin
      // everything) by placing callbacks in the browser's event loop in the correct order.
      _this.send( "close" );
      setTimeout( function(){
        if( _modalLayer ){
          _modalLayer.destroy();
          _modalLayer = undefined;
        } //if
        _comm.unlisten( "submit", onSubmit );
        _comm.unlisten( "cancel", onCancel );
        _comm.unlisten( "close", _this.close );
        _comm.destroy();
        if( _window.close ){
          _window.close();
        } //if
        clearInterval( _statusInterval );
        window.removeEventListener( "beforeunload",  _this.close, false );
        _comm = _window = undefined;
        _open = false;
        for( var e in _listeners ){
          if( _listeners.hasOwnProperty( e ) ){
            _this.unlisten( e, _listeners[ e ] );
          }
        } //for
        _this.dispatch( "close" );
      }, 0 );
    }; //close

    function checkWindowStatus(){
      if( _window && _window.closed === true ) {
        _this.close();
      } //if
    } //checkWindowStatus

    this.open = function( listeners ){
      if( _this.modal ){
        _modalLayer = new Modal( _this.modal );
      } //if
      for ( var e in listeners ){
        if( listeners.hasOwnProperty( e ) ){
          _listeners[ e ] = listeners[ e ];
        }
      } //for
      _window = window.open( _url, "dialog-window:" + _url, _features.join( "," ) );
      window.addEventListener( "beforeunload",  _this.close, false );
      _comm = new Comm( _window, function(){
        _comm.listen( "error", onError );
        _comm.listen( "submit", onSubmit );
        _comm.listen( "cancel", onCancel );
        _comm.listen( "close", _this.close );
        for( var e in _listeners ){
          if( _listeners.hasOwnProperty( e ) ){
            _this.listen( e, _listeners[ e ] );
          }
        } //for
        _statusInterval = setInterval( checkWindowStatus, WINDOW_CHECK_INTERVAL );
        while( _commQueue.length > 0 ){
          var popped = _commQueue.pop();
          _this.send( popped.type, popped.data );
        } //while
        _open = true;
        _this.dispatch( "open" );
      });
    }; //open

    this.focus = function() {
      _window.focus();
    };

    this.send = function( type, data ){
      if( _comm ){
        _comm.send( type, data );
      }
      else {
        _commQueue.push({ type: type, data: data });
      } //if
    }; //send

    Object.defineProperties( this, {
      closed: {
        enumerable: true,
        get: function(){
          return !_open;
        }
      }
    });

  }; //WindowDialog

});
