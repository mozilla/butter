(function(window) {
  //<script src="http://code.jquery.com/jquery-1.5.js"></script>
  //<script src="http://ajax.googleapis.com/ajax/libs/jqueryui/1.7.2/jquery-ui.js"></script>

  var Logger = function( name ) {

    this.log = function( message ) {
      console.log( "[" + name + "] " + message );
    }; //log

    this.error = function( message ) {
      throw new Error( "[" + name + "]" + message ); 
    }; //error

  }; //Logger

  var EventManager = function( emOptions ) {

    var listeners = {},
        related = {},
        id = "EventManager" + EventManager.guid++,
        logger = emOptions.logger || new Logger( id ),
        targetName = id,
        that = this;
    
    this.listen = function( type, listener, relatedObject ) {
      if ( type && listener ) {
        if ( !listeners[ type ] ) {
          listeners[ type ] = [];
        } //if
        listeners[ type ].push( listener );
        if ( relatedObject ) {
          if ( !related[ relatedObject ] ) {
            related[ relatedObject ] = [];
          } //if
          related[ relatedObject ].push( listener );
        } //if
      }
      else {
        logger.error( "type and listener required to listen for event." );
      } //if
    }; //listen

    this.unlisten = function( type, listener ) {
      if ( type && listener ) {
        var theseListeners = listeners[ type ];
        if ( theseListeners ) {
          var idx = theseListeners.indexOf( listener );
          if ( idx > -1 ) {
            theseListeners.splice( idx, 1 );
          } //if
        } //if
      }
      else if ( type ) {
        if ( listeners[ type ] ) {
          listeners[ type ] = [];
        } //if
      }
      else {
        logger.error( "type and listener required to unlisten for event" );
      } //if
    }; //unlisten

    this.unlistenByType = function( type, relatedObject ) {
      var relatedListeners = related[ relatedObject ];
      for ( var i=0, l=relatedListeners; i<l; ++i ) {
        that.unlisten( type, relatedListeners[ i ] );
      } //for
      delete related[ relatedObject ];
    }; //unlistenByType

    this.dispatch = function( type, data, tempTarget ) {
      if ( type ) {
        var theseListeners = listeners[ type ];
        if ( theseListeners ) {
          var e = {
            target: tempTarget || targetName,
            type: type,
            data: data
          };
          for ( var i=0, l=theseListeners.length; i<l; ++i ) {
            theseListeners[ i ]( e );
          } //for
        } //if
      }
      else {
        logger.error( "type required to dispatch event" );
      } //if
    }; //dispatch

    this.apply = function( name, to ) {
      to.listen = that.listen;
      to.unlisten = that.unlisten;
      to.dispatch = that.dispatch;
      targetName = name;
    }; //apply

    this.repeat = function( e ) {
      that.dispatch( e.type, e.data, e.target );
    }; //repeat

  }; //EventManager
  EventManager.guid = 0;

  var TrackLiner = this.TrackLiner = function( options ) {

    if ( this !== window ) {

      options = options || {};

      var tracks = {},
          trackCount = 0,
          eventCount = 0,
          userElement,
          dynamicTrackCreation = options.dynamicTrackCreation,
          duration = options.duration || 1,
          scale = options.scale || 1,
          parent = document.createElement( "div" ),
          container = document.createElement( "div" ),
          self = this;

      var eventManager = new EventManager({});
      eventManager.apply( "trackLiner", this );

      if ( typeof( options ) === "string" ) {

        userElement = document.getElementById( options );
      }
      else {

        userElement = document.getElementById( options.element ) || options.element;
      } //if

      userElement.appendChild( parent );
      parent.style.height = "100%";
      parent.appendChild( container );

      $( container ).sortable({
        containment: "parent",
        tolerance: "pointer",
        update: function( event, ui ) {

          eventManager.dispatch( "trackupdated", {
            track: self.getTrack( ui.item[ 0 ].id ),
            index: ui.item.index()
          });
        }
      }).droppable({
        greedy: true
      });

      var trackEventDropped = function ( track, e, ui ) {

        var eventId = ui.draggable[ 0 ].id,
            trackId = track.id,
            parentId = ui.draggable[ 0 ].parentNode.id;

        if ( self.getTrack( parentId ) ) {

          track.addTrackEvent( self.getTrack( parentId ).removeTrackEvent( eventId ) );
        } else {

          var clientRects = parent.getClientRects();

          track.addTrackEvent( track.createTrackEvent({
              left: ( e.clientX - clientRects[ 0 ].left ) / scale,
              width: 50,
              innerHTML: ui.draggable[ 0 ].innerHTML
            }, true ));
        } //if
      };

      $( parent ).droppable({
        // this is dropping an event on empty space
        drop: function( event, ui ) {
  
          if ( dynamicTrackCreation && ui.draggable[ 0 ].className.indexOf( "ui-draggable" ) > -1 ) {

            var newTrack = self.createTrack();
            self.addTrack( newTrack );

            trackEventDropped( newTrack, event, ui );
          } //if
        }
      });

      this.clear = function () {

        while ( container.children.length ) {

          container.removeChild( container.children[ 0 ] );
        } //while

        tracks = [];
        trackCount = 0;
        eventCount = 0;
      };

      this.createTrack = function( name ) {

        var track = new Track(),
            element = track.getElement();

        if ( name ) {

          var titleElement = document.createElement( "span" );

          titleElement.style.postion = "absolute";
          titleElement.style.left = "5px";
          titleElement.style.top = "50%";
          titleElement.innerHTML = name;
          titleElement.className = "track-title";
          
          element.appendChild( titleElement );
        } //if

        return tracks[ track.getElement().id ] = track;
      };

      this.getTracks = function () {

        return tracks;
      };

      this.getTrack = function( id ) {

        return tracks[ id ];
      };

      this.addTrack = function( track ) {

        container.appendChild( track.getElement() );
        tracks[ track.getElement().id ] = track;
        eventManager.dispatch( "trackadded", {
          track: track
        });
      };

      this.removeTrack = function( track ) {

        container.removeChild( track.getElement() );
        delete tracks[ track.getElement().id ];
        eventManager.dispatch( "trackremoved", {
          track: track
        });
        return track;
      };

      this.deselectOthers = function() {

        for ( var j in tracks ) {

          var events = tracks[ j ].getTrackEvents();

          for ( var i in events ) {

            if ( events[ i ].selected ) {

              events[ i ].deselect();
            } //if
          } //for
        } //for

        return self;
      };

      this.setScale = function ( scale ) {

        userElement.style.width = userElement.style.width || duration * scale + "px";
        userElement.style.minWidth = duration * scale + "px";
      };

      this.setScale( scale );

      var Track = function( inc ) {

        var trackId = "trackLiner" + trackCount++,
            events = {},
            that = this,
            element = document.createElement( "div" );

        element.className = "trackliner-track";
        this.id = element.id = trackId;

        $( element ).droppable({ 
          greedy: true,
          // this is dropping an event on a track
          drop: function( event, ui ) {

            trackEventDropped( that, event, ui );
          }
        });

        this.getElement = function() {

          return element;
        };

        this.createEventElement = function ( options ) {

          var element = document.createElement( "div" );

          // set options if they exist
          options.cursor && (element.style.cursor = options.cursor);
          options.background && (element.style.background = options.background);
          options.opacity && (element.style.opacity = options.opacity);
          options.height && (element.style.height = options.height);
          options.width && (element.style.width = options.width*scale + "px");
          options.position && (element.style.position = options.position);
          options.top && (element.style.top = options.top);
          options.left && (element.style.left = options.left*scale + "px");
          options.innerHTML && (element.innerHTML = options.innerHTML);
          element.style.position = options.position ? options.position : "absolute";

          // add css options if they exist
          if ( options.css ) {

            $( element ).css( options.css );
          } //if

          element.className = "trackliner-event";

          if ( options.classes ) {

            for ( var i = 0; i < options.classes.length; ++i ) {

              $( element ).addClass( options.classes[ i ] );
            } //for
          } //if

          return element;
        } //createEventElement

        this.createTrackEvent = function( inputOptions, ui ) {

          var trackEvent = {},
              eventId = "trackEvent" + eventCount++;

          if ( inputOptions ) {

            var movedCallback = function( event, ui ) {

              var eventElement = trackEvent.element,
                  track = self.getTrack( this.parentNode.id );

              eventElement.style.top = "0px";

              trackEvent.options.left = eventElement.offsetLeft;
              trackEvent.options.width = eventElement.offsetWidth;

              eventManager.dispatch( "trackeventupdated", {
                track: track,
                trackEvent: trackEvent,
                ui: true
              });
            };

            trackEvent.options = inputOptions;

            trackEvent.element = inputOptions.element || this.createEventElement ( inputOptions );
            trackEvent.element.id = eventId;
            trackEvent.element.addEventListener( "click", function ( e ) {

              eventManager.dispatch( "trackeventclicked", {
                track: self.getTrack( this.parentNode.id ),
                trackEvent: trackEvent,
                event: e
              });
            }, false);

            trackEvent.element.addEventListener( "dblclick", function ( e ) {

              eventManager.dispatch( "trackeventdoubleclicked", {
                track: self.getTrack( this.parentNode.id ),
                trackEvent: trackEvent,
                event: e
              });
            }, false);

            trackEvent.selected = false;
            trackEvent.select = function ( e ) {

              self.deselectOthers();
              trackEvent.selected = true;
              eventManager.dispatch( "trackeventselecteded", {
                track: that,
                trackEvent: trackEvent
              });
            };

            trackEvent.deselect = function ( e ) {

              trackEvent.selected = false;
              eventManager.dispatch( "trackeventdeselecteded", {
                track: that,
                trackEvent: trackEvent
              });
            };

            $( trackEvent.element ).draggable({
              containment: parent,
              zIndex: 9001,
              scroll: true,
              // this is when an event stops being dragged
              start: function ( event, ui ) {},
              stop: movedCallback
            }).resizable({ 
              autoHide: true, 
              containment: "parent", 
              handles: "e, w", 
              scroll: false,
              stop: movedCallback
            });

            return this.addTrackEvent( trackEvent, ui );
          } //if
        };

        this.addTrackEvent = function( trackEvent, ui ) {

          events[ trackEvent.element.id ] = trackEvent;
          element.appendChild( trackEvent.element );
          trackEvent.trackId = trackId;
          ui = ui || false;

          eventManager.dispatch( "trackeventadded", {
            track: that,
            trackEvent: trackEvent,
            ui: ui
          });

          return trackEvent;
        };

        this.updateTrackEvent = function( trackEvent ) {

          var eventElement = trackEvent.element,
              track = self.getTrack( trackEvent.trackId );

          eventElement.style.top = "0px";
          eventElement.style.width = trackEvent.options.width + "px";
          eventElement.style.left = trackEvent.options.left + "px";

          eventManager.dispatch( "trackeventupdated", {
            track: track,
            trackEvent: trackEvent,
            ui: false
          });

          return trackEvent;
        };

        this.getTrackEvent = function( id ) {

          return events[ id ];
        };

        this.getTrackEvents = function () {

          return events;
        };

        this.removeTrackEvent = function( id ) {

          var trackEvent = events[ id ];

          delete events[ id ];
          element.removeChild( trackEvent.element );
          eventManager.dispatch( "trackeventremoved", trackEvent );

          return trackEvent;
        };

        this.toString = function() {

          return trackId;
        };
      };

      return this;
    } //if (this !== window)
  }; //TrackLiner
}(window));


