// PLUGIN: Twitter

(function ( Popcorn ) {

  Popcorn.plugin( "twitter", {
    manifest: {
      about: {
        name: "Popcorn Maker Twitter Plugin",
        version: "0.1",
        author: "Matthew Schranz, @mjschranz",
        website: "mschranz.wordpress.com, http://github.com/mjschranz"
      },
      options: {
        start: {
          elem: "input",
          type: "number",
          label: "Start",
          units: "seconds"
        },
        end: {
          elem: "input",
          type: "number",
          label: "End",
          units: "seconds"
        },
        transition: {
          elem: "select",
          options: [ "None", "Pop", "Fade", "Slide Up", "Slide Down" ],
          values: [ "popcorn-none", "popcorn-pop", "popcorn-fade", "popcorn-slide-up", "popcorn-slide-down" ],
          label: "Transition",
          "default": "popcorn-fade"
        },
        layout: {
          elem: "select",
          options: [ "Ticker", "Feed" ],
          values: [ "ticker", "feed" ],
          label: "Tweet Layout",
          "default": "feed",
          optional: true
        },
        left: {
          hidden: true,
          elem: "input",
          type: "number",
          units: "%",
          "default": 0
        },
        width: {
          hidden: true,
          "default": 35,
        },
        zindex: {
          hidden: true
        }
      }
    },
    _setup: function( options ) {
      var target = Popcorn.dom.find( options.target );

      if ( !target ) {
        target = this.media.parentNode;
      }

      options._target = target;
      options._container = document.createElement( "div" );
      options._container.classList.add( "popcorn-twitter" );
      options._container.id = Popcorn.guid( "twitter" );
      options._container.style.left = options.left + "%";
      options._container.style.zIndex = +options.zindex;
      options._container.innerHTML = '<span class="popcorn-twitter-title">Twitter</span><div class="popcorn-twitter-tweets"><ul><li><a href="https://si0.twimg.com/profile_images/1577180475/Screen_Shot_2011-10-07_at_11.52.39_AM_bigger.png" class="popcorn-twitter-tweet-image"><img src="https://si0.twimg.com/profile_images/1577180475/Screen_Shot_2011-10-07_at_11.52.39_AM_bigger.png"></a><div><div class="popcorn-twitter-tweet-user"><a href="http://www.twitter.com/webmaker" target="_blank">Mozilla Webmaker</a>&nbsp;@webmaker</div><div class="popcorn-twitter-tweet-text">Due to recent changes in the Twitter API, these tweets are no longer available.</div></div></li></ul></div>'

      // Set layout class for container
      if ( options.layout ) {
        options._container.classList.add( options.layout );
      }

      // Set transitions for container
      if ( options.transition ) {
        options._container.classList.add( options.transition );
        options._container.classList.add( "off" );
      }

      target.appendChild( options._container );

      options.toString = function() {
        return "Twitter is no longer available"
      };
    },
    start: function( event, options ) {
      var container = options._container,
          redrawBug;

      if ( container ) {
        container.classList.add( "on" );
        container.classList.remove( "off" );

        // Safari Redraw hack - #3066
        container.style.display = "none";
        redrawBug = container.offsetHeight;
        container.style.display = "";
      }
    },
    end: function( event, options ) {
      if ( options._container ) {
        options._container.classList.add( "off" );
        options._container.classList.remove( "on" );
      }
    },
    _teardown: function( options ) {
      // Remove the plugins container when being destroyed
      if ( options._container && options._target ) {
        options._target.removeChild( options._container );
      }
    }
  });
}( Popcorn, this ));
