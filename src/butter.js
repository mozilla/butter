/**********************************************************************************

Copyright (C) 2011 by Mozilla Foundation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

**********************************************************************************/

(function ( window, document, undefined ) {

  /****************************************************************************
   * Track
   ****************************************************************************/
  var numTracks = 0;
  var Track = function ( options ) {
    var trackEvents = [],
        id = numTracks++,
        that = this;

    options = options || {};
    var name = options.name || 'Track' + Date.now();

    this.getName = function () {
      return name;
    }; //getName

    this.getId = function () {
      return id;
    }; //getId

    this.getTrackEvent = function ( trackId ) {
      for ( var i=0, l=trackEvents.length; i<l; ++i) {
        if ( trackEvents[i].getId() === trackId || trackEvents[i].getName() === trackId ) {
          return trackEvents[i];
        } //if
      } //for
    }; //getTrackEvent

    this.getTrackEvents = function () {
      return trackEvents;
    }; //getTrackEvents

    this.removeTrackEvent = function ( trackEvent ) {
      if ( typeof(trackEvent) === "string" ) {
        trackEvent = that.getTrackEvent( trackEvent );
      } //if
      var idx = trackEvents.indexOf( trackEvent );
      if ( idx > -1 ) {
        trackEvents.splice( idx, 1 );
        trackEvent.track = undefined;
      } //if
    }; //removeTrackEvent

    this.addTrackEvent = function ( trackEvent ) {
      trackEvents.push( trackEvent );
      trackEvent.track = that;
    }; //addTrackEvent
  }; //Track

  /****************************************************************************
   * TrackEvent
   ****************************************************************************/
  var numTrackEvents = 0;
  var TrackEvent = function ( options ) {
    var id = numTrackEvents++,
    name = options.name || 'Track' + Date.now();
      
    options = options || {};
<<<<<<< HEAD
    
    this.attributes = options.attributes || {};
=======
    var name = options.name || 'Track' + id + Date.now();
>>>>>>> 638ccf2544c362962488fbf12e103a6483573893
    this.start = options.start || 0;
    this.end = options.end || 0;
    this.type = options.type;
    this.popcornOptions = options.popcornOptions;
    this.popcornEvent = options.popcornEvent;
    this.track = options.track;

    this.getName = function () {
      return name;
    };

    this.getId = function () {
      return id;
    }; //getId

  }; //TrackEvent

  /****************************************************************************
   * Target 
   ****************************************************************************/
  var numTargets = 0;
  var Target = function ( options ) {
    var id = numTargets++;

    options = options || {};
    var name = options.name || "Target" + Date.now();
    this.object = options.object;

    this.getName = function () {
      return name;
    }; //getName

    this.getId = function () {
      return id;
    }; //getId
  }; //Target

  /****************************************************************************
   * Butter
   ****************************************************************************/
  var numButters = 0;
  var Butter = function ( options ) {

    var events = {},
        tracksByName = {},
        tracks = [],
        targets = [],
        targetsByName = {},
        that = this;
     
    window.evt = events;

    this.id = "Butter" + numButters++;

    /****************************************************************
     * Event methods
     ****************************************************************/
    //trigger - Triggers an event indicating a change of state in the core
    this.trigger = function ( name, options ) {
      if ( events[ name ] ) {
        for (var i=0, l=events[ name ].length; i<l; ++i) {
          events[ name ][ i ].call( that, options );
        } //for
      } //if
    }; //trigger

    //listen - Listen for events triggered by the core
    this.listen = function ( name, handler ) {
      if ( !events[ name ] ) {
        events[ name ] = [];
      } //if
      events[ name ].push( handler );
    }; //listen

    //unlisten - Stops listen for events triggered by the core
    this.unlisten = function ( name, handler ) {
      var handlerList = events[ name ];
      if ( handlerList ) {
        if ( handler ) {
          var idx = handlerList.indexOf( handler );
          handlerList.splice( idx, 1 );
        }
        else {
          events[ name ] = [];
        } //if
      } //if
    }; //unlisten

    /****************************************************************
     * TrackEvent methods
     ****************************************************************/
    //addTrackEvent - Creates a new Track Event
    this.addTrackEvent = function ( track, trackEvent ) {
      if ( typeof(track) === "string" ) {
        track = that.getTrack( track );
      } //if
      if ( track ) {
        if ( !(trackEvent instanceof TrackEvent) ) {
          trackEvent = new TrackEvent( trackEvent );
        } //if
        track.addTrackEvent( trackEvent );
        that.trigger("trackeventadded", trackEvent);
        return trackEvent;
      } //if
      return undefined;
    }; //addTrackEvents

    //getTrackEvents - Get a list of Track Events
    this.getTrackEvents = function () {
      var trackEvents = {};
      for ( var i=0, l=tracks.length; i<l; ++i ) {
        var track = tracks[i];
        trackEvents[ track.getName() ] = track.getTrackEvents();
      } //for
      return trackEvents;
    }; //getTrackEvents

    this.getTrackEvent = function ( track, trackEventId ) {
      if ( typeof(track) === "string" ) {
        track = that.getTrack( track );
      } //if
      track.getTrackEvent( trackEventId );
    }; //getTrackEvent

    //removeTrackEvent - Remove a Track Event
    this.removeTrackEvent = function ( track, trackEvent ) {
      if ( !(track instanceof Track) ) {
        track = that.getTrack( track );
      } //if
      track.removeTrackEvent( trackEvent );
      that.trigger( "trackeventremoved", trackEvent );
    };

    /****************************************************************
     * Track methods
     ****************************************************************/
    //addTrack - Creates a new Track
    this.addTrack = function ( track ) {
      if ( !(track instanceof Track) ) {
        track = new Track( track );
      } //if
      tracksByName[ track.getName() ] = track;
      tracks.push( track );
      that.trigger( "trackadded", track );
      return track;
    }; //addTrack

    //getTracks - Get a list of Tracks
    this.getTracks = function () {
      return tracks;
    }; //getTracks

    //getTrack - Get a Track by its id
    this.getTrack = function ( name ) {
      var track = tracksByName[ name ];
      if ( track ) {
         return track;
      } //if

      for ( var i=0, l=tracks.length; i<l; ++i ) {
        if ( tracks[i].id === name ) {
          return tracks[i];
        } //if
      } //for

      return undefined;
    }; //getTrack

    //removeTrack - Remove a Track
    this.removeTrack = function ( track ) {
      if ( typeof(track) === "string" ) {
        track = that.getTrack( track );
      } //if
      var idx = tracks.indexOf( track );
      if ( idx > -1 ) {
        tracks.splice( idx, 1 );
        delete tracksByName[ track.getName() ];
        that.trigger( "trackremoved", track );
        return track;
      } //if
      return undefined;    
    };

    /****************************************************************
     * Target methods
     ****************************************************************/
    //addTarget - add a target object
    this.addTarget = function ( target ) {
      if ( !(target instanceof Target) ) {
        target = new Target( target );
      } //if

      targetsByName[ target.getName() ] = target;
      targets.push( target );

      that.trigger( "targetadded", target );

      return target;
    };

    //removeTarget - remove a target object
    this.removeTarget = function ( target ) {
      if ( typeof(target) === "string" ) {
        target = that.getTarget( target );
      } //if
      var idx = targets.indexOf( target );
      if ( idx > -1 ) {
        targets.splice( idx, 1 );
        delete targets[ target.getName() ]; 
        that.trigger( "targetremoved", target );
        return target;
      } //if
      return undefined;
    };

    //getTargets - get a list of targets objects
    this.getTargets = function () {
      return targets;
    };

    //getTarget - get a target object by its id
    this.getTarget = function ( name ) {
      return targetsByName[ name ];
    };

    /****************************************************************
     * Project methods
     ****************************************************************/
    //import - Import project data
    this.importProject = function ( projectData ) {
    };

    //export - Export project data
    this.exportProject = function () {
      var projectData;
      return projectData;
    };

    //setProjectDetails - set the details of the project
    this.setProjectDetails = function () {
    };

    //getProjectDetails - get the projects details
    this.getProjectDetails = function () {
    };

    /****************************************************************
     * Media methods
     ****************************************************************/
    //play - Play the media
    this.play = function () {
    };

    //pause - Pause the media
    this.pause = function () {
    };

    //currentTime - Gets and Sets the media's current time.
    this.currentTime = function () {
    };

    //getMedia - get the media's information
    this.getMedia = function () {
    };

    //setMedia - set the media's information
    this.setMedia = function () {
    };

  }; //Butter

  Butter.getScriptLocation = function () {
    var scripts = document.querySelectorAll( "script" );
    for (var i=0; i<scripts.length; ++i) {
      var pos = scripts[i].src.lastIndexOf('butter.js');
      if ( pos > -1 ) {
        return scripts[i].src.substr(0, pos) + "/";
      } //if
    } //for
  };

  //registerModule - Registers a Module into the Butter core
  Butter.registerModule = Butter.prototype.registerModule = function ( name, module ) {
    Butter.prototype[name] = function(options) {
      module.setup && module.setup.call(this, options);
    };
    if ( module.extend ) {
      Butter.extendAPI( module.extend );
    } //if
  };

  Butter.extendAPI = function ( functions ) {
    for ( var fn in functions ) {
      if ( functions.hasOwnProperty( fn ) ) {
        Butter.prototype[ fn ] = functions[ fn ];
      } //if
    } //for
  };

  Butter.Track = Track;
  Butter.TrackEvent = TrackEvent;
  Butter.Target = Target;

  window.Butter = Butter;

})( window, document, undefined );
