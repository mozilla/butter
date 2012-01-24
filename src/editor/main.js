(function() {

  define([ "core/logger", "core/eventmanager", "comm/comm" ], 
    function( Logger, EventManager, Comm ) {


    function ButterEditor ( readyFunction ) {
      readyFunction( this );
    }

    ButterEditor.Logger = Logger;
    ButterEditor.EventManager = EventManager;
    ButterEditor.Comm = Comm;

    var waiting = window.ButterEditor.__waiting;

    window.ButterEditor = ButterEditor;

    if ( waiting ) {

      for ( var i=0, l=waiting.length; i<l; ++i ) {
        ButterEditor.apply( {}, waiting[ i ] );
      } //for

      delete ButterEditor._waiting;
    } //if
  }); //define
})();

