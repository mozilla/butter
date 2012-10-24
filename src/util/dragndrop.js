/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ 'core/eventmanager' ], function( EventManager ) {

  var SCROLL_INTERVAL = 16,
      DEFAULT_SCROLL_AMOUNT = 10,
      SCROLL_WINDOW = 10,
      MAXIMUM_Z_INDEX = 2147483647,
      MIN_WIDTH = 15,
      RESIZABLE_CLASS = "butter-resizable";

  var NULL_FUNCTION = function(){};

  var __droppables = [],
      __mouseDown = false,
      __selectedDraggables = [],
      __mousePos = [ 0, 0 ],
      __mouseLast = [ 0, 0 ],
      __scroll = false,
      __helpers = [],
      __draggedOnce = false;

  // for what seems like a bug in chrome. :/
  // dataTransfer.getData seems to report nothing
  var __currentDraggingElement;

  var __nullRect = {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0
  };

  var DragNDrop = {};

  function updateTimeout(){
    __scroll = false;
    if( __mouseDown ){
      for( var i = __selectedDraggables.length - 1; i >= 0; --i ){
        __selectedDraggables[ i ].update();
      }
      window.setTimeout( updateTimeout, SCROLL_INTERVAL );
    }
  }

  function onDragged( e ) {
    __mouseLast[ 0 ] = __mousePos[ 0 ];
    __mouseLast[ 1 ] = __mousePos[ 1 ];
    __mousePos = [ e.clientX, e.clientY ];
    __draggedOnce = true;

    var remembers,
        droppable,
        remember,
        i,
        j;

    remembers = __selectedDraggables.slice();

    if( !__mouseDown ){
      __mouseDown = true;
      window.setTimeout( updateTimeout, SCROLL_INTERVAL );
      for( i = remembers.length - 1; i >= 0; --i ){
        remembers[ i ].start( e );
      }
    }

    for( i = remembers.length - 1; i >= 0; --i ){
      remember = remembers[ i ];
      remember.drag( e );
      for( j = __droppables.length - 1; j >= 0; --j ){
        droppable = __droppables[ j ];
        if( remember.element === droppable.element ||
            !droppable.drag( remember.element.getBoundingClientRect() ) ){
          droppable.forget( remember );
        }
        else {
          // If we stumbled on a valid droppable early in the array
          // and the draggable has a droppable already that is, perhaps
          // further along in the array, forcefully forget the draggable
          // before telling another droppable to remember it.
          if ( remember.droppable && remember.droppable !== droppable ) {
            remember.droppable.forget( remember );
          }
          droppable.remember( remember );
          break;
        }
      }
    }
  }

  function onMouseUp( e ) {
    __mouseDown = false;

    window.removeEventListener( "mousemove", onDragged, false );

    var selectedDraggable,
        selectedDraggables = __selectedDraggables.slice(),
        droppables = [],
        droppable,
        i;

    if ( __draggedOnce ) {

      // Collect all the droppables
      for ( i = selectedDraggables.length - 1; i >= 0; --i ) {
        selectedDraggable = selectedDraggables[ i ];
        droppable = selectedDraggable.droppable;
        if ( droppable && droppables.indexOf( droppable ) === -1 ) {
          droppables.push( droppable );
        }
      }

      // Let droppable know that it's about to receive one or more items
      for ( i = droppables.length - 1; i >= 0; --i ) {
        droppables[ i ].startDrop();
      }

      for ( i = selectedDraggables.length - 1; i >= 0; --i ) {
        selectedDraggable = selectedDraggables[ i ];
        selectedDraggable.stop();
      }

      for ( i = selectedDraggables.length - 1; i >= 0; --i ) {
        selectedDraggable = selectedDraggables[ i ];
        selectedDraggable.drop();
      }

      for ( i = selectedDraggables.length - 1; i >= 0; --i ) {
        selectedDraggable = selectedDraggables[ i ];
        selectedDraggable.reset();
      }

      // Let droppable know that we're done dropping
      for ( i = droppables.length - 1; i >= 0; --i ) {
        droppables[ i ].stopDrop();
      }

      DragNDrop.dispatch( "dropfinished" );

    }

    __draggedOnce = false;
  }

  function onMouseDown( e ) {
    if ( e.which !== 1 ) {
      onMouseUp( e );
      return;
    }
    __draggedOnce = false;
    e.stopPropagation();
    window.addEventListener( "mousemove", onDragged, false );
    window.addEventListener( "mouseup", onMouseUp, false );
  }

  function getPaddingRect( element ){
    var style = getComputedStyle( element ),
          top = style.getPropertyValue( "padding-top" ),
          left = style.getPropertyValue( "padding-left" ),
          bottom = style.getPropertyValue( "padding-bottom" ),
          right = style.getPropertyValue( "padding-right" );

      return {
        top: Number(top.substring( 0, top.indexOf( "px" ) ) ),
        left: Number(left.substring( 0, left.indexOf( "px" ) ) ),
        bottom: Number(bottom.substring( 0, bottom.indexOf( "px" ) ) ),
        right: Number(right.substring( 0, right.indexOf( "px" ) ) )
      };
  }

  function __getWindowRect(){
    return {
      top: 0,
      left: 0,
      right: window.innerWidth,
      bottom: window.innerHeight
    };
  }

  function checkParent ( parent, child ) {
    var parentNode = child.parentNode;
    while( parentNode ) {
      if ( parentNode === parent ) {
        return true;
      }
      parentNode = parentNode.parentNode;
    }
    return false;
  }

  function getHighestZIndex ( element ) {
    var z = getComputedStyle( element ).zIndex;
    if ( isNaN( z ) ) {
      z = 0;
      var parentNode = element.parentNode;
      while ( parentNode && [ window, document ].indexOf( parentNode ) === -1 ) {
        var style = getComputedStyle( parentNode );
        if ( style ) {
          var nextZ = style.zIndex;
          if ( isNaN( nextZ ) && nextZ > z ) {
            z = nextZ;
          }
        }
        parentNode = parentNode.parentNode;
      }
    }

  }

  function __sortDroppables(){
    __droppables = __droppables.sort( function ( a, b ) {

      var elementA = a.element,
          elementB = b.element,
          zA = getHighestZIndex( elementA ),
          zB = getHighestZIndex( elementB );

      if ( checkParent( elementA, elementB ) ) {
        return -1;
      }
      else if ( checkParent( elementB, elementA ) ) {
        return 1;
      }

      return zA - zB;
    });
  }

  function Resizable( element, options ){
    var _leftHandle = element.querySelector( ".handle.left-handle" ),
        _rightHandle = element.querySelector( ".handle.right-handle" ),
        _onStart = options.start || NULL_FUNCTION,
        _onStop = options.stop || NULL_FUNCTION,
        _onResize = options.resize || NULL_FUNCTION,
        _padding = options.padding || 0,
        _updateInterval = -1,
        _scroll = options.scroll,
        _scrollRect,
        _elementRect,
        _lastDims,
        _iterationBlockX,
        _resizeEvent = {                                                      // Exposed on callbacks of Resizable

          /**
           * blockIteration
           *
           * Blocks one iteration of the resize loop at the specified value. This function will be exposed and be active
           * on the `resize` callback of a Resizable.
           *
           * @param {Number} value: The value at which resizing should be stopped. For resizing start by the right-handle,
           *                        this is treated as a width value. For the left-handle, it's a left value.
           */
          blockIteration: function( value ) {
            _iterationBlockX = value;
          },
          direction: null
        };

    function onLeftMouseDown( e ){
      e.stopPropagation();

      var originalRect = element.getBoundingClientRect(),
          originalPosition = element.offsetLeft,
          originalWidth = element.clientWidth,
          mouseDownPosition = e.clientX,
          mousePosition,
          mouseOffset;

      function update(){
        var diff = mousePosition - mouseDownPosition,
            newX = originalPosition + diff,
            newW = originalWidth - diff;

        // At the beginning of this iteration, _iterationBlockX should be null, assuming no block occured.
        _iterationBlockX = null;

        if( newW < MIN_WIDTH ){
          return;
        }

        if( _scroll && _scroll.scrollLeft > 0 ){
          if( originalRect.left + diff < _scrollRect.left - SCROLL_WINDOW ){
            _scroll.scrollLeft -= DEFAULT_SCROLL_AMOUNT;
            newX -= DEFAULT_SCROLL_AMOUNT;
            newW += DEFAULT_SCROLL_AMOUNT;
            mouseDownPosition += DEFAULT_SCROLL_AMOUNT;
          }
        }

        if( newX < 0 ){
          newW += newX;
          newX = 0;
        }

        // If the size actually changed, use the _onResize callback to notify handlers of this Resizable,
        // and expose the opportunity to block this iteration from actually resizing the element.
        if ( _lastDims[ 0 ] !== newX || _lastDims[ 1 ] !== newW ) {
          _onResize( newX, newW, _resizeEvent );
        }

        // If _iterationBlockX is non-null, this iteration was meant to be blocked at that value. Since
        // we're resizing wrt the left side of the element here, _iterationBlockX is used to find the
        // left side of the resizing element, and subsequently, a corresponding width value.
        if ( _iterationBlockX === null ) {
          element.style.left = newX + "px";
          element.style.width = newW - _padding + "px";
          _elementRect = element.getBoundingClientRect();

          _lastDims[ 0 ] = newX;
          _lastDims[ 1 ] = newW;
        }
        else {
          newX = _iterationBlockX;
          newW = originalPosition + originalWidth - newX;

          element.style.left = newX + "px";
          element.style.width = newW - _padding + "px";
          _elementRect = element.getBoundingClientRect();

          _lastDims[ 0 ] = newX;
          _lastDims[ 1 ] = newW;
        }

      }

      function onMouseUp( e ){
        window.removeEventListener( "mousemove", onMouseMove, false );
        window.removeEventListener( "mouseup", onMouseUp, false );
        clearInterval( _updateInterval );
        _updateInterval = -1;
        _onStop( _resizeEvent );
        element.classList.remove( RESIZABLE_CLASS );
      }

      function onMouseMove( e ){
        e.preventDefault();
        mousePosition = e.clientX;
        if( _updateInterval === -1 ){
          _lastDims = [];
          _resizeEvent.direction = 'left';
          _updateInterval = setInterval( update, SCROLL_INTERVAL );
          _onStart();
        }
      }

      _elementRect = element.getBoundingClientRect();
      mouseOffset = e.clientX - _elementRect.left;
      _scrollRect = _scroll.getBoundingClientRect();

      element.classList.add( RESIZABLE_CLASS );

      window.addEventListener( "mousemove", onMouseMove, false );
      window.addEventListener( "mouseup", onMouseUp, false );
    }

    function onRightMouseDown( e ){
      e.stopPropagation();

      var originalPosition = element.offsetLeft,
          originalWidth = element.offsetWidth,
          mouseDownPosition = e.clientX,
          mousePosition,
          mouseOffset;

      function update(){
        var diff = mousePosition - mouseDownPosition,
            newW = originalWidth + diff;

        // At the beginning of this iteration, _iterationBlockX should be null, assuming no block occured.
        _iterationBlockX = null;

        if( newW < MIN_WIDTH ){
          return;
        }

        if( _scroll && _scroll.scrollLeft < _scroll.scrollWidth - _scrollRect.width ){
          if( mousePosition > _scrollRect.right + SCROLL_WINDOW ){
            _scroll.scrollLeft += DEFAULT_SCROLL_AMOUNT;
            mouseDownPosition -= DEFAULT_SCROLL_AMOUNT;
          }
        }

        if( newW + originalPosition > element.offsetParent.offsetWidth ){
          newW = element.offsetParent.offsetWidth - originalPosition;
        }

        // If the size actually changed, use the _onResize callback to notify handlers of this Resizable,
        // and expose the opportunity to block this iteration from actually resizing the element.
        if ( _lastDims[ 1 ] !== newW ) {
          _onResize( originalPosition, newW, _resizeEvent );
        }

        // If _iterationBlockX is non-null, this iteration was meant to be blocked at that value. Since
        // we're resizing wrt the right side of the element here, _iterationBlockX is used to find the
        // width of the resizing element.
        if ( _iterationBlockX === null ) {
          element.style.width = newW + "px";
          _elementRect = element.getBoundingClientRect();
          _lastDims[ 1 ] = newW;
        }
        else {
          newW = _iterationBlockX - originalPosition;
          element.style.width = newW + "px";
          _elementRect = element.getBoundingClientRect();
          _lastDims[ 1 ] = newW;
        }
      }

      function onMouseUp( e ){
        window.removeEventListener( "mousemove", onMouseMove, false );
        window.removeEventListener( "mouseup", onMouseUp, false );
        clearInterval( _updateInterval );
        _updateInterval = -1;
        _onStop( _resizeEvent );
        element.classList.remove( RESIZABLE_CLASS );
      }

      function onMouseMove( e ){
        mousePosition = e.clientX;
        if( _updateInterval === -1 ){
          _lastDims = [];
          _resizeEvent.direction = 'right';
          _updateInterval = setInterval( update, SCROLL_INTERVAL );
          _onStart();
        }
      }

      _elementRect = element.getBoundingClientRect();
      if( _scroll ){
        _scrollRect = _scroll.getBoundingClientRect();
      }
      mouseOffset = e.clientX - _elementRect.left;

      element.classList.add( RESIZABLE_CLASS );

      window.addEventListener( "mousemove", onMouseMove, false );
      window.addEventListener( "mouseup", onMouseUp, false );

    }

    _leftHandle.addEventListener( "mousedown", onLeftMouseDown, false );
    _rightHandle.addEventListener( "mousedown", onRightMouseDown, false );

    return {
      destroy: function(){
        _leftHandle.removeEventListener( "mousedown", onLeftMouseDown, false );
        _rightHandle.removeEventListener( "mousedown", onRightMouseDown, false );
      }
    };
  }

  function Helper( element, options ){
    var _image = options.image,
        _onStart = options.start || NULL_FUNCTION,
        _onStop = options.stop || NULL_FUNCTION,
        _id = __helpers.length;

    __helpers[ _id ] = element;

    element.setAttribute( "draggable", true );

    element.addEventListener( "dragstart", function( e ){
      __currentDraggingElement = element;
      e.dataTransfer.effectAllowed = "all";
      console.log(e.dataTransfer.effectAllowed);
      // coerce to string so IE9 doesn't throw
      e.dataTransfer.setData( "text", _id + "" );
      if( _image ){
        var img = document.createElement( "img" );
        img.src = _image.src;
        e.dataTransfer.setDragImage( img, img.width / 2, img.height / 2 );
      }
      _onStart();
    });

    element.addEventListener( "dragend", function( e ){
      __currentDraggingElement = null;
      _onStop();
    });

    element.addEventListener( "drop", function( e ){
    });
  }

  function Droppable( element, options ){
    options = options || {};
    var _hoverClass = options.hoverClass,
        _onDrop = options.drop || NULL_FUNCTION,
        _onOver = options.over || NULL_FUNCTION,
        _onOut = options.out || NULL_FUNCTION,
        _onStartDrop = options.startDrop || NULL_FUNCTION,
        _onStopDrop = options.stopDrop || NULL_FUNCTION,
        _droppable = {},
        _data = options.data,
        _rememberedDraggables = [];

    function onDrop( e ) {
      e.preventDefault();
      e.stopPropagation();

      if( _hoverClass ){
        element.classList.remove( _hoverClass );
      }
      var transferData = e.dataTransfer.getData( "text" ),
          helper = __helpers[ transferData ] || __currentDraggingElement;
      if( helper ){
        _onDrop( helper, [ e.clientX, e.clientY ] );
      }
    }

    function onDragOver( e ) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "copy";
    }

    function onDragEnter( e ) {
      if( _hoverClass ) {
        element.classList.add( _hoverClass );
      }

      if ( e.dataTransfer.effectAllowed === "uninitialized" ) {
        return;
      }

      var transferData = e.dataTransfer.getData( "text" ),
          helper = __helpers[ transferData ] || __currentDraggingElement;
      if( helper ){
        _onOver( helper, [ e.clientX, e.clientY ] );
      }
    }

    function onDragLeave( e ) {
      if ( _hoverClass ) {
        element.classList.remove( _hoverClass );
      }

      if ( e.dataTransfer.effectAllowed === "uninitialized" ) {
        return;
      }

      var transferData = e.dataTransfer.getData( "text" ),
          helper = __helpers[ transferData ] || __currentDraggingElement;
      if( helper ){
        _onOut( helper, [ e.clientX, e.clientY ] );
      }
    }

    element.addEventListener( "drop", onDrop, false );
    element.addEventListener( "dragover", onDragOver, false );
    element.addEventListener( "dragenter", onDragEnter, false );
    element.addEventListener( "dragleave", onDragLeave, false );

    function removeDraggable( draggable ) {
      var idx = _rememberedDraggables.indexOf( draggable );
      if( idx > -1 ){
        _rememberedDraggables.splice( idx, 1 );
        if( _rememberedDraggables.length === 0 ){
          element.classList.remove( _hoverClass );
        }
      }
      return idx > -1;
    }

    _droppable = {
      element: element,
      startDrop: _onStartDrop,
      stopDrop: _onStopDrop,
      remember: function( draggable ){
        var idx = _rememberedDraggables.indexOf( draggable );
        if( idx === -1 ){
          _rememberedDraggables.push( draggable );
          element.classList.add( _hoverClass );
          draggable.droppable = _droppable;
          _onOver( draggable.element );
        }
      },
      forget: function( draggable ){
        if ( removeDraggable( draggable ) ) {
          draggable.droppable = null;
          _onOut( draggable.element );
        }
      },
      drop: function( draggable ){
        if ( removeDraggable( draggable ) ) {
          _onDrop( draggable, __mousePos );
        }
      },
      drag: function( dragElementRect ){
        var rect = element.getBoundingClientRect();

        var maxL = Math.max( dragElementRect.left, rect.left ),
            maxT = Math.max( dragElementRect.top, rect.top ),
            minR = Math.min( dragElementRect.right, rect.right ),
            minB = Math.min( dragElementRect.bottom, rect.bottom );

        if( minR < maxL || minB < maxT ){
          return false;
        }

        var overlapDims = [ minR - maxL, minB - maxT ];

        if( overlapDims[ 0 ] * overlapDims[ 1 ] / 2 > dragElementRect.width * dragElementRect.height / 4 ){
          return true;
        }

        return false;
      },
      destroy: function(){
        var idx = __droppables.indexOf( _droppable );
        if ( idx > -1 ) {
          __droppables.splice( idx, 1 );
        }
        element.removeEventListener( "drop", onDrop, false );
        element.removeEventListener( "dragover", onDragOver, false );
        element.removeEventListener( "dragenter", onDragEnter, false );
        element.removeEventListener( "dragleave", onDragLeave, false );
      },
    };

    Object.defineProperties( _droppable, {
      data: {
        enumerable: true,
        get: function() {
          return _data;
        }
      }
    });

    __droppables.push( _droppable );
    __sortDroppables();

    return _droppable;
  }

  function Draggable( element, options ){
    options = options || {};

    var _containment = options.containment,
        _scroll = options.scroll,
        _axis = options.axis,
        _revert = options.revert,
        _mouseOffset,
        _element = element,
        _elementRect,
        _scrollRect,
        _offsetParentRect,
        _containmentRect,
        _scrollAmount = options.scrollAmount || DEFAULT_SCROLL_AMOUNT,
        _oldZIndex,
        _onStart = options.start || NULL_FUNCTION,
        _onStop = options.stop || function(){ return false; },
        _onDrag = options.drag || NULL_FUNCTION,
        _originalPosition,
        _draggable = {},
        _data = options.data,
        _containmentPadding = __nullRect;

    if( _containment ){
      _containmentPadding = getPaddingRect( _containment );
    }

    _draggable.updateRects = function(){
      _containmentRect = _containment ? _containment.getBoundingClientRect() : __getWindowRect();
      _offsetParentRect = element.offsetParent ? element.offsetParent.getBoundingClientRect() : _containmentRect;
      _scrollRect = _scroll ? _scroll.getBoundingClientRect() : _containmentRect;
      _elementRect = element.getBoundingClientRect();
    };

    function updatePosition(){
      var x = __mousePos[ 0 ] - _mouseOffset[ 0 ],
          y = __mousePos[ 1 ] - _mouseOffset[ 1 ];

      if( !_axis || _axis.indexOf( "x" ) > -1 ){
        element.style.left = ( x - _offsetParentRect.left ) + "px";
      }

      if( !_axis || _axis.indexOf( "y" ) > -1 ){
        element.style.top = ( y - _offsetParentRect.top ) + "px";
      }

      _elementRect = element.getBoundingClientRect();
    }

    function checkScroll(){
      if( !__scroll ){
        if( __mousePos[ 0 ] > _scrollRect.right + SCROLL_WINDOW ){
          __scroll = true;
          _scroll.scrollLeft += _scrollAmount;
        }
        else if( __mousePos[ 0 ] < _scrollRect.left - SCROLL_WINDOW ){
          __scroll = true;
          _scroll.scrollLeft -= _scrollAmount;
        }
      }
      _draggable.updateRects();
    }

    function checkContainment(){
      var x = _elementRect.left,
          y = _elementRect.top,
          r = x + _elementRect.width,
          b = y + _elementRect.height;

      if( !_axis || _axis.indexOf( "y" ) > -1 ){

        if( y < _containmentRect.top ){
          y = _containmentRect.top;
        }
        else if( b > _containmentRect.bottom ){
          y = _containmentRect.bottom - _elementRect.height;
        }
        //TODO: Scrolling for Y
        element.style.top = ( y - _offsetParentRect.top - _containmentPadding.top ) + "px";
      }

      if( !_axis || _axis.indexOf( "x" ) > -1 ){
        if( r > _scrollRect.right + SCROLL_WINDOW ){
          if( x > _scrollRect.right - SCROLL_WINDOW ){
            x = _scrollRect.right - SCROLL_WINDOW;
            r = x + _elementRect.width;
          }
        }
        else if( x < _scrollRect.left - SCROLL_WINDOW ){
          if( r < _scrollRect.left + SCROLL_WINDOW ){
            r = _scrollRect.left + SCROLL_WINDOW;
            x = r - _elementRect.width;
          }
        }
        if( x < _containmentRect.left ){
          x = _containmentRect.left;
        }
        else if( r > _containmentRect.right ){
          x = _containmentRect.right - _elementRect.width;
        }
        element.style.left = ( x - _offsetParentRect.left - _containmentPadding.left ) + "px";
      }

      _elementRect = element.getBoundingClientRect();
    }

    element.addEventListener( "mousedown", onMouseDown, false );

    _draggable.droppable = null;

    _draggable.destroy = function() {
      _draggable.selected = false;
      element.removeEventListener( "mousedown", onMouseDown, false );
    };

    _draggable.update = function() {
      updatePosition();
      if( _scroll ){
        checkScroll();
      }
      checkContainment();
    };

    _draggable.getLastRect = function() {
      return _elementRect;
    };

    _draggable.start = function( e ){
      _originalPosition = [ element.offsetLeft, element.offsetTop ];
      _draggable.updateRects();
      _mouseOffset = [ e.clientX - _elementRect.left, e.clientY - _elementRect.top ];
      _onStart();
      // Make sure the position is up to date after this call because the user may
      // have moved the element around in the DOM tree.
      _draggable.updateRects();
      updatePosition();
    };

    _draggable.drag = function( e ) {
      if ( _draggable.droppable ) {
        _onDrag( _draggable, _draggable.droppable );
      }
    };

    _draggable.drop = function( e ) {
      if ( _draggable.droppable ) {
        _draggable.droppable.drop( _draggable );
      }
    };

    _draggable.stop = function() {
      // If originalPosition is not null, start() was called
      if ( _originalPosition ) {
        _onStop();
      }
    };

    _draggable.reset = function() {
      if ( !_draggable.droppable && _revert && _originalPosition ) {
        element.style.left = _originalPosition[ 0 ] + "px";
        element.style.top = _originalPosition[ 1 ] + "px";
      }
      _draggable.droppable = null;
      _originalPosition = null;
    };

    Object.defineProperties( _draggable, {
      data: {
        enumerable: true,
        get: function() {
          return _data;
        }
      },
      selected: {
        enumerable: true,
        get: function(){
          for( var i = __selectedDraggables.length - 1; i >= 0; --i ){
            if( __selectedDraggables[ i ].element === _element ){
              return true;
            }
          }
          return false;
        },
        set: function( val ){
          if ( val ) {
            _oldZIndex = getComputedStyle( element ).getPropertyValue( "z-index" );
            element.style.zIndex = MAXIMUM_Z_INDEX;
            __selectedDraggables.push( _draggable );
          }
          else {
            element.style.zIndex = _oldZIndex;
            for ( var i = __selectedDraggables.length - 1; i >= 0; --i ) {
              if ( __selectedDraggables[ i ].element === _element ) {
                __selectedDraggables.splice( i, 1 );
                return;
              }
            }
          }
        }
      },
      element: {
        enumerable: true,
        get: function(){
          return _element;
        }
      }
    });

    return _draggable;
  }

  function Sortable( parentElement, options ){

    var _onChange = options.change || NULL_FUNCTION,
        _elements = [],
        _instance = {},
        _mouseDownPosition = 0,
        _draggingElement,
        _draggingOriginalPosition,
        _moved,
        _hoverElement,
        _placeHolder,
        _oldZIndex;


    function createPlaceholder( victim ){
      var placeholder = victim.cloneNode( false );
      placeholder.classList.add( "placeholder" );
      parentElement.replaceChild( placeholder, victim );
      return placeholder;
    }

    function positionElement( diff ){
      _draggingElement.style.top = _draggingOriginalPosition - diff + "px";
    }

    function onElementMouseMove( e ){
      if( !_moved ){
        _moved = true;
        _placeHolder = createPlaceholder( _draggingElement );
        parentElement.appendChild( _draggingElement );
        _draggingElement.style.position = "absolute";
        _draggingElement.style.zIndex = MAXIMUM_Z_INDEX;
        positionElement( 0 );
      }
      else{
        var diff = _mouseDownPosition - e.clientY;
        positionElement( diff );
        var dragElementRect = _draggingElement.getBoundingClientRect();
        for( var i=_elements.length - 1; i>=0; --i ){
          var element = _elements[ i ];

          if( element === _draggingElement ){
            continue;
          }

          var rect = element.getBoundingClientRect();

          var maxL = Math.max( dragElementRect.left, rect.left ),
              maxT = Math.max( dragElementRect.top, rect.top ),
              minR = Math.min( dragElementRect.right, rect.right ),
              minB = Math.min( dragElementRect.bottom, rect.bottom );

          if( minR < maxL || minB < maxT ){
            continue;
          }

          var overlapDims = [ minR - maxL, minB - maxT ];

          if( overlapDims[ 0 ] * overlapDims[ 1 ] / 2 > dragElementRect.width * dragElementRect.height / 4 ){
            _hoverElement = element;
            var newPlaceHolder = createPlaceholder( _hoverElement );
            parentElement.replaceChild( _hoverElement, _placeHolder );
            _placeHolder = newPlaceHolder;
            var orderedElements = [],
                childNodes = parentElement.childNodes;
            for( var j=0, l=childNodes.length; j<l; ++j ){
              var child = childNodes[ j ];
              if( child !== _draggingElement ){
                if( child !== _placeHolder ){
                  orderedElements.push( child );
                }
                else{
                  orderedElements.push( _draggingElement );
                }
              }
            }
            _onChange( orderedElements );
          }
        }
      }
    }

    function onElementMouseDown( e ){
      if( e.which !== 1 ){
        return;
      }
      _moved = false;
      _draggingElement = this;
      _draggingOriginalPosition = _draggingElement.offsetTop;

      var style = getComputedStyle( _draggingElement );

      _oldZIndex = style.getPropertyValue( "z-index" );
      _mouseDownPosition = e.clientY;

      window.addEventListener( "mouseup", onElementMouseUp, false );
      window.addEventListener( "mousemove", onElementMouseMove, false );
    }

    function onElementMouseUp( e ){
      _draggingElement.style.zIndex = _oldZIndex;
      window.removeEventListener( "mouseup", onElementMouseUp, false );
      window.removeEventListener( "mousemove", onElementMouseMove, false );
      _moved = false;
      if( _placeHolder ){
        _draggingElement.style.zIndex = "";
        _draggingElement.style.position = "";
        _draggingElement.style.top = "";
        parentElement.replaceChild( _draggingElement, _placeHolder );
        _placeHolder = null;
      }
    }

    _instance.addItem = function( item ){
      _elements.push( item );
      item.addEventListener( "mousedown", onElementMouseDown, false );
    };

    _instance.removeItem = function( item ){
      _elements.splice( _elements.indexOf( item ), 1 );
      item.removeEventListener( "mousedown", onElementMouseDown, false );
    };

    return _instance;
  }

  DragNDrop.draggable = Draggable;
  DragNDrop.droppable = Droppable;
  DragNDrop.helper = Helper;
  DragNDrop.resizable = Resizable;
  DragNDrop.sortable = Sortable;

  EventManager.extend( DragNDrop );

  return DragNDrop;

});

