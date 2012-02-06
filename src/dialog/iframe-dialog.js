define( [ "./util", "./base-dialog", "./comm", "./event-manager" ], function( util, BaseDialog, Comm, EventManager ){

  var IFRAMEDialog = function( context, dialogOptions ) {
    dialogOptions = dialogOptions || {};

    if( !dialogOptions.url ){
      throw new Error( "IFRAME dialog requires a url." );
    } //if

    var _this = this,
        _baseDialog = new BaseDialog( context, dialogOptions, _this ),
        _url = dialogOptions.url,
        _em = new EventManager( _this ),
        _currentComm,
        _currentTemplate;

    if( !_this.template ){
      throw new Error( "Template required to build iframe dialog." );
    } //if

    function onSubmit( e ){
      _em.dispatch( e.type, e.data.data );
    } //onSubmit

    function onCancel( e ){
      _em.dispatch( e.type, e.data );
      close();
    } //onCancel

    function onClose( e ){
      close();
    } //onClose

    function close(){
      _currentComm.unlisten( "submit", onSubmit );
      _currentComm.unlisten( "cancel", onCancel );
      _currentComm.unlisten( "close", onClose );
      _currentComm.destroy();
      _currentTemplate.destroy();
      _baseDialog.close();
      _em.dispatch( "close" );
      _currentComm = _currentTemplate = undefined;
    } //close

    this.open = function( background ){
      var iframe = document.createElement( "iframe" );
      _currentTemplate = _this.template.createInstance();
      _currentTemplate.insertContent( iframe );
      _currentTemplate.attach( background );
      $( _currentTemplate.element ).draggable();
      util.css( iframe, "width", util.css( _currentTemplate.element, "width" ) );
      util.css( iframe, "height", util.css( _currentTemplate.element, "height" ) );
      util.css( iframe, "border", "none" );
      iframe.src = _url;
      iframe.addEventListener( "load", function( e ){
        _currentComm = new Comm( iframe.contentWindow, function(){
          _currentTemplate.show();
          _currentComm.listen( "submit", onSubmit );
          _currentComm.listen( "cancel", onCancel );
          _currentComm.listen( "close", onClose );
        });
      }, false );
      _baseDialog.open();
      _em.dispatch( "open" );
    }; //open

    this.close = function(){
      close();
    }; //close

    this.send = function( type, data ){
      if( _currentComm ){
        _currentComm.send( type, data );
      } //if
    }; //send
    
  }; //IFRAMEDialog

  return IFRAMEDialog;
});
