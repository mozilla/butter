/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [
          "core/comm", 
          "core/eventmanager",
          "dialog/modal"
        ], 
        function( Comm, EventManager, Modal ){

  return function( dialogOptions ) {
    dialogOptions = dialogOptions || {};

    if( !dialogOptions.url ){
      throw new Error( "IFRAME dialog requires a url." );
    } //if

    var _this = this,
        _url = dialogOptions.url,
        _em = new EventManager( _this ),
        _parent = dialogOptions.parent,
        _open = false,
        _iframe,
        _commQueue = [],
        _comm,
        _modalLayer,
        _listeners = dialogOptions.events || {};

    this.modal = dialogOptions.modal;

    function onSubmit( e ){
      _em.dispatch( e.type, e.data );
    } //onSubmit

    function onCancel( e ){
      _em.dispatch( e.type, e.data );
      close();
    } //onCancel

    this.close = function(){
      _parent.removeChild( _iframe );
      if( _modalLayer ){
        _modalLayer.destroy();
        _modalLayer = undefined;
      } //if
      _comm.unlisten( "submit", onSubmit );
      _comm.unlisten( "cancel", onCancel );
      _comm.unlisten( "close", _this.close );
      _comm.destroy();
      _open = false;
      window.removeEventListener( "beforeunload",  _this.close, false); 
      for( var e in _listeners ){
        _em.unlisten( e, _listeners[ e ] );
      } //for
      _em.dispatch( "close" );
    }; //close

    this.open = function( listeners ){
      if( _open ){
        return;
      } //if
      if( _this.modal ){
        _modalLayer = new Modal( _this.modal );
      } //if
      for( e in listeners ){
        _listeners[ e ] = listeners[ e ];
      } //for
      var defaultParent = _modalLayer ? _modalLayer.element : document.body;
      _parent = _parent || defaultParent;
      _iframe = document.createElement( "iframe" );
      _iframe.src = _url;
      _iframe.addEventListener( "load", function( e ){
        _comm = new Comm( _iframe.contentWindow, function(){
          _comm.listen( "submit", onSubmit );
          _comm.listen( "cancel", onCancel );
          _comm.listen( "close", _this.close );
          window.addEventListener( "beforeunload",  _this.close, false); 
          for( var e in _listeners ){
            _em.listen( e, _listeners[ e ] );
          } //for
          while( _commQueue.length > 0 ){
            var popped = _commQueue.pop();
            _this.send( popped.type, popped.data );
          } //while
          _open = true;
          _em.dispatch( "open" );
        });
      }, false );
      _parent.appendChild( _iframe );

      // need to wait an event-loop cycle to apply this class
      // ow, opacity transition fails to render
      setTimeout( function(){
        _iframe.className += " fade-in";
      }, 10 );
    }; //open

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

  }; //IFrameDialog

});
