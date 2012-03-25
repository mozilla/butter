/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define(function(){
  var _undoManager;

  function UndoManager(){
    var _undoStack = [],
        _redoStack = [];

    return {
      register: function( command ){
        if ( command.execute && command.undo ){
          _undoStack.push( command );
        } //if
      }, //register
      canUndo: function(){
        return _undoStack.length > 0;
      }, //canUndo
      canRedo: function(){
        return _redoStack.length > 0;
      }, //canRedo
      undo: function(){
        if ( this.canUndo() ){
          var command = _undoStack.pop();
          _redoStack.push( command );
          command.undo();
        } //if
      }, //undo
      redo: function(){
        if ( this.canRedo() ){
          var command =_redoStack.pop();
          _undoStack.push( command );
          command.execute();
        } //if
      }, //redo
      clear: function(){
        _undoStack.length = 0;
        _redoStack.length = 0;
      } //clear
    };
  } //UndoManager

  return {
    getInstance: function(){
      if ( !_undoManager ){
        _undoManager = new UndoManager();
      } //if
      return _undoManager;
    } //getInstance
  };
});

