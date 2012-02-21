define( [ "./util", "./base-dialog", "core/comm", "./event-manager" ], function( util, BaseDialog, Comm, EventManager ){

  const DEFAULT_WINDOW_WIDTH = 640;
  const DEFAULT_WINDOW_HEIGHT = 479;

  var WindowDialog = function( context, dialogOptions ) {
    dialogOptions = dialogOptions || {};

    if( !dialogOptions.url ){
      throw new Error( "IFRAME dialog requires a url." );
    } //if
    window.onbeforeunload = onClose; 
    var _this = this,
        _baseDialog = new BaseDialog( context, dialogOptions, _this ),
        _url = dialogOptions.url,
        _em = new EventManager( _this ),
        _currentComm,
        _currentWindow,
        _windowStatusInterval,
        _features = [
          "width=" + ( dialogOptions.width || DEFAULT_WINDOW_WIDTH ),
          "height=" + ( dialogOptions.height || DEFAULT_WINDOW_HEIGHT ),
          "toolbar=no",
          "menubar=no",
          "titlebar=yes",
          "location=no",
          "resizable=yes"
        ];

    function onSubmit( e ){
      _em.dispatch( e.type, e.data );
    } //onSubmit

    function onCancel( e ){
      _em.dispatch( e.type, e.data );
      close();
    } //onCancel

    function onClose( e ){
      close();
    } //onClose

    function onError( e ){
      if( e.data.type === "connectionclosed" ){
        close();
      } //if
      _em.dispatch( e.type, e.data );
    } //onError

    function close(){
      _currentComm.unlisten( "submit", onSubmit );
      _currentComm.unlisten( "cancel", onCancel );
      _currentComm.unlisten( "close", onClose );
      _currentComm.destroy();
      _baseDialog.close();
      _em.dispatch( "close" );
      if( _currentWindow.close ){
        _currentWindow.close();
      } //if
      clearInterval( _windowStatusInterval );
      _currentComm = _currentWindow = undefined;
    } //close

    function checkWindowStatus(){
      if( _currentWindow && _currentWindow.closed === true ) {
        close();
      } //if
    } //checkWindowStatus

    this.open = function( background ){
      _currentWindow = window.open( _url, "dialog-window:" + _url, _features.join( "," ) );
      _currentComm = new Comm( _currentWindow, function(){
        _currentComm.listen( "error", onError );
        _currentComm.listen( "submit", onSubmit );
        _currentComm.listen( "cancel", onCancel );
        _currentComm.listen( "close", onClose );
        _windowStatusInterval = setInterval( checkWindowStatus, 300 );
        _em.dispatch( "open" );
        _baseDialog.open();
      });
    }; //open

    this.close = function(){
      close();
    }; //close

    this.send = function( type, data ){
      if( _currentComm ){
        _currentComm.send( type, data );
      } //if
    }; //send

  }; //WindowDialog

  return WindowDialog;
});
