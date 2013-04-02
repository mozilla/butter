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
        root = Lang.domFragment( BASE_LAYOUT ),
        feedbackBtn = root.querySelector( ".webmaker-feedback-btn" ),
        personaBtnGroup = root.querySelector( ".login-join" ),
        loginBtn = root.querySelector( ".login" ),
        logoutBtn = root.querySelector( ".logout-btn" ),
        userMenu = root.querySelector( ".tooltip-user" ),
        username = root.querySelector( ".user-name" ),
        usernameInner = root.querySelector( ".user-name-container" ),
        usernameContainer= root.querySelector( ".user" ),
        primary = root.querySelector( ".primary" ),
        tabContainer = root.querySelector( ".webmaker-tabs" ),
        feedbackCallback,
        onLogin,
        onLogout,
        webmakerTabSetup,
        userMenuSetup;

    this.views = {
      login: function( usernameContainerText ) {
        personaBtnGroup.style.display = "none";
        usernameContainer.style.display = "";
        usernameInner.innerHTML = usernameContainerText;
      },
      logout: function() {
        personaBtnGroup.style.display = "";
        usernameContainer.style.display = "none";
      }
    };

    feedbackCallback = options.feedbackCallback;
    onLogin = options.onLogin || NULL_FUNCTION;
    onLogout = options.onLogout || NULL_FUNCTION;

    webmakerTabSetup = function( e ) {
      var currentActiveBtn = primary.querySelector( "." + BTN_ACTIVE_CLASS ),
          currentActiveTab = tabContainer.querySelector( "." + TAB_ACTIVE_CLASS ),
          el = e.target,
          tabName,
          tab;

      tabName = el.getAttribute( "data-tab" );
      tab = tabContainer.querySelector( "." + TAB_PREFIX + tabName );

      if ( !tab ) {
        return;
      }
      if ( currentActiveBtn ) {
        currentActiveBtn.classList.remove( BTN_ACTIVE_CLASS );
      }
      if ( currentActiveTab === tab ) {
        currentActiveTab.classList.remove( TAB_ACTIVE_CLASS );
        document.body.classList.remove( EXPANDED_CLASS );
        return;
      }
      else if ( currentActiveTab ) {
        currentActiveTab.classList.remove( TAB_ACTIVE_CLASS );
      }

      document.body.classList.add( EXPANDED_CLASS );
      tab.classList.add( TAB_ACTIVE_CLASS );
      el.classList.add( BTN_ACTIVE_CLASS );
    };

    userMenuSetup = function() {
      userMenu.addEventListener( "click", function( e ) {
        e.stopPropagation();
      }, false );

      username.addEventListener( "mouseout", function() {
        userMenu.classList.remove( USER_MENU_TRANSITION );
        username.classList.remove( BTN_ACTIVE_CLASS );
      }, false );

      username.addEventListener( "mouseover", function() {
        userMenu.classList.add( USER_MENU_TRANSITION );
        username.classList.add( BTN_ACTIVE_CLASS );
      }, false );
    };

    container.appendChild( root );
    userMenuSetup();

    feedbackBtn.addEventListener( "click", feedbackCallback, false );
    loginBtn.addEventListener( "click", onLogin, false );
    logoutBtn.addEventListener( "click", onLogout, false );
    primary.addEventListener( "click", webmakerTabSetup, false );

    // Default view
    this.views.logout();

    if ( options.hideLogin ) {
      personaBtnGroup.parentNode.removeChild( personaBtnGroup );
    }

    if ( options.hideFeedback ) {
      feedbackBtn.parentNode.removeChild( feedbackBtn );
    }

  };
});

