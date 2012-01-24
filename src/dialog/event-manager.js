define( [], function(){

  var EventManager = function( object ) {
    var _listeners = [],
        _target = this,
        _this = this;

    this.dispatch = function( eventName, eventData ) {
      var e;
      if( typeof( eventName ) !== "object" ){
        e = {
          type: eventName + "",
          target: _target,
          data: eventData,
        };
      }
      else {
        e = eventName;
        eventName = e.type;
      } //if
      e.currentTarget = _target;
      if( _listeners[ eventName ] ) {
        var theseListeners = _listeners[ eventName ].slice();
        for( var i=0, l=theseListeners.length; i<l; ++i ){
          theseListeners[ i ]( e );
        } //for
      } //if
    }; //dispatch

    this.listen = function( eventName, listener ) {
      if( typeof( eventName ) === "object" ){
        for( var i in eventName ){
          if( eventName.hasOwnProperty( i ) ){
            _this.listen( i, eventName[ i ] );
          } //if
        } //for
      }
      else {
        if ( !_listeners[ eventName ] ) {
          _listeners[ eventName ] = [];
        }
        _listeners[ eventName ].push( listener );
      } //if
    }; //listen

    this.unlisten = function( eventName, listener ) {
      if( typeof( eventName ) === "object" ){
        for( var i in eventName ){
          if( eventName.hasOwnProperty( i ) ){
            _this.unlisten( i, eventName[ i ] );
          } //if
        } //for
      }
      else {
        var theseListeners = _listeners[ eventName ];
        if ( theseListeners ) {
          if ( listener ) {
            var idx = theseListeners.indexOf( listener );
            if ( idx > -1 ) {
              theseListeners.splice( idx, 1 );
            } //if
          }
          else {
            _listeners[ eventName ] = [];
          }
        } //if
      } //if
    }; //unlisten

    this.apply = function( object ) {
      object.listen = _this.listen;
      object.unlisten = _this.unlisten;
      object.dispatch = _this.dispatch;
      _target = object;
    }; //apply

    if( object ) {
      this.apply( object );
    } //if

  }; //EventManager

  return EventManager;

});
