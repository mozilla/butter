/* This Source Code Form is subject to the terms of the MIT license.
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

/**
 * Document: Page
 *
 * Exposes some page manipulation and information gathering functionality to Butter.
 *
 * @structure Module
 */
define( [ "core/logger", "core/eventmanager" ], function( Logger, EventManager ) {

  /**
   * Document: Page::Page
   *
   * Supplies some utility functions for scraping/preparing an HTML page to make Butter & Popcorn
   * operate smoothly.
   *
   * @param {Loader} loader Loader to use for retrieving assets for running Popcorn.
   * @structure Class
   * @api public
   */
  return function( loader ) {

    var PLAYER_TYPE_URL = "{popcorn-js}/players/{type}/popcorn.{type}.js";

    EventManager.extend( this );

    /**
     * Document: Page::Page::scrape
     *
     * Scrapes the page to look for elements marked as targets or medias.
     *
     * @structure Member Function
     * @api public
     * @return {Object} A collection of media and target elements.
     */
    this.scrape = function() {
      var rootNode = document.body,
          targets = rootNode.querySelectorAll("*[data-butter='target']"),
          medias = rootNode.querySelectorAll("*[data-butter='media']");

      return {
        media: medias,
        target: targets
      };
    }; // scrape

    /**
     * Document: Page::Page::prepare
     *
     * Loads the assets required to make Popcorn work as expected for Butter.
     *
     * @param {Function} readyCallback Callback to execute when loading has finished.
     * @structure Member Function
     * @api public
     */
    this.prepare = function( readyCallback ){
      loader.load([
        {
          type: "js",
          url: "{popcorn-js}/popcorn.js",
          check: function(){
            return !!window.Popcorn;
          }
        },
        {
          type: "js",
          url: "{popcorn-js}/modules/player/popcorn.player.js",
          check: function(){
            return !!window.Popcorn && !!window.Popcorn.player;
          }
        },

        // XXXhumph - We're converting players to use wrappers, so preload
        // the ones we need for those players to work.  See ticket #1994.
        {
          type: "js",
          url: "{popcorn-js}/wrappers/common/popcorn._MediaElementProto.js",
          check: function(){
            return !!window.Popcorn && !!window.Popcorn._MediaElementProto;
          }
        },

        {
          type: "js",
          url: "{popcorn-js}/wrappers/html5/popcorn.HTMLMediaElement.js",
          check: function(){
            return !!window.Popcorn &&
                   !!window.Popcorn.HTMLVideoElement &&
                   !!window.Popcorn.HTMLAudioElement;
          }
        },
        {
          type: "js",
          url: "{popcorn-js}/wrappers/vimeo/popcorn.HTMLVimeoVideoElement.js",
          check: function(){
            return !!window.Popcorn && !!window.Popcorn.HTMLVimeoVideoElement;
          }
        },
        {
          type: "js",
          url: "{popcorn-js}/wrappers/soundcloud/popcorn.HTMLSoundCloudAudioElement.js",
          check: function(){
            return !!window.Popcorn && !!window.Popcorn.HTMLSoundCloudAudioElement;
          }
        },
        {
          type: "js",
          url: "{popcorn-js}/wrappers/null/popcorn.HTMLNullVideoElement.js",
          check: function(){
            return !!window.Popcorn && !!window.Popcorn.HTMLNullVideoElement;
          }
        }

      ], readyCallback, null, true );
    };

    /**
     * Document: Page::Page::addPlayerType
     *
     * Loads a specific type of Popcorn player.
     *
     * @param {String} type Popcorn player type.
     * @param {Function} callback Callback to execute when loading has finished.
     * @structure Member Function
     * @api public
     */
    this.addPlayerType = function( type, callback ){
      loader.load({
        type: "js",
        url: PLAYER_TYPE_URL.replace( /\{type\}/g, type ),
        check: function(){
          return !!Popcorn[ type ];
        }
      }, callback );
    };

  };
});
