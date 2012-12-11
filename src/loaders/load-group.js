/* This Source Code Form is subject to the terms of the MIT license.
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "./load-item" ], function( LoadItem ) {

  /**
   * Class: LoadGroup
   *
   * A LoadGroup is used to load an entire batch of items, notifying its called of individual errors, and total completion.
   * When instantiated, a LoadGroup takes a dictionary of loader to which it refers to load individual items. Items are added
   * with LoadGroup::addItem, and if an item has a type which doesn't appear inside of the loaders dictionary, the item
   * is discarded and will not load; a warning is displayed on the console instead.
   *
   * errorCallback is called for *every* error that occurs, but the group is not halted. readyCallback is called when each
   * item has either finished loading, or reported an error state.
   *
   * @param {Dictionary} loaders: A dictionary of loaders which are used to execute loading for individual items.
   * @param {Function} readyCallback: Callback to use when all items are ready (with errors or otherwise).
   * @param {Function} errorCallback: Callback used each time an error is detected in the execution of a load.
   * @param {Boolean} ordered: If true, items are loaded in order, on after another in the order they were added.
   *                           Otherwise, loading order is not guaranteed at all.
   */
  function LoadGroup( loaders, readyCallback, errorCallback, ordered ) {
    var _this = this,
        _items = [],
        _loaders = loaders,
        _loadStarted = false,
        _erroneousItems = [],
        _successfulItems = [];

    /**
     * Member: addItem
     *
     * Adds an item to be loaded as a part of this LoadGroup.
     *
     * @param {Object} item: Item description to be loaded by this LoadGroup. The attributes on this object are used to
     *                       construct a LoadItem object with a specific type. If no loader exists of the specified type
     *                       the item is ignored and a warning is printed.
     */
    this.addItem = function( item ) {
      if ( !item.type ) {
        console.warn( "Loader description requires a type." );
        return;
      }

      if ( !item.url ) {
        console.warn( "Loader description requires a url." );
        return;
      }

      if ( !_loaders[ item.type ] ) {
        console.warn( "Invalid loader type: " + item.type + "." );
        return;
      }

      // Construct and store a LoadItem with the specified parameters. If we got this far, the item should be valid.
      _items.push( new LoadItem( item.type + "", _loaders[ item.type ], item.url + "", !!item.exclude, item.check ) );
    };

    /**
     * Private Member: startOrdered
     *
     * Loads the items in this LoadGroup in the order they were added. After the load function is called on one item,
     * unorderedReadyCallback or unorderedErrorCallback are used to progress the LoadGroup onto the next item after
     * either an load has completed or has failed respectively.
     */
    function startOrdered() {
      var itemIndex = 0;

      var next = function() {

        // itemIndex++ to read index 0 and increment afterward
        var item = _items[ itemIndex++ ];

        // If there are more items to load, load the next one.
        if ( item ) {
          item.load( unorderedReadyCallback, unorderedErrorCallback );
        }
        else {
          // Otherwise, call the readyCallback because we're done.
          readyCallback( _this );
        }
      };

      function unorderedReadyCallback( loadItem ) {
        _successfulItems.push( loadItem );
        next();
      }

      function unorderedErrorCallback( loadItem ) {
        _erroneousItems.push( loadItem );
        // If an error occured, call the error callback, but keep loading.
        errorCallback.call( this, loadItem.error );
        next();
      }

      // Start loading.
      next();
    }

    /**
     * Private Member: startUnordered
     *
     * Loads the items in this LoadGroup without any guarantees about ordering. Each item's load function is called
     * immediately, and when all have either finished loading or failed, readyCallback is executed.
     */
    function startUnordered() {
      var checkFinished = function() {
        // If every item has finished successfully or in error, call the ready callback.
        if ( _successfulItems.length + _erroneousItems.length === _items.length && readyCallback ) {
          readyCallback( _this );
        }
      };

      function unorderedReadyCallback( loadItem ) {
        _successfulItems.push( loadItem );
        checkFinished();
      }

      function unorderedErrorCallback( loadItem ) {
        _erroneousItems.push( loadItem );
        // If an error occured, call the error callback, but keep loading.
        errorCallback.call( this, loadItem.error );
        checkFinished();
      }

      _items.forEach( function( item ) {
        item.load( unorderedReadyCallback, unorderedErrorCallback );
      });
    }

    /**
     * Member: start
     *
     * Begins the loading process. If an ordered load was requested, startOrdered is called. Otherwise,
     * startUnordered is used. After the first execution of this function, successive calls are ignored.
     */
    this.start = function() {
      if ( _loadStarted ) {
        return;
      }

      _loadStarted = true;

      if ( ordered ) {
        startOrdered();
      }
      else {
        startUnordered();
      }
    };
  }

  return LoadGroup;

});
