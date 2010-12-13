/*
  jquery.bocoup.ui.track 
*/
(function($){

  function Range( props, parent ){
    $.extend(this, props);
    this.parent = parent;
    this.oxl=0;
    this.oxr=0;
    this.xl=0;
    this.xr=0;
    this.hovered = false;     
    this.draw();
    //this.parent._inView.push( this );
    //console.log( this.popcornRange.sort(this) );  
    return this;
  };

  Range.prototype.draw = function range_draw( leftThumb, rightThumb ){
    var x   = this.xl = this.oxl + (this.parent.width / this.parent.options.duration * this.inPoint),
        rw  = this.parent.width / this.parent.options.duration * (this.outPoint-this.inPoint),
        h   = this.parent.height,
        c   = this.parent.context;

    this.xr = x + rw;

    var mouseX = this.parent.mouseX;

    if( this.hovered ){
      styles.range.hover( c, x, null, rw, h );
      console.log(leftThumb);
      if(leftThumb){
//        styles.thumb.left.hover( c, x, null, rw, h );
      }else{
        styles.thumb.left.default( c, x, null, rw, h );
      }
      if(rightThumb){
//        styles.thumb.left.hover( c, x, null, rw, h );
      }else{
        styles.thumb.right.default( c, x, null, rw, h );
      }
      
    }else{
      styles.range.default( c, x, null, rw, h );     
    }
  };

  
  
  Range.prototype.add = function range_add(){  
  };


	$.widget("bocoup.track", {

		options: {
		},

		_init: function(){

      // Contains any range that overlaps the current view window
      this._inView=[];

      this.hovering = null;

      this._loadedmetadata= function(e){
        this.options.duration = e.currentTarget.duration;
      };
		
      this._playBar= {
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
		    mouse     : { x: 0, y:0, down: false, lastX:0, lastY:0 }
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

 
    // Contains an array of range objects
    ranges: [],

    
    addRange: function( props ){
      return this._inView.push(new Range( props, this ));
    },

   
    _draw: function(){
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
        iv.draw();
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
      var  e = e.originalEvent;
      
      var scrollX = (window.scrollX !== null && typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset;
      var scrollY = (window.scrollY !== null && typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset;
      this.mouse.x = e.clientX - this.element[0].offsetLeft + scrollX;
      this.mouse.y = e.clientY - this.element[0].offsetTop + scrollY;
      
      //iv.draw();
        
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

            if( this.mouse.x >= this.xl && this.mouse.x <= this.xl + 8 ){
              this._draw(true);
            }else{
              this._draw();
            }
            
          }else{
            if ( iv.hovered == true ){
              iv.hovered = false;
              this._draw();
            }
          }
        }
      }
      if(this.mouse.hovering && this.mouse.down){
        var diff = this.mouse.hovering.outPoint - this.mouse.hovering.inPoint;
        this.mouse.hovering.inPoint = (this.mouse.x-this.mouse.hovering.grabX) / this.width * this.options.duration;
        this.mouse.hovering.outPoint =  this.mouse.hovering.inPoint + diff;
        this.mouse.hovering.popcornRange.start = this.mouse.hovering.inPoint ;
        this.mouse.hovering.popcornRange.end = this.mouse.hovering.outPoint ;        
        this._draw();
      }

    },

    _mouseupdown: function(e){
      if(e.type==='mousedown'){

        this.mouse.down = true;        
      }else if(e.type==='mouseup'){

        if(this.mouse.hovering && this.mouse.down ){
          console.log(this, e);
          this.mouse.down = false;
          this.mouse.hovering = null;
        }
          
      }
    },

    _hover: function( e ){

      if(e.type==='mouseenter'){
//        this._draw();
      }else if(e.type==='mouseleave'){
        this.mouse.down = false;
        this.mouse.hovering = null;
//      this._draw();
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
    range: {
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
          document.body.style.cursor='move';
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
          var grad = c.createLinearGradient(0,0,0,h);
          c.fillStyle = '#880';
          c.fillRect(x, 0, 8, h);
          c.lineWidth=0.5;
          c.strokeStyle="#000";
          c.fillStyle = '#440';
          c.fillRect(x+6,0,1,h);
          c.beginPath();
            c.moveTo(x+1,20);
            c.lineTo(x+5,25);
            c.lineTo(x+5,15);
            c.lineTo(x+1,20);
          c.closePath();
          c.fill();
          c.stroke();
          c.beginPath();
            c.moveTo(x+1,10);
            c.lineTo(x+5,15);
            c.lineTo(x+5,5);
            c.lineTo(x+1,10);
          c.closePath();
          c.fill();
          c.stroke();
        },
        hover: function( c, x, y, w, h ){
          var grad = c.createLinearGradient(0,0,0,h);
          c.fillStyle = '#FF0';
          c.fillRect(x, 0, 8, h);
          c.lineWidth=0.5;
          c.strokeStyle="#000";
          c.fillStyle = '#440';
          c.fillRect(x+6,0,1,h);
          c.beginPath();
            c.moveTo(x+1,20);
            c.lineTo(x+5,25);
            c.lineTo(x+5,15);
            c.lineTo(x+1,20);
          c.closePath();
          c.fill();
          c.stroke();
          c.beginPath();
            c.moveTo(x+1,10);
            c.lineTo(x+5,15);
            c.lineTo(x+5,5);
            c.lineTo(x+1,10);
          c.closePath();
          c.fill();
          c.stroke();
        }
      },
      right: {
        default: function( c, x, y, w, h ){
          var grad = c.createLinearGradient(0,0,0,h);
          c.fillStyle = '#880';
          c.fillRect(x+w-8, 0, 8, h);
          c.lineWidth=0.5;
          c.strokeStyle='#000';
          c.fillStyle='#440';
          c.fillRect(x+w-8,0,1,h);
          c.beginPath();
            c.moveTo(x+w-1,20);
            c.lineTo(x+w-5,25);
            c.lineTo(x+w-5,15);
            c.lineTo(x+w-1,20);
          c.closePath();
          c.fill();
          c.stroke();
          c.beginPath();
            c.moveTo(x+w-1,10);
            c.lineTo(x+w-5,15);
            c.lineTo(x+w-5,5);
            c.lineTo(x+w-1,10);
          c.closePath();
          c.fill();
          c.stroke();
        }
      },      
    }
  };



})(jQuery);
