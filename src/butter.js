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

  var modules = {};

  /****************************************************************************
   * Track
   ****************************************************************************/
  var numTracks = 0;
  var Track = function ( options ) {
    var trackEvents = [];

    options = options || {};
    this.id = numTracks++;
    this.name = options.name || 'Track' + Date.now();

    this.getTrackEvents = function () {
      return trackEvents;
    };
  };

  /****************************************************************************
   * TrackEvent
   ****************************************************************************/
  var numTrackEvents = 0;
  var TrackEvent = function ( options ) {
    options = options || {};
    this.id = numTrackEvents++;
    this.name = options.name || 'Track' + Date.now();
  };

  /****************************************************************************
   * Butter
   ****************************************************************************/
  var Butter = function ( options ) {

    var events = {},
        tracks = {},
        that = this;

    //trigger - Triggers an event indicating a change of state in the core
    this.trigger = function ( name, options ) {
      if ( events[ name ] ) {
        for (var i=0, l=events[ name ].length; i<l; ++i) {
          events[ name ][ i ]( options );
        } //for
      } //if
    };

    //listen - Listen for events triggered by the core
    this.listen = function ( name, handler ) {
      if ( !events[ name ] ) {
        events[ name ] = [];
      } //if
      events[ name ].push( handler );
    };

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
    };

    //addTrackEvent - Creates a new Track Event
    this.addTrackEvent = function ( track, trackEvent ) {
      if ( typeof(track) === "string" ) {
        track = that.getTrack( track );
      } //if
      if ( !(options instanceof TrackEvent) ) {
        trackEvent = new TrackEvent( trackEvent );
      } //if
      track.addTrackEvent( trackEvent );
    };

    //getTrackEvents - Get a list of Track Events
    this.getTrackEvents = function () {
      var trackEvents = {};
      for ( var track in tracks ) {
        if ( tracks.hasOwnProperty(track) ) {
          trackEvents[track] = tracks[track].getTrackEvents();
        } //if
      } //for
    };

    //getTrackEvent - Get a Track Event by its id
    this.getTrackEvent = function () {
    };

    //addTrack - Creates a new Track
    this.addTrack = function ( options ) {
      if ( options instanceof TrackEvent ) {
      }
      else {
      } //if
    };

    //getTracks - Get a list of Tracks
    this.getTracks = function () {
      return tracks;
    };

    //getTrack - Get a Track by its id
    this.getTrack = function ( name ) {
      if ( tracks[ name ] ) {
         return tracks[ name ];
      } //if

      for ( var track in tracks ) {
        if ( tracks.hasOwnProperty( track ) ) {
          if ( tracks.id === name ) {
            return tracks[track];
          } //if
        } //if
      } //for

      return undefined;
    };

    //editTrackEvent - Edit Track Event data
    this.editTrackEvent = function () {
    };

    //editTrack - Edit Track data
    this.editTrack = function () {
    };

    //removeTrackEvent - Remove a Track Event
    this.removeTrackEvent = function () {
    };

    //removeTrack - Remove a Track
    this.removeTrack = function () {
    };

    //import - Import project data
    this.importProject = function () {
    };

    //export - Export project data
    this.exportProject = function () {
    };

    //play - Play the media
    this.play = function () {
    };

    //pause - Pause the media
    this.pause = function () {
    };

    //currentTime - Gets and Sets the media's current time.
    this.currentTime = function () {
    };

    //addTarget - add a target object
    this.addTarget = function () {
    };

    //removeTarget - remove a target object
    this.removeTarget = function () {
    };

    //editTarget - edits a targets data object
    this.editTarget = function () {
    };

    //getTargets - get a list of targets objects
    this.getTargets = function () {
    };

    //getTarget - get a target object by its id
    this.getTarget = function () {
    };

    //setProjectDetails - set the details of the project
    this.setProjectDetails = function () {
    };

    //getProjectDetails - get the projects details
    this.getProjectDetails = function () {
    };

    //getMedia - get the media's information
    this.getMedia = function () {
    };

    //setMedia - set the media's information
    this.setMedia = function () {
    };

    //setSelectedTarget - set a track's target
    this.setSelectedTarget = function () {
    };

    //getSelectedTarget - get a track's target
    this.getSelectedTarget = function () {
    };

  };

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
    modules[ name ] = module;
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

  window.Butter = Butter;

})( window, document, undefined );
