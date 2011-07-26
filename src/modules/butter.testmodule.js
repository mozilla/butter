(function (window, document, undefined, Butter) {
  var testWindow, testDiv;

  Butter.registerModule( "test", {

    setup: function () {
      console.log("Instance:", this.id);
      this.listen("test", function ( event ) {
        console.log("Test event fired:", event);
      });
    },

    extend: {

      openTest: function () {
        if (!testWindow || testWindow.closed) {
          testWindow = window.open(Butter.getScriptLocation() + "modules/test-window.html", "test", "status=0 toolbar=0 width=500 height=500");
          testWindow.addEventListener('load', function (e) {
            testDiv = testWindow.document.getElementById("test-div");
          }, false);
        } //if
      },

      closeTest: function () {
        if (testWindow) {
          testWindow.close();
          testWindow = null;
          testDiv = null;
        } //if
      },

      speakTest: function () {
        if (testWindow && testDiv) {
          var which = Math.random() > 0.5 ? "Boop! " : "Beep! ";
          testDiv.innerHTML += which;
          this.trigger("test", which);
        } //if
      }

    } //extend

  });
})(window, document, undefined, Butter);
