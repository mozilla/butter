document.addEventListener( "DOMContentLoaded", function( e ){

  Butter.init({
    config: 'ui-config.json',
    ready: function( butter ){
      var media = butter.media[ 0 ];

      function start(){
        test( "ToolTip Tests", function() {

          var fooTip,
              newMessage = "Changing the ToolTip Text",
              parent = document.querySelector( "a.butter-btn.butter-editor-header-media" ),
              newParent = document.querySelector( "a.butter-btn.butter-editor-header-popcorn" );

          Butter.ToolTip.create({
            name: "foo-tip",
            element: parent,
            message: "This is a ToolTip",
            left: "25%",
            top: "55%"
          })

          fooTip = Butter.ToolTip.get( "foo-tip" );

          //ToolTip parent
          ok( fooTip.parent, "The ToolTip has a Parent element" );
          strictEqual( fooTip.parent, parent, "The ToolTip has the correct Parent" );
          fooTip.parent = newParent;
          strictEqual( fooTip.parent, newParent, "The parent reference was updated" );
          ok( !parent.querySelector( "div.butter-tooltip" ), "The old parent does not contain a tooltip div" );
          ok( newParent.querySelector( "div.butter-tooltip" ), "The new parent got the tooltip div");

          // Check that parent was given abs or rel positioning
          notStrictEqual( [ "absolute", "relative" ].indexOf( getComputedStyle( fooTip.parent ).getPropertyValue( "position" ) ), -1, "The parent element was given absolute or relative positioning" );

          // ToolTip name property
          equal( fooTip.name, "foo-tip", "Butter.ToolTip.get returned the correctly named tooltip." );
          fooTip.name = "This-Should-Not-Work";
          equal( fooTip.name, "foo-tip", "tooltip name property cannot be modified" );

          // ToolTip message property
          equal( fooTip.message, "This is a ToolTip", "Message was assigned correctly." );
          equal( fooTip.tooltipElement.innerHTML, "This is a ToolTip", "The ToolTip element was given the correct message text" );
          fooTip.message = newMessage;
          equal( fooTip.message, newMessage, "Message text was changed" );
          equal( fooTip.tooltipElement.innerHTML, newMessage, "The ToolTip's element innerHTML was changed" );

          // ToolTip top property
          equal( fooTip.top, "55%", "The ToolTip was assigned the correct top value" );
          equal( fooTip.tooltipElement.style.top, "55%", "The ToolTip's element was given the correct top value" );
          fooTip.top = "25%";
          equal( fooTip.top, "25%", "The ToolTip's top was updated" );
          equal( fooTip.tooltipElement.style.top, "25%", "The updated top was applied to the ToolTip element" );

          // ToolTip left property
          equal( fooTip.left, "25%", "The ToolTip was assigned the correct left value" );
          equal( fooTip.tooltipElement.style.left, "25%", "The ToolTip's element was given the correct left value" );
          fooTip.left = "55%";
          equal( fooTip.left, "55%", "The ToolTip's left was updated" );
          equal( fooTip.tooltipElement.style.left, "55%", "The updated left was applied to the ToolTip element" );

          // ToolTip hidden property
          equal( fooTip.hidden, true, "When not passed a hidden value, it defaults to true" );
          ok( !fooTip.tooltipElement.classList.contains( "tooltip-on" ), "The tooltip element does not contain the 'tooltip-on' class" );
          fooTip.hidden = false;
          equal( fooTip.hidden, false, "The hidden property was updated" );
          ok( fooTip.tooltipElement.classList.contains( "tooltip-on" ), "The tooltip element contains the 'tooltip-on' class now" );

          // ToolTip hover property
          equal( fooTip.hover, true, "When not passed a hover value, it defaults to true" );
          ok( !fooTip.tooltipElement.classList.contains( "tooltip-no-hover" ), "The tooltip element does not contain the 'tooltip-no-hover' class" );
          fooTip.hover = false;
          equal( fooTip.hover, false, "The hover property was updated" );
          ok( fooTip.tooltipElement.classList.contains( "tooltip-no-hover" ), "The tooltip element contains the 'tooltip-no-hover' class now" );

        });
      }

      media.onReady( start );
    }
  });

}, false );
