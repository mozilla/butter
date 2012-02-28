define( [ "./util", "./event-manager" ] , function( util, EventManager ){

  var MAX_DIALOGS = 1000,
      MIN_Z_INDEX = 2147483647 - MAX_DIALOGS;

  var Layer = function( dialog, zIndex ) {

    var _body = document.body,
        _background = document.createElement( "div" ),
        _numDialogs = 0,
        _zIndex = 0,
        _em = new EventManager( this ),
        _this = this;

    _body.appendChild( _background );
    util.css( _background, "position", "fixed" );
    util.css( _background, "top", "0px" );
    util.css( _background, "left", "0px" );

    if( dialog.modal ){
      util.css( _background, "background", "rgba( 0, 0, 0, 0.6 )" );
      util.css( _background, "width", "100%" );
      util.css( _background, "height", "100%" );
      window.addEventListener( "resize", function( e ){
      }, false );
    } //if

    Object.defineProperties( this, {
      zIndex: {
        set: function( val ){
          _zIndex = val;
          util.css( _background, "z-index", _zIndex );
        },
        get: function(){
          return _zIndex;
        }
      }
    });

    dialog.open( _background );

    function onDialogClose( e ){
      _background.parentNode.removeChild( _background );
      _em.dispatch( "close" );
      dialog.unlisten( "close", onDialogClose );
    } //onDialogClose

    dialog.listen( "close", onDialogClose );

    _this.zIndex = zIndex;

  }; //Layer

  var LayerManager = function(){

    var _layers = [];

    this.add = function( dialog ){
      var layer = new Layer( dialog, MIN_Z_INDEX + _layers.length );
      _layers.push( layer );
      layer.listen( "close", function( e ){
        _layers.splice( _layers.indexOf( layer ), 1 );
      });
      return layer;
    }; //prepare

  }; //LayerManager

  return LayerManager;
});
