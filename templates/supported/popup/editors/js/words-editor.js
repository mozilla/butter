/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */
(function(){
  var _menuItems = document.getElementsByClassName('menu-item'),
      _contentElement = document.getElementById( "content" ),
      j;

  function toggleMenuItem(element, state) {
    var contentId = element.getAttribute('data-content-id'),
        contentItem = _contentElement.querySelectorAll('div[data-content-id="' + contentId + '"]')[0];
    if (state){
      element.classList.add('open');
      contentItem.classList.add('open');
    }
    else{
      element.classList.remove('open');
      contentItem.classList.remove('open');
    }
  }

  function createMenuItem(element){
    var i;
    element.addEventListener('click', function(e) {
      toggleMenuItem(element, !element.classList.contains('open'));
      for (i=0; i<_menuItems.length; ++i) {
        if (_menuItems[i] !== element){
          toggleMenuItem(_menuItems[i], false);
        }
      }
    }, false);
  }

  for (j=0; j<_menuItems.length; ++j) {
    createMenuItem(_menuItems[j]);
  }
  
  toggleMenuItem(_menuItems[0], true);
}());

(function() {
  var bin, 
      icons = [], 
      userIcons, 
      i, 
      editor;
  
  editor = new EditorState({
    start: {
      type: 'time'
    },
    end: {
      type: 'time'
    },
    top: {
      type: 'percent'
    },
    left: {
      type: 'percent'
    },
    text: 'text',
    link: 'url',
    classes: 'text',
    align: 'text',
    style: 'text',
    target: {
      type: 'target',
      fieldset: 'target-section'
    }
  }, 30);
  
  //save expanded fieldset state in localStorage
  var headers = document.getElementsByClassName('form-header'),
    headerStates,
    header, id;
    
  headerStates = (localStorage && JSON.parse(localStorage.pmHeaderStates));

  if (!headerStates) {
    headerStates = {};
  }

  for (i = 0; i < headers.length; i++) {
    header = headers[i];
    id = header.id || EditorState.util.trim(header.textContent);
    header.addEventListener('click', (function(element, id) {
      return function() {
        element.classList.toggle('collapse');
        if (id) {
          headerStates[id] = element.classList.contains('collapse')
          try {
            localStorage.pmHeaderStates = JSON.stringify(headerStates);
          } catch (e) {
            console.log( "Could not store editor state in local storage");
          }
        }
      };
    }(header, id)), false);
    if (id && headerStates[id]) {
      header.classList.add('collapse');
    }
  }
}());