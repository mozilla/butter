define( [ "util/lang", "text!./webmakernav.html", "text!./webmakernav.css" ],
  function( Lang,  BASE_LAYOUT, BASE_CSS ) {

      // Added to tab when it's open
  var TAB_ACTIVE_CLASS = "webmaker-tab-active",
      // Added to elements in primary nav when they are active
      BTN_ACTIVE_CLASS = "webmaker-btn-active",
      // Added to body when secondary nav is expanded
      EXPANDED_CLASS = "webmaker-expanded",
       // The class prefix for each individual tab
      TAB_PREFIX = "tab-";

  return function( butter, options ) {
    var _this = this,
        container = options.container,
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
        appendStyles,
        webmakerTabSetup,
        userMenuSetup;

    this.views = {
      login: function() {
        personaBtnGroup.style.display = "none";
        usernameContainer.style.display = "";
        usernameInner.innerHTML = butter.cornfield.username();
      },
      logout: function() {
        personaBtnGroup.style.display = "";
        usernameContainer.style.display = "none";
        userMenu.classList.remove( "tooltip-no-transition-on" );
        username.classList.remove( BTN_ACTIVE_CLASS );
      }
    };

    feedbackCallback = options.feedbackCallback;
    onLogin = options.onLogin;
    onLogout = options.onLogout;

    appendStyles = function() {
      var styleTag = document.createElement( "style" ),
          styles = document.createTextNode( BASE_CSS );
      styleTag.appendChild( styles );
      document.head.appendChild( styleTag );
    };

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
      
      username.addEventListener( "click", function() {
        userMenu.classList.toggle( "tooltip-no-transition-on" );
        username.classList.toggle( BTN_ACTIVE_CLASS );
      }, false );
    };

    appendStyles();
    container.appendChild( root );
    userMenuSetup();

    feedbackBtn.addEventListener( "click", feedbackCallback, false );
    loginBtn.addEventListener( "click", onLogin, false );
    logoutBtn.addEventListener( "click", onLogout, false );
    primary.addEventListener( "click", webmakerTabSetup, false );

    butter.listen( "autologinsucceeded", _this.views.login, false );
    butter.listen( "authenticated", _this.views.login, false );
    butter.listen( "logout", _this.views.logout, false );

    // Default view
    this.views.logout();

  };
});

