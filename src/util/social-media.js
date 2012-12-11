/* This Source Code Form is subject to the terms of the MIT license.
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

/*
 * Thanks to Atul and Pomax for this! https://github.com/toolness/friendlycode/blob/gh-pages/js/fc/ui/social-media.js
 */
"use strict";

/**
 * A tiny library for load-loading social media share buttons.
 * If we don't do this, social media will track users even before
 * they click the like button and we don't like that kind of
 * monitoring behaviour.
 */
define(function() {
  return function SocialMedia() {
    var urlPlaceHolder = "__URL__PLACE__HOLDER__";

    /**
     * The various social media all have the same API.
     */
    var self = {
      facebook: {
        id: "facebook-jssdk",
        src: "//connect.facebook.net/en_US/all.js#xfbml=1",
        html: "<div class='fb-like' data-href='"+urlPlaceHolder+"' data-send='false' data-action='recommend' data-layout='button_count' data-show-faces='false' data-font='tahoma'></div>",
        afterHotLoad: function() {
          // Facebook needs additional help, because it needs
          // to be told that it has to refresh its button, rather
          // than simply reloading.
          if (typeof(window.FB) === "object" && window.FB.XFBML && window.FB.XFBML.parse) {
            window.FB.XFBML.parse();
          }
        }
      },



      google: {
        id: "google-plus",
        src: "//apis.google.com/js/plusone.js",
        html: "<g:plusone annotation='none' href='"+urlPlaceHolder+"'></g:plusone>"
      },

      twitter: {
        id: "twitter-wjs",
        src: "//platform.twitter.com/widgets.js",
        html: "<a href='https://twitter.com/share'class='twitter-share-button' data-text='Check out the #PopcornMaker page I just made: ' data-url='"+urlPlaceHolder+"' data-via='popcornjs' data-count='none'>Tweet</a>"
      },

      /**
       * Hot-load a social medium's button by first
       * injecting the necessary HTML for the medium
       * to perform its own iframe replacements, and
       * then late-loading the script required for
       * the medium to load up its functionality.
       */
      hotLoad:  function(element, socialMedium, url) {
        var oldScript = document.getElementById(socialMedium.id);
        if (oldScript) {
          oldScript.parentNode.removeChild(oldScript);
        }
        // TODO: Should we escape url? It's likely
        // to not contain any characters that need escaping, and its value
        // is trusted, but we may still want to do it.
        var html = socialMedium.html.replace(urlPlaceHolder, url);
        element.innerHTML = html;
        (function(document, id, src) {
          var script = document.createElement("script");
          script.type = "text/javascript";
          script.id = id;
          script.src = src;
          document.head.appendChild(script);
        }(document, socialMedium.id, socialMedium.src));
        if (socialMedium.afterHotLoad) {
          socialMedium.afterHotLoad();
        }
      }
    };

    return self;
  };
});
