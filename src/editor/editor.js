/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

/**
 * Module: Editor
 */
define( [ "util/lang", "util/xhr",
          "./base-editor", "./trackevent-editor" ],
  function( LangUtils, XHRUtils,
            BaseEditor, TrackEventEditor ) {

  var __editors = {};

  /**
   * Namespace: Editor
   */
  var Editor = {

    BaseEditor: BaseEditor,
    TrackEventEditor: TrackEventEditor,

    /**
     * Function: register
     *
     * Registers an editor in the system.
     *
     * @param {String} name: Name of the editor
     * @param {String} layoutSrc: String representing the basic HTML layout of the editor. May be prepended with "load!" to signify that load must be done after butter is initialized.
     * @param {Function} ctor: Constructor to be run when the Editor is being created
     */
    register: function( name, layoutSrc, ctor ) {
      __editors[ name ] = {
        create: ctor,
        layout: layoutSrc
      };
    },

    /**
     * Function: loadUrlSpecifiedLayouts
     *
     * For layouts that were specified as `load!<url>`, replace the url with actual layout content by loading
     * it through XHR. This is useful for editors specified in Butter config files, since using `Butter.Editor`
     * outside of the core will not guarantee that {{baseDir}} properly exists until #1245 has landed:
     *
     * https://webmademovies.lighthouseapp.com/projects/65733/tickets/1245-remove-instances-have-butter-become-a-singleton
     *
     * @param {Function} readyCallback: After all layouts have been loaded, call this function
     */
    loadUrlSpecifiedLayouts: function( readyCallback, baseDir ) {
      var layoutsToLoad = [],
          loadedLayouts = 0;

      for ( var editor in __editors ) {
        if (  __editors.hasOwnProperty( editor ) &&
              __editors[ editor ].layout &&
              __editors[ editor ].layout.indexOf( "load!" ) === 0 ) {
          layoutsToLoad.push( __editors[ editor ] );
        }
      }

      if ( layoutsToLoad.length === 0 ) {
        readyCallback();
      }
      else {
        layoutsToLoad.forEach( function( editorHusk ) {
          Editor.loadLayout( editorHusk.layout.substring( 5 ), function( layoutSrc ){
            editorHusk.layout = layoutSrc;
            ++loadedLayouts;
            if ( loadedLayouts === layoutsToLoad.length ) {
              readyCallback();
            }
          }, baseDir );
        });
      }
    },

    /**
     * Function: create
     *
     * Creates an editor
     *
     * @param {String} editorName: Name of the editor to create
     * @param {Butter} butter: An instance of Butter
     */
    create: function( editorName, butter ) {
      var description = __editors[ editorName ],
          completeLayout,
          compiledLayout;

      if ( !description ) {
        throw "Editor \"" + editorName + "\" does not exist.";
      }

      if ( description.layout ) {
        // Collect the element labeled with the 'butter-editor' class to avoid other elements (such as comments)
        // which may exist in the layout.
        compiledLayout = LangUtils.domFragment( description.layout );

        // Expose the full compiledLayout to the editor for later use.
        completeLayout = compiledLayout;

        // If domFragment returned a DOMFragment (not an actual element) try to get the proper element out of it
        if ( !compiledLayout.classList ) {
          compiledLayout = compiledLayout.querySelector( ".butter-editor" );
        }

        if ( !compiledLayout ) {
          throw "Editor layout not formatted properly.";
        }
      }

      return new description.create( compiledLayout, butter, completeLayout );
    },

    /**
     * Function: create
     *
     * Reports the existence of an editor given a name
     *
     * @param {String} name: Name of the editor of which existence will be verified
     */
    isRegistered: function( name ) {
      return !!__editors[ name ];
    },

    /**
     * Function: loadLayout
     *
     * Loads a layout from the specified src
     *
     * @param {String} src: The source from which the layout will be loaded
     * @param {Function} readyCallback: Called once layout is loaded
     * @param {String} baseDir: Optional. Can be specified to replace {{baseDir}} in url variables
     */
    loadLayout: function( src, readyCallback, baseDir ) {
      baseDir = baseDir || "";
      if ( src.indexOf( "{{baseDir}}" ) > -1 ) {
        src = src.replace( "{{baseDir}}", baseDir );
      }
      XHRUtils.get( src, function( e ) {
        if ( e.target.readyState === 4 ){
          readyCallback( e.target.responseText );
        }
      }, "text/plain" );

    },

    // will be set by Editor module when it loads
    baseDir: null

  };

  return Editor;

});
