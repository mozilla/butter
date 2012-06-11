// PLUGIN: words
// http://www.youtube.com/watch?v=OclVb7Y8_30#t=1m56s
/*

todo: animate top, left and other styles (color, font size, etc.)

*/

(function (Popcorn) {

"use strict";

	var nop = {
		start: function() {},
		end: function() {}
	};

	Popcorn.plugin( 'words' , function(options) {
		var popcorn,
			video,
			target,
			container,
			textContainer,
			text, node, i;

		if (!options) {
			return nop;
		}

		if (!options.target || !options.text) {
			return nop;
		}

		popcorn = this;
		video = popcorn.media;

		target = options.target;

		if (typeof target === 'string') {

			target = document.getElementById(target);

			if (!target) {
				return nop;
			}
		}

		container = document.createElement('div');
		container.style.cssText = options.style || '';

		container.style.top = options.top + '%';
    container.style.left = options.left + '%';
    container.style.position = 'absolute';

		if (options.align) {
			container.style.textAlign = options.align;
		}


		container.style.display = 'none';
		if (options.classes) {
			if (options.classes.length && options.classes.join) {
				//an array works
				container.setAttribute('class', 'popcorn-words ' + options.classes.join(' '));
			} else {
				container.setAttribute('class', 'popcorn-words ' + options.classes.split(/,\s\n\r/).join(' '));
			}
		} else {
			container.setAttribute('class', 'popcorn-words');
		}

		if (options.link) {
			textContainer = document.createElement('a');
			textContainer.setAttribute('href', options.link);
			if (options.linkTarget) {
				textContainer.setAttribute('target', options.linkTarget);
			} else {
				textContainer.setAttribute('target', '_new');
			}

			//pause video when link is clicked
			textContainer.addEventListener('click', function() {
				video.pause();
			}, false);

			container.appendChild(textContainer);
		} else {
			textContainer = container;
		}

		text = options.text.split(/[\n\r]/);
		for (i = 0; i < text.length; i++) {
			if (i) {
				textContainer.appendChild(document.createElement('br'));
			}
			textContainer.appendChild(document.createTextNode(text[i]));
		}

		target.appendChild(container);
		options.container = container;

		//if event callbacks are strings, swap them out for functions
		(function() {
			var i, event, events = ['onLoad', 'onStart', 'onFrame', 'onEnd'];
			for (i = 0; i < events.length; i++) {
				event = events[i];
				if (options[event] && typeof options[event] === 'string') {
					if (window[ options[event] ] && typeof window[ options[event] ] === 'function') {
						options[event] = window[ options[event] ];
					}
				}
			}
		}());

		if (typeof options.onLoad === 'function') {
			options.onLoad(options);
		}

		return {
			start: function( event, options ) {
				if (options.container) {
					options.container.style.display = '';
				}

				if (typeof options.onStart === 'function') {
					try {
						options.onStart(options);
					} catch (e) {
					}
				}
			},
			frame: function(event, options, time){
				if (typeof options.onFrame === 'function') {
					try {
						options.onFrame(options, time);
					} catch (e) {
					}
				}
			},
			end: function( event, options ) {
				if (options.container) {
					options.container.style.display = 'none';
				}

				if (typeof options.onEnd === 'function') {
					try {
						options.onEnd(options);
					} catch (e) {
					}
				}
			},
			_teardown: function( options ) {
				if (options.container && options.container.parentNode) {
					options.container.parentNode.removeChild(options.container);
					container = null;
					delete options.container;
				}
			}
		};
	},
	{
		about: {
			name: 'Popcorn Words Plugin',
			version: 0.1,
			author: 'Brian Chirls',
			website: 'http://chirls.com'
		},
		options: {
			start: {elem:'input', type:'text', label:'In'},
			end: {elem:'input', type:'text', label:'Out'},
			text: {
				elem:'input',
				type:'text',
				label:'Text',
        "default": "words!"
			},
			link: {
				elem:'input',
				type:'text',
				label:'Link (URL)'
			},
			classes: {
				elem:'input',
				type:'text',
				label:'List of classes to apply to text container'
			},
			style: {
				elem:'input',
				type:'text',
				label:'CSS to apply to text'
			},
			align: {
				elem:'select',
				label:'CSS to apply to text'
			},
			top: {
				elem:'input',
				type:'number',
				label:'Top position',
        "default": "50"
			},
			left: {
				elem:'input',
				type:'number',
				label:'Left position',
        "default": "50"
			},
			bottom: {
				elem:'input',
				type:'number',
				label:'Bottom position'
			},
			right: {
				elem:'input',
				type:'number',
				label:'Right position'
			},
			target: {
				elem:'input',
				type:'text',
				label:'Target Element'
			}/*,
			onSetup: {
				type: "function",
				label: "onSetup callback function"
			},
			onLoad: {
				type: "function",
				label: "onLoad callback function"
			},
			onStart: {
				type: "function",
				label: "onStart callback function"
			},
			onEnd: {
				type: "function",
				label: "onEnd callback function"
			},
			onFrame: {
				type: "function",
				label: "onFrame callback function"
			}*/
		}
	});
})( Popcorn );
