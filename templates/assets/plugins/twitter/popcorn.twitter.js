// PLUGIN: Twitter

(function ( Popcorn ) {

  var CACHED_RESULTS = {},
      MAX_TWEETS = 150,
      TWEETS_TIMER = 4000,
      TRANSITION_MARGIN_TOP = "-4.8em",
      TRANSITION_TIMEOUT = 700;

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
          optional: true
        },
        searchType: {
          elem: "select",
          options: [ "Mixed", "Recent", "Popular" ],
          values: [ "mixed", "recent", "popular" ],
          label: "Search Results",
          "default": "mixed",
          "hidden": true
        },
        numberOfTweets: {
          elem: "input",
          type: "number",
          label: "Number of Tweets",
          "default": 10,
          optional: true,
          maxTweets: MAX_TWEETS
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
        zindex: {
          hidden: true
        }
      }
    },
    _setup: function( options ) {
      var target = Popcorn.dom.find( options.target ),
          requestString = "//api.twitter.com/1/statuses/user_timeline.json?screen_name=",
          titleText = document.createElement( "span" ),
          outerTweetsContainer = document.createElement( "div" ),
          tweetsContainer = document.createElement( "ul" ),
          img,
          tweetContainer,
          imgLink,
          tweetTextCont,
          tweetUser,
          tweetText,
          allTweets = [],
          query,
          numberOfTweets = options.numberOfTweets;

      if ( !target ) {
        target = this.media.parentNode;
      }

      options._target = target;

      if ( !numberOfTweets ) {
        numberOfTweets = options._natives.manifest.options.numberOfTweets[ "default" ];
      } else if ( numberOfTweets > MAX_TWEETS ) {
        numberOfTweets = MAX_TWEETS;
      }

      // safeguard against no search/username being provided
      if ( !options.search && !options.username ) {
        options.search = options._natives.manifest.options.search[ "default" ];
      }

      options._container = document.createElement( "div" );
      options._container.classList.add( "popcorn-twitter" );
      options._container.id = Popcorn.guid( "twitter" );
      options._container.style.left = options.left + "%";
      options._container.style.zIndex = +options.zindex;
      titleText.classList.add( "popcorn-twitter-title" );
      titleText.appendChild( document.createTextNode( options.search || options.username || "Twitter" ) );

      // Set layout class for container
      if ( options.layout ) {
        options._container.classList.add( options.layout );
      }

      // Set transitions for container
      if ( options.transition ) {
        options._container.classList.add( options.transition );
        options._container.classList.add( "off" );
      }
      options._container.appendChild( titleText );

      query = ( options.search || options.username ) + numberOfTweets;

      function buildTheTweets( tweets ) {
        var currTweet,
            twitterHandle,
            twitterName,
            imageLinkSource,
            i,
            len;

        // If we made it here, the query was a new one so store it in our cache
        CACHED_RESULTS[ query ] = tweets;

        len = tweets.length;

        for ( i = 0; i < len; i++ ) {
          currTweet = tweets[ i ];
          tweetContainer = document.createElement( "li" );
          img = document.createElement( "img" );
          imgLink = document.createElement( "a" );
          tweetTextCont = document.createElement( "div" );
          tweetUser = document.createElement( "div" );
          tweetUser.classList.add( "popcorn-twitter-tweet-user" );
          tweetText = document.createElement( "div" );
          tweetText.classList.add( "popcorn-twitter-tweet-text" );
          imageLinkSource = currTweet.profile_image_url || currTweet.user.profile_image_url;
          twitterHandle = currTweet.from_user || currTweet.user.screen_name;
          twitterName = currTweet.from_user_name || currTweet.user.name;

          imgLink.classList.add( "popcorn-twitter-tweet-image" );
          imgLink.href = img.src = imageLinkSource;
          imgLink.target = "_blank"; // Ensure it opens in new tab/window
          imgLink.appendChild( img );
          tweetContainer.appendChild( imgLink );

          // Text Setup
          tweetText.innerHTML = currTweet.text;
          tweetUser.innerHTML = "<a href=\"http://www.twitter.com/" + twitterHandle + "\" target=_blank>" +
                                twitterName + "</a>&nbsp;@" + twitterHandle;
          tweetTextCont.appendChild( tweetUser );
          tweetTextCont.appendChild( tweetText );
          tweetContainer.appendChild( tweetTextCont );
          tweetsContainer.appendChild( tweetContainer );
        }

        // Set layout class for container
        if ( options.layout ) {
          options._container.classList.add( options.layout );
          if ( options.layout === "ticker" && tweetsContainer.childNodes.length ) {
            var elem;

            options._tickerInterval = setInterval(function() {
              elem = tweetsContainer.firstChild;
              if ( !elem ) {
                return;
              }

              elem.style.marginTop = TRANSITION_MARGIN_TOP;
              setTimeout(function() {
                tweetsContainer.removeChild( elem );
                tweetsContainer.appendChild( elem );
                elem.style.marginTop = "";
              }, TRANSITION_TIMEOUT );
            }, TWEETS_TIMER );
          }
        }

        outerTweetsContainer.classList.add( "popcorn-twitter-tweets" );
        outerTweetsContainer.appendChild( tweetsContainer );
        options._container.appendChild( outerTweetsContainer );
      }

      function twitterCallback( e ) {
        var results = e.results || e,
            k,
            rLen;

        for ( k = 0, rLen = results.length; k < rLen && allTweets.length < options.numberOfTweets; k++ ) {
          allTweets.push( results[ k ] );
        }

        // Search API doesn't simply return count of tweets. It returns up to 100
        // and then provides a link to query the next "Page" of the same results
        if ( allTweets.length < options.numberOfTweets && options.search ) {
          Popcorn.xhr({
            url: requestString.substring( 0, requestString.indexOf( "?" ) ) + e.next_page,
            dataType: "jsonp",
            success: twitterCallback
          });
        } else {
          buildTheTweets( allTweets );
        }
      }

      target.appendChild( options._container );

      // We stored the results objects we get to save API calls being made
      if ( !CACHED_RESULTS[ query ] ) {
        if ( options.username ) {
          Popcorn.xhr({
            url: "//api.twitter.com/1/account/rate_limit_status.json",
            dataType: "jsonp",
            success: function( e ) {
              if ( e.remaining_hits === 0 ) {
                var warningText = document.createElement( "div" );

                warningText.innerHTML = "You have hit the request limit for the hour. This will reset at " +
                  e.reset_time.substring( 0, e.reset_time.indexOf( "+" ) ) + " GMT.";

                options._container.appendChild( warningText );
              } else {
                // Append various query options here
                requestString += options.username +
                               "&count=" + options.numberOfTweets + "&include_rts=true";

                Popcorn.xhr( { url: requestString, dataType: "jsonp", success: twitterCallback } );
              }
          }});
        } else if ( options.search ) {
          requestString = "//search.twitter.com/search.json?q=";

          requestString += escape( options.search ) +
                         "&result_type=" + options.searchType;

          Popcorn.xhr( { url: requestString, dataType: "jsonp", success: twitterCallback } );

        }
      } else {
        buildTheTweets( CACHED_RESULTS[ query ] );
      }

      options.toString = function() {
        return options.username || options.search || options._natives.manifest.options.search[ "default" ];
      };
    },
    start: function( event, options ) {
      if ( options._container ) {
        options._container.classList.add( "on" );
        options._container.classList.remove( "off" );
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

      if ( options._tickerInterval ) {
        clearInterval( options._tickerInterval );
      }
    }
  });
}( Popcorn, this ));
