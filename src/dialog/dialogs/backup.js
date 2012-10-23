/* This Source Code Form is subject to the terms of the MIT license
 *  * If a copy of the MIT license was not distributed with this file, you can
 *  * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "text!dialog/dialogs/backup.html", "dialog/dialog" ],
  function( LAYOUT_SRC, Dialog ) {

    function replaceProjectName( name, elements ) {
      for ( var i = 0, l = elements.length; i < l; i++ ) {
        elements[ i ].innerHTML = name;
      }
    }

    Dialog.register( "backup", LAYOUT_SRC, function ( dialog, data ) {

      var rootElement = dialog.rootElement,
          projectNames =rootElement.querySelectorAll( ".butter-backup-project-name" ),
          backupLoadBtn = rootElement.querySelector( ".butter-backup-load" ),
          backupDiscardBtn = rootElement.querySelector( ".butter-backup-discard" ),
          // NEEDS TO BE REPLACED
          testName = "Test project 123";

      replaceProjectName( testName, projectNames );

      dialog.enableCloseButton();
      dialog.assignEscapeKey( "default-close" );
    });
});
