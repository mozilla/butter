/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */
define( [ "util/lang", "text!./webmakernav.html" ],
  function( Lang,  BASE_LAYOUT ) {

  var NULL_FUNCTION = function() {};

      // Added to tab when it's open
  var TAB_ACTIVE_CLASS = "webmaker-tab-active",
      // Added to elements in primary nav when they are active
      BTN_ACTIVE_CLASS = "webmaker-btn-active",
      // Added to body when secondary nav is expanded
      EXPANDED_CLASS = "webmaker-expanded",
       // The class prefix for each individual tab
      TAB_PREFIX = "tab-",
      // Transition used for the user menu dropdown
      USER_MENU_TRANSITION = "tooltip-no-transition-on";

  return function( options ) {
    options = options || {};

    var container = options.container,
        root = Lang.domFragment( BASE_LAYOUT );
    container.appendChild( root );
  };
});

