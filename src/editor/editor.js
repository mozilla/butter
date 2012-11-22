/*! This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

/**
 * Module: Editor
 */
define( [ "util/lang", "util/xhr",
          "./base-editor", "./trackevent-editor" ],
  function( LangUtils, XHRUtils,
            BaseEditor, TrackEventEditor ) {

  var __editors = {};

  function DeferredLayout( src ) {

    this.load = function( baseDir, readyCallback ) {
      baseDir = baseDir || "";
      if ( src.indexOf( "{{baseDir}}" ) > -1 ) {
        src = src.replace( "{{baseDir}}", baseDir );
      }

      XHRUtils.get( src, function( e ) {
        if ( e.target.readyState === 4 ){
          readyCallback( e.target.responseText );
        }
      }, "text/plain" );
    };
 }

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
    register: function( name, layoutSrc, ctor, persist ) {
      __editors[ name ] = {
        create: ctor,
        persist: !!persist,
        layout: layoutSrc || "",
        deferredLayouts: []
      };

      function processLayoutEntry( src ) {
        var deferredLayout;
        if ( src.indexOf( "load!" ) === 0 ) {
           deferredLayout = new DeferredLayout( src.substring( 5 ) );
           __editors[ name ].deferredLayouts.push( deferredLayout );
           return true;
        }
        return false;
      }

      if ( layoutSrc ) {
        if ( Array.isArray( layoutSrc ) ) {
          layoutSrc.forEach( processLayoutEntry );
        }
        else {
          if ( processLayoutEntry( layoutSrc ) ) {
            __editors[ name ].layout = "";
          }
        }
      }
    },

    /**
     * Function: initialize
     *
     * Initializes the Editor module.
     *
     * For layouts that were specified as `load!<url>`, replace the url with actual layout content by loading
     * it through XHR. This is useful for editors specified in Butter config files, since using `Butter.Editor`
     * outside of the core will not guarantee that {{baseDir}} properly exists until #1245 has landed:
     *
     * https://webmademovies.lighthouseapp.com/projects/65733/tickets/1245-remove-instances-have-butter-become-a-singleton
     *
     * @param {Function} readyCallback: After all layouts have been loaded, call this function.
     * @param {String} baseDir: The baseDir found in Butter's config which is used to replace {{baseDir}} in urls.
     */
    initialize: function( readyCallback, baseDir ) {
      var editorName,
          editorsLoaded = 0,
          editorsToLoad = [];

      for ( editorName in __editors ) {
        if ( __editors.hasOwnProperty( editorName ) && __editors[ editorName ].deferredLayouts.length > 0 ) {
          editorsToLoad.push( __editors[ editorName ] );
        }
      }

      editorsToLoad.forEach( function( editor ) {
        var finishedLayouts = 0;
        editor.deferredLayouts.forEach( function( deferredLayout ) {
          deferredLayout.load( baseDir, function( layoutData ) {
            ++finishedLayouts;
            editor.layout += layoutData;
            if ( finishedLayouts === editor.deferredLayouts.length ) {
              editor.deferredLayouts = null;
              ++editorsLoaded;
              if ( editorsLoaded === editorsToLoad.length ) {
                readyCallback();
              }
            }
          });
        });
      });
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
     * Function: isRegistered
     *
     * Reports the existence of an editor given a name
     *
     * @param {String} name: Name of the editor of which existence will be verified
     */
    isRegistered: function( name ) {
      return !!__editors[ name ];
    },


    isPersistent: function( editorName ) {
      return __editors[ editorName ].persist;
    }

  };

  return Editor;

});
