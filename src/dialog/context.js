define( [
    "./util",
    "./layer-manager",
    "./template",
    "./iframe-dialog",
    "./window-dialog"
  ], function( util, LayerManager, Template, IFRAMEDialog, WindowDialog ){

  var Context = function() {

    var _dialogs = {},
        _this = this,
        _layerManager = new LayerManager(),
        _dialogTypes = {
          "iframe": IFRAMEDialog,
          "window": WindowDialog
        },
        _dialogTemplates = [];

    var _body = document.body;

    var innerUtil = {
      getTemplate: function( name ){
        if( typeof name === "string" ){
          for( var i=0, l=_dialogTemplates.length; i<l; ++i ){
            if( name === _dialogTemplates[ i ].name ){
              return _dialogTemplates[ i ];
            } //if
          } //for
        }
        else if( typeof name === "object" ){
          for( var i=0, l=_dialogTemplates.length; i<l; ++i ){
            if( name === _dialogTemplates[ i ].element ){
              return _dialogTemplates[ i ];
            } //if
          } //for
        } //if
      }
    }; //innerUtil

    this.add = function( name, options ){
      if( !name || !options ){
        throw new Error( "Name and options required to create a dialog." );
      } //if
      if( _dialogs[ name ] ){
        throw new Error( "Dialog " + name + " already exists." );
      } //if
      var type = options.type || "dom";
      if( type === "dom" ){
        if( findExistingDOMDialog( options.element ) ){
          throw new Error( "Dialog already exists!" );
        } //if
      } //if
      _dialogs[ name ] = new _dialogTypes[ type ]( innerUtil, options );
    }; //add

    this.remove = function( name ){
      var dialog = _dialogs[ name ];
      if( dialog ){
        dialog.hide();
        delete _dialogs[ name ];
      } //if
    }; //remove

    this.open = function( name, listeners ){
      function onClose( e ){
        dialog.unlisten( listeners );
        dialog.unlisten( "close", onClose );
      } //onClose
      var dialog = _dialogs[ name ];
      if( dialog && dialog.canOpen ){
        dialog.listen( listeners ); 
        dialog.listen( "close", onClose );
        _layerManager.add( dialog );
      } //if
    }; //show

    this.close = function( name ){
      var dialog = _dialogs[ name ];
      if( dialog ){
        dialog.hide();
      } //if
    }; //hide

    this.send = function( name, type, data ){
      var dialog = _dialogs[ name ];
      if( dialog ){
        dialog.send( type, data );
      } //if
    }; //send

    this.hideAll = function( name ){
      for( var d in _dialogs ){
        if( _dialogs.hasOwnProperty( d ) ){
          _dialogs[ d ].hide();
        } //if
      } //for
    }; //hideAll

    function getDialogTemplates(){
      var templates = document.querySelectorAll( "*[dialog-template]" );
      for( var i=0; i<templates.length; ++i ){
        var existingTemplate = undefined;
        for( var j=0; i<_dialogTemplates.length; ++j ){
          if( _dialogTemplates[ j ].element !== templates[ i ] ){
            existingTemplate = _dialogTemplates[ j ];
            break;
          } //if
        } //for
        if( !existingTemplate ){
          _dialogTemplates.push( new Template( templates[ i ] ) );
        } //if
      } //for
    } //getDialogTemplates

    function getDialogContents(){
      var contents = document.querySelectorAll( "*[dialog-content]" );
      for( var i=0; i<contents.length; ++i ){
        var existingContent = findExistingDOMDialog( contents[ i ] );
        if( !existingContent ){
          _this.add( contents[ i ].id, {
            type: "dom",
            element: contents[ i ]
          });
        } //if
      } //for
    } //getDialogContents

    function findExistingDOMDialog( element ){
      if( typeof element === "string" ){
        element = document.getElementById( element );
      } //if
      for( var d in _dialogs ){
        if( _dialogs.hasOwnProperty( d ) ){
          dialog = _dialogs[ d ];
          if( dialog.type === "dom" && dialog.element === element ){
            return dialog;
          } //if
        } //if
      } //for
    } //findExistingDOMDialog

    document.addEventListener( "DOMContentLoaded", function( e ){
      getDialogTemplates();
      getDialogContents();
      _body = document.body;
    }, false );
    getDialogTemplates();
    getDialogContents();

  }; //Context

  return Context;
});
