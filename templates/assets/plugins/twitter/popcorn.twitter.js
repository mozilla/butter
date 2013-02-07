// PLUGIN: Twitter

(function ( Popcorn ) {

  var CACHED_RESULTS = {},
      MAX_TWEETS = 150,
      TWEETS_TIMER = 4000,
      TRANSITION_MARGIN_TOP = "-4.8em",
      TRANSITION_TIMEOUT = 700,
      BASE_REQUEST = "//api.twitter.com/1/statuses/user_timeline.json?screen_name=";

  Popcorn.plugin( "twitter", function( options ) {
    var target,
        requestString,
        titleText,
        outerTweetsContainer,
        tweetsContainer,
        img,
        tweetContainer,
        container,
        imgLink,
        tweetTextCont,
        tweetUser,
        tweetText,
        tickerInterval,
        allTweets = [],
        tweetsAdded = false,
        query,
        numberOfTweets = options.numberOfTweets;

    function buildCacheQuery( options ) {
      query = ( options.search || options.username ) + numberOfTweets + options.searchType;
    }

    function setLayout( options ) {
      // Set layout class for container
      if ( options.layout ) {
        container.classList.add( options.layout );
        if ( options.layout === "ticker" && tweetsContainer.childNodes.length ) {
          var elem;

          tickerInterval = setInterval(function() {
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
    }

    function buildTheTweets( tweets, options ) {
      var currTweet,
          twitterHandle,
          twitterName,
          imageLinkSource,
          i,
          len;

      if ( tweetsContainer ) {
        outerTweetsContainer.removeChild( tweetsContainer );
      }

      tweetsContainer = document.createElement( "ul" );

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

      setLayout( options );
      tweetsAdded = true;
      outerTweetsContainer.classList.add( "popcorn-twitter-tweets" );
      outerTweetsContainer.appendChild( tweetsContainer );
      container.appendChild( outerTweetsContainer );
    }

    function twitterCallback( options, e ) {
      var results = e.results || e,
          k,
          rLen;

      if ( tweetsAdded ) {
        allTweets = [];
        tweetsAdded = false;
      }

      // We have data from twitter so assign it an appropriate title now.
      titleText.innerText = options.search || options.username;

      for ( k = 0, rLen = results.length; k < rLen && allTweets.length < options.numberOfTweets; k++ ) {
        allTweets.push( results[ k ] );
      }

      // Search API doesn't simply return count of tweets. It returns up to 100
      // and then provides a link to query the next "Page" of the same results
      if ( allTweets.length < options.numberOfTweets && options.search ) {
        Popcorn.xhr({
          url: requestString.substring( 0, requestString.indexOf( "?" ) ) + e.next_page,
          dataType: "jsonp",
          success: function( e ) {
            twitterCallback( options, e );
          }
        });
      } else {
        buildTheTweets( allTweets, options );
      }
    }

    function retrieveTweets( options ) {
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

                container.appendChild( warningText );
              } else {
                // Append various query options here
                requestString = BASE_REQUEST + options.username +
                               "&count=" + options.numberOfTweets + "&include_rts=true";

                Popcorn.xhr({ url: requestString, dataType: "jsonp",
                  success: function( e ) {
                    twitterCallback( options, e );
                  }
                });
              }
          }});
        } else if ( options.search ) {
          requestString = "//search.twitter.com/search.json?q=";

          requestString += escape( options.search ) +
                         "&result_type=" + options.searchType;

          Popcorn.xhr({ url: requestString, dataType: "jsonp",
            success: function( e ) {
              twitterCallback( options, e );
            }
          });

        }
      } else {
        buildTheTweets( CACHED_RESULTS[ query ], options );
      }
    }

    function validateNumTweets() {
      if ( !numberOfTweets ) {
        numberOfTweets = options._natives.manifest.options.numberOfTweets[ "default" ];
      } else if ( numberOfTweets > MAX_TWEETS ) {
        numberOfTweets = MAX_TWEETS;
      }
    }

    return {
      _setup: function( options ) {

        target = Popcorn.dom.find( options.target );
        titleText = document.createElement( "span" );
        outerTweetsContainer = document.createElement( "div" );

        if ( !target ) {
          target = this.media.parentNode;
        }

        options._target = target;

        validateNumTweets();

        // safeguard against no search/username being provided
        if ( !options.search && !options.username ) {
          options.search = options._natives.manifest.options.search[ "default" ];
        }

        options._container = container = document.createElement( "div" );
        container.classList.add( "popcorn-twitter" );
        container.id = Popcorn.guid( "twitter" );
        container.style.left = options.left + "%";
        container.style.zIndex = +options.zindex;
        titleText.classList.add( "popcorn-twitter-title" );
        titleText.innerText = "Twitter";

        // Set layout class for container
        if ( options.layout ) {
          container.classList.add( options.layout );
        }

        // Set transitions for container
        if ( options.transition ) {
          container.classList.add( options.transition );
          container.classList.add( "off" );
        }

        container.appendChild( titleText );
        buildCacheQuery( options );
        target.appendChild( container );
        retrieveTweets( options );

        options.toString = function() {
          return options.username || options.search || options._natives.manifest.options.search[ "default" ];
        };
      },
      start: function() {
        var redrawBug;

        if ( container ) {
          container.classList.add( "on" );
          container.classList.remove( "off" );

          // Safari Redraw hack - #3066
          container.style.display = "none";
          redrawBug = container.offsetHeight;
          container.style.display = "";
        }
      },
      end: function() {
        if ( container ) {
          container.classList.add( "off" );
          container.classList.remove( "on" );
        }
      },
      _teardown: function() {
        // Remove the plugins container when being destroyed
        if ( container && target ) {
          target.removeChild( container );
        }

        if ( tickerInterval ) {
          clearInterval( tickerInterval );
        }
      },
      _update: function( trackEvent, newOptions ) {
        var ignoreNumTweets = false;

        // Search Update
        if ( newOptions.hasOwnProperty( "search" ) ) {
          trackEvent.search = newOptions.search;

          if ( newOptions.hasOwnProperty( "numberOfTweets" ) ) {
            numberOfTweets = trackEvent.numberOfTweets = newOptions.numberOfTweets;
            validateNumTweets();
            ignoreNumTweets = true;
          }

          query = trackEvent.search + numberOfTweets;
          retrieveTweets( trackEvent );
        }

        // Username update
        if ( newOptions.hasOwnProperty( "username" ) ) {
          trackEvent.username = newOptions.username;

          if ( newOptions.hasOwnProperty( "numberOfTweets" ) ) {
            numberOfTweets = trackEvent.numberOfTweets = newOptions.numberOfTweets;
            validateNumTweets();
            ignoreNumTweets = true;
          }

          query = trackEvent.username + numberOfTweets;
          retrieveTweets( trackEvent );
        }

        // Number of tweets update
        if ( !ignoreNumTweets && newOptions.hasOwnProperty( "numberOfTweets" ) ) {
          numberOfTweets = trackEvent.numberOfTweets = newOptions.numberOfTweets;
          validateNumTweets();

          query = ( trackEvent.username || trackEvent.search ) + numberOfTweets;
          retrieveTweets( trackEvent );
        }

        // Z-Index update
        if ( newOptions.hasOwnProperty( "zindex" ) ) {
          trackEvent.zindex = newOptions.zindex;
          container.style.zIndex = +trackEvent.zindex;
        }

        // Layout update
        if ( newOptions.hasOwnProperty( "layout" ) ) {
          container.classList.remove( trackEvent.layout );
          if ( tickerInterval ) {
            clearInterval( tickerInterval );
          }

          trackEvent.layout = newOptions.layout;
          setLayout( trackEvent );
        }

        // Left update
        if ( newOptions.hasOwnProperty( "left" ) ) {
          trackEvent.left = newOptions.left;
          container.style.left = trackEvent.left + "%";
        }

        // Transitions update
        if ( newOptions.hasOwnProperty( "transition" ) ) {
          container.classList.remove( trackEvent.transition );
          trackEvent.transition = newOptions.transition;
          container.classList.add( trackEvent.transition );
        }

        // Search type update
        if ( newOptions.hasOwnProperty( "searchType" ) ) {
          trackEvent.searchType = newOptions.searchType;
          buildCacheQuery( trackEvent );
          retrieveTweets( trackEvent );
        }
      }
    };
  },{
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
      width: {
        hidden: true,
        "default": 35,
      },
      zindex: {
        hidden: true
      }
    }
  });
}( Popcorn, this ));
