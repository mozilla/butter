(function(){
  var _menuItems = document.getElementsByClassName('menu-item'),
      _contentElement = document.getElementById( "content" ),
      i;

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
    element.addEventListener('click', function(e) {
      toggleMenuItem(element, !element.classList.contains('open'));
      for (i=0; i<_menuItems.length; ++i) {
        if (_menuItems[i] !== element){
          toggleMenuItem(_menuItems[i], false);
        }
      }
    }, false);
  }

  for (i=0; i<_menuItems.length; ++i) {
    createMenuItem(_menuItems[i]);
  }

  toggleMenuItem(_menuItems[0], true);
}());

(function() {
  var bin, icons = [], userIcons, i, editor;
  
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
    
  try {
    headerStates = (localStorage && JSON.parse(localStorage.pmHeaderStates));
  } catch(e) {
  }
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
          }
        }
      };
    }(header, id)), false);
    if (id && headerStates[id]) {
      header.classList.add('collapse');
    }
  }
}());