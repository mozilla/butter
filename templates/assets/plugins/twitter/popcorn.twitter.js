// PLUGIN: Twitter

(function ( Popcorn, global ) {

  Popcorn.plugin( "twitter", {
    manifest: {
      about: {
        name: "Popcorn Maker Twitter Plugin",
        version: "0.1",
        author: "Matthew Schranz, @mjschranz",
        website: "mschranz.wordpress.com, http://github.com/mjschranz"
      },
      options: {
        widgetTitle: {
          elem: "input",
          type: "text",
          label: "Widget Title",
          "default": "Popcorn.js"
        },
        search: {
          elem: "input",
          type: "text",
          label: "Search",
          "default": "Kittens",
          optional: true
        },
        username: {
          elem: "input",
          type: "text",
          label: "Tweets from User",
          "default": "@popcornjs",
          optional: true
        },
        searchType: {
          elem: "select",
          options: [ "Mixed", "Recent", "Popular" ],
          values: [ "mixed", "recent", "popular" ],
          label: "Search Results",
          "default": "mixed"
        },
        numberOfTweets: {
          elem: "input",
          type: "number",
          label: "Number of Tweets",
          "default": 10,
          optional: true
        },
        start: {
          elem: "input",
          type: "number",
          label: "Start"
        },
        end: {
          elem: "input",
          type: "number",
          label: "End"
        },
        transitions: {
          transitionIn: "pop",
          transitionOut: "fly"
          /*
           * TODO when we sort out editor stuff
           * Idea is the editors pass in a transitions object that tells us what transitions we want
           * to apply.
           */
        },
        layout: {
          elem: "select",
          options: [ "Ticker", "Sidebar", "Feed" ],
          values: [ "ticker", "sidebar", "feed" ],
          label: "Tweet Layout",
          "default": "feed",
          optional: true
        },
        top: {
          hidden: true,
          elem: "input",
          type: "number",
          units: "%",
          "default": 10
        },
        left: {
          hidden: true,
          elem: "input",
          type: "number",
          units: "%",
          "default": 10
        },
        style: {
          "font-family": "stuff",
          "font-size": "stuff",
          "color": "blue",
          "text-decoration": "underline"
          /* TODO when we sort out editor stuff
           * Idea is the editors pass in a style object of sorts and it then applies those styles.
           */
        }
      }
    },
    _setup: function( options ) {
      var target = Popcorn.dom.find( options.target ),
          requestString = "http://api.twitter.com/1/statuses/user_timeline.json?screen_name=",
          titleText = document.createElement( "span" ),
          tweetsContainer = document.createElement( "ul" ),
          img,
          tweetContainer,
          imgLink,
          tweetTextCont,
          tweetUser,
          tweetText;

      if ( !target ) {
        target = this.media.parentNode;
      }

      options._target = target;

      // safeguard against no search/username being provided
      if ( !options.search && !options.username ) {
        options.search = options._natives.manifest.options.search[ "default" ];
      }

      options._container = document.createElement( "div" );
      options._container.classList.add( "popcorn-twitter" );
      options._container.id = "twitter-" + Popcorn.guid();
      options._container.style.top = options.top + "%";
      options._container.style.left = options.left + "%";
      options._container.style.display = "none";
      titleText.classList.add( "popcorn-twitter-title" );
      titleText.appendChild( document.createTextNode( options.widgetTitle ) );
      options._container.appendChild( titleText );

      function twitterCallback( e ) {
        var results = e.results || e,
            currTweet,
            twitterHandle,
            twitterName,
            imageLinkSource,
            i,
            rLen;

        if ( results.length <= 0 ) {
          return;
        }

        for ( i = 0, rLen = results.length; i < rLen; i++ ) {
          currTweet = results[ i ];
          tweetContainer = document.createElement( "li" );
          img = document.createElement( "img" );
          imgLink = document.createElement( "a" );
          tweetTextCont = document.createElement( "div" );
          tweetUser = document.createElement( "div" );
          tweetUser.classList.add( "popcorn-twitter-tweet-user" );
          tweetText = document.createElement( "div" );
          tweetText.classList.add( "popcorn-twitter-tweet-text" );
          imageLinkSource = currTweet.profile_image_url || currTweet.user.profile_image_url;
          twitterHandle = currTweet.from_user || currTweet.user.screen_name,
          twitterName = currTweet.from_user_name || currTweet.user.name;

          imgLink.classList.add( "popcorn-twitter-tweet-image" );
          imgLink.href = img.src = imageLinkSource;
          imgLink.target = "_blank"; // Ensure it opens in new tab/window
          imgLink.appendChild( img );
          tweetContainer.appendChild( imgLink );

          // Text Setup
          tweetText.innerHTML = currTweet.text;
          tweetUser.innerHTML = "<a href=\"http://www.twitter.com/" + twitterHandle + "\" target=_blank>" +
                                twitterName + "</a>&nbsp;" + twitterHandle;
          tweetTextCont.appendChild( tweetUser );
          tweetTextCont.appendChild( tweetText );
          tweetContainer.appendChild( tweetTextCont );
          tweetsContainer.appendChild( tweetContainer );
        }

        // TODO: Handle Transitions stuff here later
        if ( options.transitions.transitionEnd ) {
          options._container.classList.add( options.transitions.transitionEnd );
        }

        if ( options.transitions.transitionIn ) {
          options._container.classList.add( options.transitions.transitionIn );
        }

        options._container.appendChild( tweetsContainer );
      }

      // Set layout class for container
      if ( options.layout ) {
        options._container.classList.add( options.layout );
      }

      target.appendChild( options._container );

      // Append various query options here
      requestString += options.username +
                       "&count=" + options.numberOfTweets || 10;

      if ( options.search ) {
        requestString = "http://search.twitter.com/search.json?q=";

        requestString += options.search +
                       "&result_type=" + options.searchType +
                       "&rpp=" + options.numberOfTweets || 10;
      }

      Popcorn.xhr( { url: requestString, dataType: "jsonp", success: twitterCallback } );

        options.toString = function() {
          return options.username || options._natives.manifest.options.username[ "default" ];
        };
    },
    start: function( event, options ) {
      if ( options._container ) {
        options._container.style.display = "block";
        options._container.classList.add( "on" );
      }
    },
    end: function( event, options ) {
      if ( options._container ) {
        options._container.style.display = "none";
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
