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
          optional: true
        },
        transition: {
          elem: "select",
          options: [ "None", "Pop", "Fly Up", "Fly Down", "Sparkles" ],
          values: [ "none", "pop", "flyUp", "flyDown", "sparkles" ],
          label: "Transition",
          "default": "pop"
        },
        layout: {
          elem: "select",
          options: [ "Ticker", "Feed" ],
          values: [ "ticker", "feed" ],
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
        zindex: {
          hidden: true
        }
      }
    },
    _setup: function( options ) {
      var target = Popcorn.dom.find( options.target ),
          requestString = "http://api.twitter.com/1/statuses/user_timeline.json?screen_name=",
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
          numberOfTweets = options.numberOfTweets;

      if ( !target ) {
        target = this.media.parentNode;
      }

      options._target = target;

      if ( !numberOfTweets ) {
        numberOfTweets = options._natives.manifest.options.numberOfTweets[ "default" ];
      } else if ( numberOfTweets === 0 ) {
        numberOfTweets = 1;
      } else if ( options.username && numberOfTweets > 20 ) {
        // Requests for a specific user will only return a max of 20
        numberOfTweets = 20;
      }

      // safeguard against no search/username being provided
      if ( !options.search && !options.username ) {
        options.search = options._natives.manifest.options.search[ "default" ];
      }

      options._container = document.createElement( "div" );
      options._container.classList.add( "popcorn-twitter" );
      options._container.id = Popcorn.guid( "twitter" );
      options._container.style.top = options.top + "%";
      options._container.style.left = options.left + "%";
      options._container.style.display = "none";
      options._container.style.zIndex = +options.zindex;
      titleText.classList.add( "popcorn-twitter-title" );
      titleText.appendChild( document.createTextNode( options.search || options.username || "Twitter" ) );
      options._container.appendChild( titleText );

      function twitterCallback( e ) {
        var results = e.results || e,
            currTweet,
            twitterHandle,
            twitterName,
            imageLinkSource,
            i,
            k,
            rLen;

        function buildTheTweets() {

          rLen = allTweets.length;

          for ( i = 0; i < rLen; i++ ) {
            currTweet = allTweets[ i ];
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
                                  twitterName + "</a>&nbsp;@" + twitterHandle;
            tweetTextCont.appendChild( tweetUser );
            tweetTextCont.appendChild( tweetText );
            tweetContainer.appendChild( tweetTextCont );
            tweetsContainer.appendChild( tweetContainer );
          }

          // Set layout class for container
          if ( options.layout ) {
            options._container.classList.add( options.layout );
          }

          if ( options.transition ) {
            options._container.classList.add( options.transition );
          }

          outerTweetsContainer.classList.add( "popcorn-twitter-tweets" );
          outerTweetsContainer.appendChild( tweetsContainer );
          options._container.appendChild( outerTweetsContainer );
        }

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
          buildTheTweets();
        }
        
      }

      target.appendChild( options._container );

      // Append various query options here
      requestString += options.username +
                       "&count=" + options.numberOfTweets + "&include_rts=true";

      if ( options.search ) {
        requestString = "http://search.twitter.com/search.json?q=";

        requestString += options.search +
                       "&result_type=" + options.searchType;
      }

      Popcorn.xhr( { url: requestString, dataType: "jsonp", success: twitterCallback } );

      options.toString = function() {
        return options.username || options.search || options._natives.manifest.options.search[ "default" ];
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
