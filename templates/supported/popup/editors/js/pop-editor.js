/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */
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

    for (i=0; i<_menuItems.length; ++i) {
      createMenuItem(_menuItems[i]);
    }

    toggleMenuItem(_menuItems[0], true);
  }());

  (function() {
    var bin, icons = [], userIcons, i, editor,
      imagePath = location.protocol + "//" + location.hostname + ( location.port ? ":" + location.port : "" ) + '/templates/supported/popup/';
    
    function indexOf(array, callback) {
      var elements = array.filter(callback);
      if (!elements.length) {
        return -1;
      }
      
      return array.indexOf(elements[0]);
    }
    
    function selectIcon(icon) {
      editor.setField('icon', icon && icon.path);
    }
    

    editor = new EditorState({
      start: {
        type: 'time'
      },
      end: {
        type: 'time'
      },
      top: {
        type: 'percent',
        callback: function(field, value) {
          document.getElementById('top-pos').innerHTML = value;
        },
        defaultValue: "50%"
      },
      left: {
        type: 'percent',
        callback: function(field, value) {
          document.getElementById('left-pos').innerHTML = value;
        },
        defaultValue: "50%"
      },
      text: 'text',
      link: 'url',
      classes: 'text',
      align: 'text',
      style: 'text',
      exit: {
        type: 'nonNegativeNumber',
        callback: function(field, value) {
          document.getElementById('fade-out').innerHTML = Math.round(value * 100) / 100 + ' s';
        },
        defaultValue: 0.3
      },
      target: {
        type: 'target',
        fieldset: 'target-section'
      },
      icon: {
        callback: function(field, value) {
          var i, previousSelected;

          //remove highlight on any other icons
          previousSelected = bin.getElementsByClassName('selected');
          for (i = 0; i < previousSelected.length; i++) {
            previousSelected[i].classList.remove('selected');
          }
          
          i = indexOf(icons, function(icon) {
            return icon.path === value;
          });
          
          if (i >= 0) {
            icons[i].img.classList.add('selected');
          }
        }
      }
    }, 30);
    
    //set up icon bin
    var icon, j;
    
    bin = document.getElementById('icon-bin');
    var iconPaths = [
      'images/audio.png', 'images/brokenheart.png', 'images/cone.png', 'images/earth.png', 'images/error.png', 'images/eye.png', 'images/heart.png', 'images/info.png', 'images/man.png', 'images/money.png', 'images/music.png', 'images/net.png', 'images/skull.png', 'images/star.png', 'images/thumbsdown.png', 'images/thumbsup.png', 'images/time.png', 'images/trophy.png', 'images/tv.png', 'images/user.png', 'images/virus.png', 'images/women.png'
    ];

    try {
      userIcons = JSON.parse(localStorage.popIcons);
    } catch (e) {
    }
    
    if (!userIcons) {
      userIcons = [];
    }

    for (i = 0; i < userIcons.length; i++) {
      j = iconPaths.indexOf(userIcons[i]);
      if (j >= 0) {
        iconPaths.splice(j, 1);
      }
      iconPaths.shift(userIcons[i]);
    }
    
    for (i = 0; i < iconPaths.length; i++) {
      //iconPaths[i] = EditorState.util.resolveUrl(iconPaths[i]);
      icon = {
        img: document.createElement('img'),
        path: iconPaths[i]
      };
      icon.img.src = imagePath + iconPaths[i];
      icon.img.addEventListener('click', (function(icon) {
        return function() {
          selectIcon(icon);
        };
      }(icon)), false);
      icons.push(icon);
      bin.appendChild(icon.img);
    }

    document.getElementById('no-icon').addEventListener('click', function() {
      selectIcon(null);
    }, false);

    document.getElementById('add-icon').addEventListener('click', function(event) {
      
      var src, img, button = this, i, icon,
        url = document.getElementById('icon-url');
      src = EditorState.util.trim(url.value);
      src = EditorState.util.resolveUrl(src);

      url.classList.remove('invalid');

      if (!src) {
        return;
      }

      i = indexOf(icons, function(icon) {
        return src === icon.path;
      });

      if (i >= 0) {
        selectIcon(icons[i]);
        return;
      }
      
      button.disabled = true;
      
      img = document.createElement('img');
      img.src = src;
      img.onload = function(evt) {
        var i;
        url.classList.remove('invalid');
        button.disabled = false;
        
        //double-check it's not in icons again, in case it got added while loading
        i = indexOf(icons, function(icon) {
          return src === icon.path;
        });

        if (i < 0) {
          icon = {
            img: img,
            path: src
          };
          icons.shift(icon);
          bin.insertBefore(this, bin.firstChild);
          img.addEventListener('click', (function(icon) {
            return function() {
              selectIcon(icon);
            };
          }(icon)), false);

        } else {
          icon = icons[i];
        }
        selectIcon(icon);
      };

      img.onerror = function(evt) {
        url.classList.add('invalid');
        button.disabled = false;
      };
    }, false);

  }());