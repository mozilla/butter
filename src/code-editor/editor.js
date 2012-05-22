/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define([  "../../external/codemirror/codemirror-compressed.js", "util/lang", "ui/position-tracker",
          "text!layouts/code-editor-button.html", "text!layouts/code-editor.html" ],
  function( CodeMirrorDummy, LangUtils, PositionTracker, CODE_EDITOR_BUTTON_SRC, CODE_EDITOR_SRC ){

  var __elements = {};

  var BUTTON_WIDTH = 30,
      EDITOR_WIDTH = 600,
      EDITOR_HEIGHT = 300;

  return function( butter ){
    var _timelineHeight;

    function positionWrapper( rect, wrapper ){
      var left = rect.right,
          top = rect.top;

      if ( rect.right + EDITOR_WIDTH > window.innerWidth ) {
        left = rect.left - EDITOR_WIDTH;
      }

      if ( rect.top + EDITOR_HEIGHT > window.innerHeight - _timelineHeight ) {
        top = window.innerHeight - _timelineHeight - EDITOR_HEIGHT;
      }

      wrapper.style.left = left + "px";
      wrapper.style.top = top + "px";
    }

    function onMoved( rect, button, wrapper ){
      button.style.left = rect.right - BUTTON_WIDTH + "px";
      button.style.top = rect.top + "px";
      positionWrapper( rect, wrapper );
    }

    butter.listen('ready', function(){
      _timelineHeight = butter.ui.areas.main.element.clientHeight;
    });

    this.activate = function( element ) {

      var button = LangUtils.domFragment( CODE_EDITOR_BUTTON_SRC ),
          editorWrapper = LangUtils.domFragment( CODE_EDITOR_SRC ),
          positionTracker = PositionTracker( element, function( rect ) {
            onMoved( rect, button, editorWrapper );
          }),
          editor = CodeMirror( function( codeMirrorElement ) {
              editorWrapper.appendChild( codeMirrorElement );
            },
            {
              mode: 'text/html',
              tabMode: 'indent',
              gutter: true,
              lineNumbers: true,
              theme: 'ambiance'
            }),
          isOpen = false;

      var onChanged = function( properties ){
        element.innerHTML = editor.getValue();
      };

      document.body.appendChild( editorWrapper );

      var onButtonClicked = function( e ) {
        if( isOpen ){
          editorWrapper.classList.remove( "expanded" );
          editor.setOption( 'onChange', null );
        }
        else{
          editorWrapper.classList.add( "expanded" );
          editor.setOption( 'onChange', onChanged );
          positionWrapper( element.getBoundingClientRect(), editorWrapper );
        }
        isOpen = !isOpen;
        editor.setValue( element.innerHTML );
      };

      button.addEventListener( "click", onButtonClicked, false );

      var context = {

        destroy: function() {
          button.removeEventListener( "click", onButtonClicked, false );
          button.parentNode.removeChild( button );
          positionTracker.destroy();
        }

      };

      document.body.appendChild( button );

      __elements[ element ] = context;
    };

    this.deactivate = function( element ){
      if( __elements[ element ] ){
        __elements[ element ].destroy();
        delete __elements[ element ];
      }
    };

  };
});