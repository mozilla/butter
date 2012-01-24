define( [], function(){

  var BaseDialog = function( context, baseOptions, parentDialog ) {

    var _this = this,
        _type = baseOptions.type,
        _modal = baseOptions.modal || false,
        _template = baseOptions.template,
        _open = false;

    if( typeof _template === "string" ){
      _template = context.getTemplate( _template );
    } //if

    this.open = function(){
      if( _open ){
        throw new Error( "Dialog already open!" );
      } //if
      _open = true;
    }; //open

    this.close = function(){
      _open = false;
    }; //close

    this.prepareToShow = function( options ){
      options = options || {};
      var showOptions = {
        modal: options.modal || _modal,
        template: _template,
      };
      return showOptions;
    }; //prepareToShow

    this.applyProperties = function( object ){
      Object.defineProperties( object, {
        type: {
          get: function() {
            return _type;
          }
        },
        template: {
          get: function() {
            return _template;
          }
        },
        modal: {
          get: function(){
            return _modal;
          }
        },
        isOpen: {
          get: function(){
            return _open;
          }
        },
        canOpen: {
          get: function(){
            return !_open;
          }
        }
      });
    }; //applyProperties

    _this.applyProperties( _this );
    if( parentDialog ){
      _this.applyProperties( parentDialog );
    } //if

  }; //BaseDialog

  return BaseDialog;
});
