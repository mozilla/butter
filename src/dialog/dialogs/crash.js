/*! This Source Code Form is subject to the terms of the MIT license
 *  * If a copy of the MIT license was not distributed with this file, you can
 *  * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ "text!dialog/dialogs/crash.html", "dialog/dialog", "util/lang" ],
  function( LAYOUT_SRC, Dialog, LangUtil ) {

    function formatReport( report ) {
      return "<b>Date</b>: " + report.date + "<br>" +
             "<b>App URL</b>: " + report.appUrl + "<br>" +
             "<b>Script URL</b>: " + report.scriptUrl + ":" + report.lineno + "<br>" +
             "<b>Media URL(s)</b>: " + report.mediaUrl + "<br>" +
             "<b>Error</b>: " + LangUtil.escapeHTML( report.message ) + "<br>" +
             "<b>Butter State</b>: " + report.stateList.slice().reverse().join( ", " ) + "<br>" +
             "<b>Browser</b>: " + report.userAgent + "<br>" +
             "<b>Null DOM Nodes</b>: " + report.nullDomNodes + "<br>" +
             "<b>Versions</b>: Popcorn=" + report.popcornVersion + ", Butter=" + report.butterVersion;
    }

    Dialog.register( "crash", LAYOUT_SRC, function ( dialog, data ) {

      var rootElement = dialog.rootElement,
          reportTextArea = rootElement.querySelector( "#report" ),
          dialogInfo = rootElement.querySelector( ".dialog-info" ),
          infoBtn = rootElement.querySelector( ".icon-info-sign" ),
          commentsTextArea = rootElement.querySelector( "#comments" ),
          noBtn = rootElement.querySelector( "#no" ),
          yesBtn = rootElement.querySelector( "#yes" ),
          yesCallback = data.onSendReport,
          noCallback = data.onNoReport;

      reportTextArea.innerHTML = formatReport( data );

      infoBtn.addEventListener( "click", function() {
        dialogInfo.classList.toggle( "dialog-hidden" );
      }, false );

      noBtn.addEventListener( "click", noCallback, false );
      yesBtn.addEventListener( "click", function() {
        yesCallback( commentsTextArea.value || "" );
      }, false );

      dialog.enableCloseButton();
      dialog.assignEscapeKey( "default-close" );
    });
});
