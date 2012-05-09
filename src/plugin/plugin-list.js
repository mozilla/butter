/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "util/dragndrop" ], function( DragNDrop ){
	
	return function( butter ){
    var _parentElement = document.createElement( "div" ),
        _containerElement = document.createElement( "div" );

    _parentElement.id = "plugin-list";
    _containerElement.className = "container";
    _parentElement.appendChild( _containerElement );

    butter.ui.areas.work.addComponent( _parentElement, {
      states: [ "add-popcorn" ],
      transitionIn: function(){
        _parentElement.style.display = "block";
        setTimeout(function(){
          _parentElement.style.opacity = "1";
        }, 0);
      },
      transitionOut: function(){
        _parentElement.style.opacity = "0";
      },
      transitionInComplete: function(){

      },
      transitionOutComplete: function(){
        _parentElement.style.display = "none";
      }
    });

    butter.listen( "pluginadded", function( e ){
      var element = document.createElement( "div" ),
          iconImg = e.data.helper,
          icon = document.createElement( "span" ),
          text = document.createElement( "span" );

      DragNDrop.helper( element, {
        start: function(){
          var targets = butter.targets,
              media = butter.currentMedia;
          media.view.blink();
          for( var i=0, l=targets.length; i<l; ++i ){
            targets[ i ].view.blink();
          }
        },
        stop: function(){
          
        }
      });

      if( iconImg ) {
        icon.style.backgroundImage = "url('" + iconImg.src + "')";
        icon.className = "icon";
        element.appendChild( icon );
      }
      text.className = "label";
      text.innerHTML = e.data.type;
      element.appendChild( text );

      element.setAttribute( "data-butter-plugin-type", e.data.type );
      element.setAttribute( "data-butter-draggable-type", "plugin" );
      
      _containerElement.appendChild( element );
    });

    _parentElement.style.display = "none";
    _parentElement.classList.add( "fadable" );

	};

});