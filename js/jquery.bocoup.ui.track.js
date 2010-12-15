/*
  jquery.bocoup.ui.track 
*/
(function($,global){

  var auto    = 100,
      eResize = 101,
      wResize = 102,
      drag    = 103
      ;

  var trackCount = -1;

  function TrackEvent( props, parent ){
    $.extend(this, props);
    this.parent = parent;
    this.oxl=0;
    this.oxr=0;
    this.xl=0;
    this.xr=0;
    this.hovered = false;     
    this.draw();
    //this.parent._inView.push( this );
    //console.log( this.popcornEvent.sort(this) );  
    return this;
  };

  TrackEvent.prototype.draw = function trackEvent_draw( thumbLeft, thumbRight ){
    var x   = this.xl = this.oxl + (this.parent.width / this.parent.options.duration * this.inPoint),
        rw  = this.parent.width / this.parent.options.duration * (this.outPoint-this.inPoint),
        h   = this.parent.height,
        c   = this.parent.context;

    this.xr = x + rw;

    //var mouseX = this.parent.mouseX;         
    if( this.hovered ){
      styles.trackEvent.hover( c, x, null, rw, h );
      if( thumbLeft ){
        styles.thumb.left.default( c, x, null, rw, h );
      }
      if( thumbRight ){
        styles.thumb.right.default( c, x, null, rw, h );
      }
    }else{
      styles.trackEvent.default( c, x, null, rw, h );
    }
    
  };


	$.widget("bocoup.track", {

		options: {
		},

		_init: function(){

      this.index = trackCount++;

      // Contains any trackEvent that overlaps the current view window
      this._inView = [];

      this.hovering = null;

      this._loadedmetadata= function(e){
        this.options.duration = e.currentTarget.duration;
      };
		
      this._playBar = {
        position: 30
      };
		
		  function newCanvas(w, h){
  		  var canvas, context;
  		  canvas = document.createElement('canvas');
  		  canvas.width = w;
  		  canvas.height = h;
        context = canvas.getContext('2d');
        return context;
		  };
		  
		  this.width = this.element.width();
		  this.height = this.element.height();

		  $.extend(this, {
		    context   : newCanvas( this.width, this.height ),
		    scrubBar  : { position: 0, width: 3 },
		    mouse     : { x: 0, y:0, down: false, lastX:0, lastY:0, mode:auto }
      });

		  $.extend(this.options, {
		    style: {
		      outerBar: {
            lineWidth: 1,
            strokeStyle: "#888"
          },
          playBar: {
            lineWidth: 1,
            strokeStyle: "#f00"
          }
        }
      });

		  this.element.append( this.context.canvas );

      this.options.target.bind( "timeupdate.track", jQuery.proxy( this._timeupdate, this ) );
      this.options.target.bind( "loadedmetadata.track", jQuery.proxy( this._loadedmetadata, this ) );
      
      this.element.bind( "mousemove.track", jQuery.proxy( this._mousemove, this ) );
      this.element.bind( "mousedown.track mouseup.track", jQuery.proxy( this._mouseupdown, this ) );
      this.element.bind( "mouseenter.track mouseleave.track", jQuery.proxy( this._hover, this ) );
      this._draw();
		},

    _style: function( styleObj ){
      for(var property in styleObj){
        this.context[property] = styleObj[property];
      }
    },
 
    // Contains an array of trackEvent objects
    trackEvents: [],
    
    addTrackEvent: function( props ){
      return this._inView.push(new TrackEvent( props, this ));
    },

   
    _draw: function( thumbLeft, thumbRight ){
      var c = this.context,
          e = c.canvas,
          w = e.width,
          h = e.height;

      var grad = c.createLinearGradient(0,0,0,h);
      grad.addColorStop(0,'#555');
      grad.addColorStop(0.5,'#000');
      grad.addColorStop(1,'#555');
      c.fillStyle = grad;
      c.fillRect(0,0,w,h);

      c.strokeStyle = "#000";
      c.lineWidth = 5;
      c.strokeRect(1.5,1.5,w-1.5,h-1.5);

      for(var i=0, l=this._inView.length; i< l; i++){
        var iv = this._inView[i];
        iv.draw( thumbLeft, thumbRight );
      }

      var pos = this.width / this.options.duration * this._playBar.position;
      c.fillStyle="#F00";
      c.fillRect(pos, 0, 1.5, h);
    },

    _timeupdate: function(e){
      this._playBar.position = e.currentTarget.currentTime;
      var pos = this.width / this.options.duration * this._playBar.position,
          c = this.context;
      this._draw();
    },

    _mousemove: function(e){
      var e = e.originalEvent;
      this.mouse.lastX = this.mouse.x;
      this.mouse.lastY = this.mouse.y;
      
      var scrollX = (window.scrollX !== null && typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset;
      var scrollY = (window.scrollY !== null && typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset;
      this.mouse.x = e.clientX - this.element[0].offsetLeft + scrollX;
      this.mouse.y = e.clientY - this.element[0].offsetTop + scrollY;
      
      var thumbLeft = thumbRight = false;
        
      if(!this.mouse.down){
        this.mouse.hovering = null;
        for(var i=0, l=this._inView.length; i< l; i++){
          var iv = this._inView[i];
          if( iv.xl <= this.mouse.x && iv.xr >= this.mouse.x ){
            if ( iv.hovered == false ){
              iv.hovered = true;
              this.mouse.hovering = iv;
            }
            this.mouse.hovering = iv;
            this.mouse.hovering.grabX = this.mouse.x - this.mouse.hovering.xl + 1;
            
            if( this.mouse.x >= iv.xl && this.mouse.x <= iv.xl + 8 ){
              document.body.style.cursor='w-resize';
              thumbLeft = true;
            }else if( this.mouse.x >= iv.xr-8 && this.mouse.x <= iv.xr ){
              document.body.style.cursor='e-resize';
              thumbRight = true;
            }else{
              document.body.style.cursor='move';
            }
          }else{
            if ( iv.hovered == true ){
              iv.hovered = false;
              this.mouse.hovering = null;
              this._draw();
            }
          }
        }
        if(!this.mouse.hovering){
          this.mouse.mode = auto;
          document.body.style.cursor='auto';
          return;
        }
      }
      
      var iv = this.mouse.hovering;

      if( this.mouse.down ){
              
        if( this.mouse.mode === auto && this.mouse.hovering ){
          if( this.mouse.x >= iv.xl && this.mouse.x <= iv.xl + 8 ){
            this.mouse.mode = wResize;
          }else if( this.mouse.x >= iv.xr-8 && this.mouse.x <= iv.xr ){
            this.mouse.mode = eResize;
          }else if( this.mouse.x >= iv.xl+8 && this.mouse.x <= iv.xr - 8 ){
            this.mouse.mode = drag;
          }
        }
        
        thumbLeft = thumbRight = false;
        
        if( this.mouse.mode === eResize ){
          thumbRight = true;
          document.body.style.cursor='e-resize';
          this.mouse.hovering.outPoint = this.options.duration / this.width * (this.mouse.x+4);
          this.mouse.hovering.popcornEvent.end = this.mouse.hovering.outPoint;
        }else if( this.mouse.mode === wResize ){
          thumbLeft = true;
          document.body.style.cursor='w-resize';
          this.mouse.hovering.inPoint = this.options.duration / this.width * (this.mouse.x-4);
          this.mouse.hovering.popcornEvent.start = this.mouse.hovering.inPoint;
        }else if( this.mouse.mode === drag ){
          document.body.style.cursor='move';
          var diff = this.mouse.hovering.outPoint - this.mouse.hovering.inPoint;
          this.mouse.hovering.inPoint = (this.mouse.x-this.mouse.hovering.grabX) / this.width * this.options.duration;
          this.mouse.hovering.outPoint = this.mouse.hovering.inPoint + diff;
          this.mouse.hovering.popcornEvent.start = this.mouse.hovering.inPoint ;
          this.mouse.hovering.popcornEvent.end = this.mouse.hovering.outPoint ;
        }

      }

//      console.log( this.mouse.mode, this.mouse.hovering, this.mouse.down );

      this._draw(thumbLeft, thumbRight);

    },

    _mouseupdown: function(e){
      if(e.type==='mousedown'){
        
        this.mouse.down = true;
        
      }else if(e.type==='mouseup'){
        this.mouse.mode = auto;
        if(this.mouse.hovering && this.mouse.down ){
          this.mouse.hovering.editEvent();
          this.mouse.hovering = null;
        }
        this.mouse.down = false;
        this._draw();
      }
    },

    _hover: function( e ){
      if(e.type==='mouseenter'){
        this._draw();
      }else if( e.type==='mouseleave' ){
        if( this.mouse.hovering ){
          this.mouse.hovering.hovered = false;
          //this.mouse.hovering = null;
        }
        this._draw();
      }
		},

		myPublicMethod: function(){
		},

		_setOption: function(){
		},

		destroy: function(){
		},

		option: function(){
		},

		setData: function(){
    },

		enable: function(){
    },

		disable: function(){
    }

	});

  var styles = {
    trackEvent: {
      default: function( c, x, y, w, h ){
        //document.body.style.cursor='e-resize';
        var grad = c.createLinearGradient(0,0,0,h);
        grad.addColorStop(0,'rgba( 255, 255, 0, 0.3 )');
        grad.addColorStop(1,'rgba( 255, 255, 0, 0.3 )');
        c.fillStyle = grad;
        c.fillRect(x, 1.5, w, h-1.5);
        c.fillStyle = 'rgba(255,255,255,.125)';
        c.fillRect(x, 0, w, h/2);          
        c.lineWidth=0.5;
        c.fillStyle='#FF0';          
        c.fillRect(x, 3, 1, h-5);
        c.fillRect(x+w-1, 3, 1, h-5);

      },
      hover: function( c, x, y, w, h ){
          //document.body.style.cursor='move';
          c.fillStyle = '#FF0';
          c.fillRect(x, 1.5, w, h-1.5);          
          var grad = c.createLinearGradient(0,0,0,h);
          grad.addColorStop(0,'rgba(255,255,255,.7)');
          grad.addColorStop(1,'rgba(0,0,0,.25)');
          c.fillStyle = grad;
          c.fillRect(x,0, w, h);
          c.fillStyle='#FF0';
          c.fillRect(x, 0, 1, h);
          c.fillRect(x+w-1, 0, 1, h);
          c.fillRect(x, h-1.5, w, 2);
          c.fillRect(x, 0, w, 1);
      }
    },
    thumb: {
      left: {
        default: function( c, x, y, w, h ){
          c.fillStyle = '#880';
          c.fillRect(x, 0, 8, h);
          c.fillStyle = '#FF0';
          c.fillRect(x, 0, 1, h);
        }
      },
      right: {
        default: function( c, x, y, w, h ){
          c.fillStyle = '#880';
          c.fillRect(x+w-9, 0, 8, h);
          c.fillStyle = '#FF0';
          c.fillRect(x+w-1, 0, 1, h);
        }
      }
    }
  };



})(jQuery,document);
