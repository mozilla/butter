Butter.Template = function() {
  var t = {};

  t.tests = function() {
    //Test get track events
    console.log( 
      t.getTrackEvents( 0 ),
      t.getTrackEvents( { type: "text" } ),
      t.getTrackEvents( { type: "foo" } ),
      t.getTrackEvents( { type:[ "text", "footnote" ] } ),
      t.getTrackEvents( { before: 1 } ),
      t.getTrackEvents( { after: 1 } )
    );
  }

  t.showTray = function( show ){
    t.debug && console.log ( "template.showTray", show );
    t.butter && show === true && ( t.butter.ui.visible = true );
    t.butter && show === false && ( t.butter.ui.visible = false );
  }

  t.getTrackEvents = function( query ) {
    var obj = {},
        i,
        allTracks,
        result;

    t.butter && ( allTracks = t.butter.orderedTrackEvents );

    //Parse the query....

    //getTrackEvent( 1 );
    if( typeof query === "number" ) {
      result = allTracks[ query ];
    }
     //getTrackEvent( "text" );
    else if( typeof query === "string" ) {
      result = allTracks.filter( function( el, index ) {
        return( el.type && el.type === query );
      });
    }
     //getTrackEvent( myEvent );
    else if ( typeof query === "object" && query.popcornOptions ) {
      result = query;
    }
    else if ( typeof query === "object" ) {
      result = allTracks.filter( function( el, index ) {

        // getTrackEvent({ before: ... });
        if( query.before && el.popcornOptions.start > query.before ) { return false; }

        // getTrackEvent({ after: ... });
        if( query.after && el.popcornOptions.start < query.after ) { return false; }

        // getTrackEvent({ type: "text" });
        if( query.type && typeof query.type === "string" ) {
          if( el.type !== query.type ) { return false; }
        //getTrackEvent({ type: ["text","footnote"] });
        } else if ( query.type && typeof query.type === "object") {
           if( query.type.indexOf( el.type ) < 0 ) { return false; }
        }

        //getTrackEvent({ index: 1 });
        if( query.index && typeof query.index === "number" ) {
          if( query.index !== index ) { return false; }
        //getTrackEvent({ index: [1, 2] });
        } else if ( query.index && typeof query.index === "object" ) {
          if( query.index.indexOf( index ) < 0 ) { return false; }
        }

        return true;

      });
    } //if

    //Return false if there were no results, return the track event if there was only one, and an array if more than one were found.
    if( !result || result.length === 0 ) { return false; }
    else if( result. length === 1 ) { obj.data = result[0] }
    else ( obj.data = result );

    obj.foo = function() {
      return "bar";
    }

    obj.update = function( data ) { 
      function _update( trackEvent ) {
        var oldOptions = trackEvent.popcornOptions, option;

        for (var option in oldOptions ) {
          data.option || ( data.option = oldOptions[ option ] );
        }

        trackEvent.update( data );
      }

      if( this.data instanceof Array ) { t.each( this.data, _update ); }
      else { _update( this.data ); }
    }

    obj.remove = function( data ) {
      function _remove( trackEvent ) {
        trackEvent.track.removeTrackEvent ( trackEvent );
      }
      if( this.data instanceof Array ) { t.each( this.data, _remove ); }
      else { _remove( this.data ); }
    }

    return obj;
  }



  t.each = function( array, func ) {
    var i;
    for ( i = 0; i<array.length; i++ ) {
      (function( item ) {
        func( item );
      }( array[i] ));    
    }
  }

  t.eventWrapper = function( media, event ) {
    //a work-around to wrap events in an event listener so they don't load before popcorn is ready.
    media.popcornScripts = {};
    media.popcornScripts.beforeEvents = 'popcorn.on( "' + event + '", popcornEvents );\nfunction popcornEvents() { ';
    media.popcornScripts.afterEvents = '\npopcorn.off( "' + event + '", popcornEvents );\n}'
  }

  return t;
}
