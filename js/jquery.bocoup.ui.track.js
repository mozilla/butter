(function($){

	$.widget("bocoup.track", {

		options: {
		},

		_init: function(){
		
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

      this.element.bind( "mousemove.track", jQuery.proxy( this._mousemove, this ) );
      this.element.bind( "mousedown.track mouseup.track", jQuery.proxy( this._mouseupdown, this ) );
      this.element.bind( "mouseenter.track mouseleave.track", jQuery.proxy( this._hover, this ) );

      this._draw();
		},
		
    _playbar: {},

    _style: function( styleObj ){
      for(var property in styleObj){
        this.context[property] = styleObj[property];
      }
    },

    // Contains any range that overlaps the current view window
    _inView: [],
  
    // Contains an array of range objects
    ranges: [],

    _Range: function( props, parent ){

      $.extend(this, props);

      this.parent = parent;

      this.thumb = {
        left: {
          hidden:false
        },
        right: {
          hidden:false
        }
      };

      this.xl=0;
      this.xr=0;
      this.hovered = true;
     
      this.draw = function(){
        
        var x   = this.xl = this.parent.width / parent.options.duration * this.inPoint,
            rw  = this.xr = this.parent.width / parent.options.duration * (this.outPoint-this.inPoint),
            h = this.parent.height,
            c = this.parent.context;


        if( !this.hovered ){
          document.body.style.cursor='move';

          // BackGround
          var grad = c.createLinearGradient(0,0,0,h);
          grad.addColorStop(0,'rgba( 255, 255, 0, 0.5 )');
          grad.addColorStop(1,'rgba( 255, 255, 0, 0.5 )');
          c.fillStyle = grad;
          c.fillRect(x, 0, rw, h);
                  
          // Glass Highlight
          c.fillStyle = 'rgba(255,255,255,.25)';
          c.fillRect(x, 0, rw, h/2);
        
          // Thumb Style Left      
          c.fillStyle = 'rgba(255,255,255,.5)';
          c.fillRect(x, 0, 11, h);
          c.lineWidth = .5;
          c.fillStyle = 'rgba(50,50,0,.5)';
          c.fillRect(x+4, 15, 1, 20);
          c.fillRect(x+6, 15, 1, 20);
          c.fillStyle='rgba(255,255,255,1)';
          c.fillRect(x, 0, 1, h);
          c.fillStyle='rgba(255,255,255,0.5)';
          c.fillRect(x+10, 0, 1, h);

          // Thumb Style Right
          c.fillStyle = 'rgba(255,255,255,.5)';
          c.fillRect(x+rw-11, 0, 11, h);
          c.fillStyle = 'rgba(50,50,0,.7)';
          c.fillRect(rw+x-5, 15, 1, 20);
          c.fillRect(rw+x-7, 15, 1, 20);
          c.fillStyle='rgba(255,255,255,0.5)';
          c.fillRect(rw+x-11, 0, 1, h);
          c.fillStyle='rgba(255,255,255,1)';
          c.fillRect(rw+x-1, 0, 1, h);
        
        }else{
          document.body.style.cursor='auto';
          //document.body.style.cursor='e-resize';

          // BackGround
          var grad = c.createLinearGradient(0,0,0,h);
          grad.addColorStop(0,'rgba( 255, 255, 0, 0.3 )');
          grad.addColorStop(1,'rgba( 255, 255, 0, 0.3 )');
          c.fillStyle = grad;
          c.fillRect(x, 0, rw, h);
                  
          // Glass Highlight
          c.fillStyle = 'rgba(255,255,255,.15)';
          c.fillRect(x, 0, rw, h/2);
        
          // Thumb Style Left      
          c.fillStyle = 'rgba(255,255,255,.25)';
          c.fillRect(x, 0, 11, h);
          c.lineWidth = .5;     
          c.fillStyle = 'rgba(50,50,0,.35)';
          c.fillRect(x+4, 15, 1, 20);
          c.fillRect(x+6, 15, 1, 20);
          c.fillStyle='rgba(255,255,255,0.5)';
          c.fillRect(x, 0, 1, h);
          c.fillStyle='rgba(255,255,255,0.25)';
          c.fillRect(x+10, 0, 1, h);

          // Thumb Style Right
          c.fillStyle = 'rgba(255,255,255,.25)';
          c.fillRect(x+rw-11, 0, 11, h);
          c.fillStyle = 'rgba(50,50,0,.35)';
          c.fillRect(rw+x-5, 15, 1, 20);
          c.fillRect(rw+x-7, 15, 1, 20);
          c.fillStyle='rgba(255,255,255,0.25)';
          c.fillRect(rw+x-11, 0, 1, h);
          c.fillStyle='rgba(255,255,255,.5)';
          c.fillRect(rw+x-1, 0, 1, h);
        
        }
                
        // Border Style
        /*
        var bw = 1;
        c.fillStyle = "rgba(0,0,0,1)";
        c.fillRect(x, h-bw, rw, bw);
        c.fillRect(x+rw-bw, 0, bw, h);
        c.fillStyle = "rgba(255,255,255,1)";
        c.fillRect(x, 0, rw, bw);
        c.fillRect(x, 0, bw, h);
        */
        };
        
      // console.log( this );
  
      this.parent._inView[ 0 ] = this;
  
      return this;
    },

    addRange: function( props ){
      return new this._Range( props, this );
    },

   
    _draw: function(){
      var c = this.context,
          e = c.canvas,
          w = e.width,
          h = e.height;
      
      //c.mozImageSmoothingEnabled = false;
      //c.clearRect(0, 0, w, h);
      var grad = c.createLinearGradient(0,0,0,h);
      grad.addColorStop(0,'#666');
      grad.addColorStop(0.5,'#000');
      grad.addColorStop(1,'#666');
      c.fillStyle = grad;
      c.fillRect(0,0,w,h);
    },

    _mousemove: function(e){
      this.mouse.x = e.offsetX;
      this.mouse.y = e.offsetY;

      this._draw.call(this);

      for(var i=0, l=this._inView.length; i< l; i++){
        var iv = this._inView[i];
        if( iv.xl < this.mouse.x && iv.xr > this.mouse.x ){
          iv.hovered = false;
        }else{
          iv.hovered = true;
        }
        iv.draw();
      }
      
    },

    _mouseupdown: function(e){
      if(e.type==='mousedown'){
        this.mouse.down = true;
      }else if(e.type==='mouseup'){
        this.mouse.down = false;
      }
    },

    _hover: function( e ){
      if(e.type==='mouseenter'){
        this.element.css({ color: this.options.color });
      }else if(e.type==='mouseleave'){
        this.element.css({ color: 'black' });  
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

})(jQuery);
