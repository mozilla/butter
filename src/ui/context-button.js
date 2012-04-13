define([], function(){

  return function( butter ){
    var _button = document.createElement( "button" );

    _button.id = "add-popcorn";
    _button.title = "Add Popcorn Events to the timeline";
    _button.innerHTML = "+Popcorn";

    _button.addEventListener( "click", function(){
      if( butter.ui.contentState === "timeline" ){
        butter.ui.setContentState( "add-popcorn" );
        butter.ui.contentStateLocked = true;
      }
      else{
        butter.ui.contentStateLocked = false;
        butter.ui.setContentState( "timeline" );
      }
    }, false );

    butter.ui.areas.tools.addComponent( _button, {
      states: [ "add-popcorn", "editor" ],
      transitionIn: function(){
        _button.setAttribute( "disabled", true );
        _button.innerHTML = "Done";
        _button.title = "Finish adding Popcorn Events";
        _button.classList.add( "add-popcorn-done" );
      },
      transitionInComplete: function(){
        _button.removeAttribute( "disabled" );
      },
      transitionOut: function(){
        _button.setAttribute( "disabled", true );
        _button.innerHTML = "+Popcorn";
        _button.title = "Add Popcorn Events to the timeline";
        _button.classList.remove( "add-popcorn-done" );
      },
      transitionOutComplete: function(){
        _button.removeAttribute( "disabled" );
      }
    });
  };
});