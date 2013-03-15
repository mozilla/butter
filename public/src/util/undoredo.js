/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define(function() {
  var _undoStack = [],
      _redoStack = [],
      _nestCommands = false,
      _nestedCommand;

  var UndoRedo = {};

  UndoRedo.Node = function() {
    var _nodes = [];
    this.register = function( command ) {
      if ( command.execute && command.undo ) {
        _nodes.push( command );
      }
    };
    this.execute = function() {
      for ( var i = 0; i < _nodes.length; i++ ) {
        _nodes[ i ].execute();
      } 
    };
    this.undo = function() {
      for ( var i = _nodes.length - 1; i >= 0; i-- ) {
        _nodes[ i ].undo();
      }
    };
    Object.defineProperties( this, {
      nodes: {
        enumerable: true,
        get: function(){
          return _nodes;
        }
      }
    });
  };

  UndoRedo.register = function( command ) {
    if ( command.execute && command.undo ) {
      _undoStack.push( command );
      _redoStack = [];
    }
  };
  UndoRedo.canUndo = function() {
    return _undoStack.length > 0;
  };
  UndoRedo.canRedo = function() {
    return _redoStack.length > 0;
  };
  UndoRedo.undo = function() {
    var command;
    if ( this.canUndo() ) {debugger;
      command = _undoStack.pop();
      _redoStack.push( command );
      command.undo();
    }
  };
  UndoRedo.redo = function() {
    var command;
    if ( this.canRedo() ) {
      command = _redoStack.pop();
      _undoStack.push( command );
      command.execute();
    }
  };
  UndoRedo.clear = function() {
    _undoStack = [];
    _redoStack = [];
  };

  return UndoRedo;
});
