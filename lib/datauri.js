"use strict";

var IMAGE_DATA_URI_PREFIX_REGEX = "data:image/(jpeg|png);base64,";

var crypto = require( "crypto" );

function ImageFile( dataURI, filename, url ) {
  var _data = new Buffer( dataURI, 'base64' );
  var _hash = crypto.createHash( "sha1" ).update( dataURI, "utf8" ).digest( "hex" );

  this.createDBReference = function( dbModel, projectId, callback ) {
    dbModel.build({
      filename: filename,
      url: url,
      project: projectId,
      hash: _hash
    }).save().complete( callback );
  };

  this.saveToStore = function( store, callback ) {
    store.write( filename, _data, callback );
  };

  this.getJSONMetaData = function() {
    return {
      hash: _hash,
      url: url
    };
  };

  Object.defineProperties( this, {
    filename: { value: filename },
    url: { value: url }
  });
}

function saveImageFilesToStore( store, files, callback ) {
  var finishedItems = 0;
  var errs = [];

  function itemCallback( err ) {
    if ( err ) {
      errs.push( err );
    }

    if ( ++finishedItems === files.length ) {
      callback( errs.length > 0 ? errs : null );
    }
  }

  files.forEach( function( file ) {
    file.saveToStore( store, itemCallback );
  });
}

function collectTrackEvents( projectData ) {
  var trackEvents = [];
  if ( projectData.media ) {
    projectData.media.forEach( function( media ) {
      if ( media.tracks ) {
        media.tracks.forEach( function( track ) {
          if ( track.trackEvents ) {
            trackEvents = trackEvents.concat( track.trackEvents );
          }
        });
      }
    });
  }
  return trackEvents;
}

function compareImageReferencesInProject( imageReferences, projectData ) {
  var trackEvents = collectTrackEvents( projectData );
  var unlinkedFiles = [];

  imageReferences.forEach( function( imageReference ) {
    for ( var i = 0, l = trackEvents.length; i < l; ++i ) {
      if ( trackEvents[ i ].popcornOptions.src === imageReference.url ) {
        return;
      }
    }
    unlinkedFiles.push( imageReference );
  });

  return unlinkedFiles;
}

function filterProjectDataURIs( inputData, urlGenerator ) {
  var filesToWrite = [],
      regexMatch, file, urlPair;

  if ( inputData ) {

    collectTrackEvents( inputData ).forEach( function( trackEvent ) {
      if (  trackEvent.popcornOptions && trackEvent.popcornOptions.src ) {
        regexMatch = trackEvent.popcornOptions.src.match( IMAGE_DATA_URI_PREFIX_REGEX );
        if ( regexMatch ) {
          urlPair = urlGenerator();

          file = new ImageFile(
            trackEvent.popcornOptions.src.substr( regexMatch[ 0 ].length ),
            urlPair.filename,
            urlPair.url
          );

          trackEvent.popcornOptions.src = file.url;
          filesToWrite.push( file );
        }
      }
    });
  }

  return filesToWrite;
}

module.exports = {
  collectTrackEvents: collectTrackEvents,
  compareImageReferencesInProject: compareImageReferencesInProject,
  filterProjectDataURIs: filterProjectDataURIs,
  saveImageFilesToStore: saveImageFilesToStore,
  ImageFile: ImageFile
};
