'use strict';

var utils,
    publishStore,
    embedSuffix,
    hostname,
    // Use a nearer epoch date so generated URLs aren't so long
    epoch = Date.parse( "Sun, 01 Jan 2012 00:00:00 GMT-0500" );

/**
 * An UniqueId is a date-specific ID.  It takes the following form:
 *
 *   id_date-in-ms
 *
 * The id and date-in-ms values are converted to Base36 strings, and
 * the underscore is used to separate them (Base36 strings never contain
 * an underscore).  Here is an example for a project with id=567.
 *
 *   fr_c2xrgdj
 *
 * The publishId and publishUrl use this value, where as the iframeId and
 * iframeUrl both add a "_" suffix (or whatever consts.EMBED_SUFFIX is) so
 * the two can be identified.
 **/
function UniqueId( id, date ) {
console.log("uniqueId", id, date);
  this.idPrefix = id.toString( 36 ) + "_";

  this.publishId = this.idPrefix + ( date - epoch ).toString( 36 );
  this.publishUrl = hostname + publishStore.expand( this.publishId );

  this.embedId = this.publishId + embedSuffix;
  this.iframeUrl = hostname + publishStore.expand( this.embedId );
}

utils = {
  generateUniqueId: function( id, date ) {
    date = date || Date.now();
    return new UniqueId( id, date );
  }
};

module.exports = function( consts, store ) {
  embedSuffix = consts.EMBED_SUFFIX;
  hostname = consts.EMBED_HOSTNAME + "/";
  publishStore = store;
  return utils;
};
