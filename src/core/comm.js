define( [ "./eventmanager" ], function( EventManager ){

  var __context = 1;

  var Comm = function( clientWindow, readyCallback ) {
    var _this = this,
        _em = new EventManager( _this ),
        _readyInterval,
        _context = __context++
        _destroyed = false,
        _ponged = false;

    clientWindow.addEventListener( "message", function( e ){
      if( e.source === clientWindow && typeof e.data === "object" && e.data.context ){
        if( e.data.type === "pong" ){
          _ponged = true;
        }
        else {
          _this.dispatch( e.data.type, e.data );
        } //if
      } //if
    }, false );

    function checkPing(){
      if( !_destroyed ){
        if( !_ponged ){
          _this.dispatch( "error", {
            type: "connectionclosed"
          });
        } //if
        ping();
      } //if
    } //checkPing

    function ping(){
      _ponged = false;
      _this.send( "ping" );
      setTimeout( checkPing, 1000 );
    } //ping

    _em.listen( "ready", function( e ){
      clearInterval( _readyInterval );
      readyCallback();
      ping();
    });

    _readyInterval = setInterval( function(){
      _this.send( "ready", "ready" );
    }, 100 );

    this.send = function( type, data ){
      clientWindow.postMessage({
        type: type,
        context: _context,
        data: data
      }, "*" );
    }; //send

    this.destroy = function(){
      _destroyed = true;
      clearInterval( _readyInterval );
    }; //destroy
  }; //Comm

  return Comm;
});
