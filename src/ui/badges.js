
define([ "util/lang", "util/xhr", "text!layouts/badges.html" ],
  function( Lang, XHR, BADGES_LAYOUT ) {
    var _badgeLayout = Lang.domFragment( BADGES_LAYOUT, ".butter-badge" ),
        _badgeLink = Lang.domFragment( BADGES_LAYOUT, ".butter-badge-backpack-link" ),
        _backpack = Lang.domFragment( BADGES_LAYOUT, ".butter-badge-backpack"),
        _this;

    _this = {
      check: function( callback ) {
        var url = "/api/badges";
        XHR.get( url, function( resp ) {
          var badges,
              newBadge;
          if ( resp.target.readyState === 4 && callback ) {
            badges = JSON.parse( resp.target.responseText ).badges;
            callback( badges );
            if ( !document.querySelector( ".butter-badge-backpack" ) ) {
              document.body.appendChild( _backpack );
            }
            newBadge = _this.makeBadge( badges[ 0] );
            _backpack.querySelector( ".butter-badge-container" ).appendChild( newBadge );
          }
        });
      },
      makeBadge: function( data, classes ) {
        var newBadge = _badgeLayout.cloneNode( true );
        if ( classes ) {
          classes = classes.split( "," );
          classes.forEach( function( item ) {
            newBadge.classList.add( item.replace( / /g, "" ) );
          });
        }
        newBadge.querySelector( ".butter-badge-title").innerHTML = data.name;
        newBadge.querySelector( ".butter-badge-image").style[ "background-image" ] = data.image_url;
        newBadge.querySelector( ".butter-badge-desc").innerHTML = data.description;
        return newBadge;
      },
      badgeLink: function() {
        return _badgeLink.cloneNode( true );
      }
    };

    return _this;
    
});
