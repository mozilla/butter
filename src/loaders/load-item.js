/*! This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [], function() {

  /**
   * Class: LoadItem
   *
   * Maintains state and executes loading procedures for an individual item specified by
   * url. The loader passed in as an argument is used to execute loading, but this class
   * will make sure callbacks and error-state notification are managed properly.
   *
   * @param {String} type: The type of loader used to load this item. This is used mainly for
   *                       book-keeping, since the loader itself is specified separately.
   * @param {BaseLoader} loader: A BaseLoader object which will execute the loading procedure.
   * @param {String} url: The url to pass to the BaseLoader when loading begins.
   * @param {Boolean} exclude: A variable passed to the BaseLoader to specify an exclusion attribute
   *                           when applicable (e.g. 'data-butter-exclude' on link/script tags).
   * @param {Function} checkFunction: A function passed to the BaseLoader to see if loading needs to
   *                                  occur or if the required assets are already present.
   */
  function LoadItem( type, loader, url, exclude, checkFunction ) {
    var _this = this,
        _error = null,
        _secondaryReadyCallback,
        _secondaryErrorCallback;

    function readyCallback() {
      _secondaryReadyCallback( _this );
    }

    function errorCallback( e ) {
      _error = e;
      _secondaryErrorCallback( _this );
    }

    this.load = function( secondaryReadyCallback, secondaryErrorCallback ) {
      // Store the specified callbacks, but route the loader's ready/error toward
      // ready/errorCallback functions specified above. This way, we can get in
      // between the ready/error states of the loader, and the LoadGroup this item
      // is a part of so that state management is simpler, and loading can progress
      // even when errors are to be reported.
      _secondaryReadyCallback = secondaryReadyCallback;
      _secondaryErrorCallback = secondaryErrorCallback;

      // Execute the loading procedure.
      loader.load( url, exclude, readyCallback, checkFunction, errorCallback );
    };

    Object.defineProperties( this, {
      error: {
        enumerable: true,
        get: function() {
          return _error;
        }
      }
    });
  }

  return LoadItem;
});