/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */
(function() {
	"use strict";

	var	urlRegex = /^(([A-Za-z]+):\/\/)+(([a-zA-Z0-9\._\-]+\.[a-zA-Z]{2,6})|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})|localhost)(\:([0-9]+))*(\/[^#]*)?(\#.*)?$/;

	function clone(obj) {
		if (null == obj || "object" != typeof obj) return obj;
		var copy = obj.constructor();
		for (var attr in obj) {
			if (obj.hasOwnProperty(attr)) {
				copy[attr] = obj[attr];
			}
		}
		return copy;
	}

	// borrowing this function from Popcorn
	// Simple function to parse a timestamp into seconds
	// Acceptable formats are:
	// HH:MM:SS.MMM
	// HH:MM:SS;FF
	// Hours and minutes are optional. They default to 0
	function toSeconds( timeStr, frameRate ) {
		// Hours and minutes are optional
		// Seconds must be specified
		// Seconds can be followed by milliseconds OR by the frame information
		var validTimeFormat = /^([0-9]+:){0,2}[0-9]+([.;][0-9]+)?$/,
				errorMessage = "Invalid time format",
				digitPairs, lastIndex, lastPair, firstPair,
				frameInfo, frameTime;

		if ( typeof timeStr === "number" ) {
			return timeStr;
		}

		if ( typeof timeStr !== "string") {
			timeStr += '';
		}

		if ( !validTimeFormat.test( timeStr ) ) {
			return false;
		}

		digitPairs = timeStr.split( ":" );
		lastIndex = digitPairs.length - 1;
		lastPair = digitPairs[ lastIndex ];

		// Fix last element:
		if ( lastPair.indexOf( ";" ) > -1 ) {

			frameInfo = lastPair.split( ";" );
			frameTime = 0;

			if ( frameRate && ( typeof frameRate === "number" ) ) {
				frameTime = parseFloat( frameInfo[ 1 ], 10 ) / frameRate;
			}

			digitPairs[ lastIndex ] = parseInt( frameInfo[ 0 ], 10 ) + frameTime;
		}

		firstPair = digitPairs[ 0 ];

		if ( digitPairs.length >= 3 ) {
			return ( parseInt( firstPair, 10 ) * 3600 ) +
				( parseInt( digitPairs[ 1 ], 10 ) * 60 ) +
				parseFloat( digitPairs[ 2 ], 10 );
		} else if ( digitPairs.length === 2 ) {
			return ( parseInt( firstPair, 10 ) * 60 ) +
					parseFloat( digitPairs[ 1 ], 10 );
		} else {
			return parseFloat( firstPair, 10 );
		}
	}

	function toTimeStamp( time, frameRate ) {
		var i, factors = [ 60, 60, 24 ],
			t, v, s = '';

		if (frameRate) {
			t = time - Math.floor(time);
			v = Math.round(t * frameRate);
			if (v < 10) {
				v = '0' + v;
			}
			s = ';' + v;
			time = Math.floor(time);
		}

		if (!time) {
			return '00;00';
		}

		for (i = 0; i < factors.length && time; i++) {
			t = time % factors[i];
			if (i) {
				s = ':' + s;
			}
			v = Math.round(t * 100) / 100;
			if (v < 10) {
				v = '0' + v;
			}
			s = v + s;
			time = (time - t) / factors[i];
		}

		return s;
	}

	function EditorState(fields, frameRate, width, height) {
		var name, field, that = this;
		function makeElementValidator(name, type, modify) {
			var fn,
				mod = modify,
				validator = that.validators[type];

			if (!validator) {
				if (mod) {
					return function() {
						var saveVal = that.saveValue[type] ? that.saveValue[type](this.value, that.fields[name]) : this.value;
						that.trackEvent[name] = saveVal;
						that.save();
						if (that.fields[name] && that.fields[name].callback) {
							that.fields[name].callback(that.fields[name], saveVal);
						}
					};
				} else {
					return function() {
						var saveVal = that.saveValue[type] ? that.saveValue[type](this.value, that.fields[name]) : this.value;
						that.trackEvent[name] = saveVal;
						if (that.fields[name] && that.fields[name].callback) {
							that.fields[name].callback(that.fields[name], saveVal);
						}
					};
				}
			}

			fn = function(event) {
				var val = validator(this.value), saveVal;
				if (val === undefined) {
					//invalid
					if (mod) {
						val = validator(that.trackEvent[name]);
						if (val !== 0 && !val) {
							val = '';
						}
						if (this.value != val) {
							this.value = val;
						}
					} else {
						this.classList.add('invalid');
					}
				} else {
					saveVal = that.saveValue[type] ? that.saveValue[type](this.value, that.fields[name]) : this.value;
					that.trackEvent[name] = saveVal;
					if (mod) {
						if (this.value != val) {
							this.value = val;
						}
						if (saveVal !== that.lastStateSaved[name]) {
							that.save();
						}
					}
					if (that.fields[name] && that.fields[name].callback) {
						that.fields[name].callback(that.fields[name], saveVal);
					}
					this.classList.remove('invalid');
				}
			};

			return fn;
		}

		this.lastStateSaved = {};
		this.trackEvent = {};
		this.undoStack = [];
		this.fields = {};

		this.width = width || document.body.offsetWidth;
		this.height = height || document.body.offsetHeight;

		// this is the value that gets displayed
		this.validators = {
			time: function (input) {
				if (input !== 0 && !input) {
					return '';
				}

				input = toSeconds( input, frameRate );

				if (input !== false) {
					return toTimeStamp(input, frameRate);
				}
			},
			number: function (input) {
				input = parseFloat(input);
				if (!isNaN(input)) {
					return input;
				}
			},
			nonNegativeNumber: function (input) {
				input = parseFloat(input);
				if (!isNaN(input) && input >= 0) {
					return input;
				}
			},
			percent: function (input) {
				input = parseFloat(input);
				if (!isNaN(input)) {
					return input;
				}
			}
		};

		// this is the value that gets saved
		this.saveValue = {
			time: function (input) {
				return toSeconds( input, frameRate );
			},
			percent: function (input) {
				input = parseFloat(input);
				if (!isNaN(input)) {
					return input;
				}
			},
			number: function (input, field) {
				input = parseFloat(input);
				if (!isNaN(input)) {
					if (field.min !== undefined && !isNaN(field.min)) {
						input = Math.max(field.min, input);
					}
					if (field.max !== undefined && !isNaN(field.max)) {
						input = Math.min(field.max, input);
					}
					return input;
				}
			}
		};


		for (name in fields) {

			field = fields[name];

			if (typeof field === 'string') {
				field = {
					type: field
				};
			}

			if (!field.id) {
				field.id = name;
			}

			if (field.element) {
				field.id = field.element.id || field.id || name;
			} else {
				field.element = document.getElementById(field.id);
			}

			if (field.element) {
				field.element.addEventListener('change', makeElementValidator(name, field.type, true), true);

				if (field.element.tagName === 'TEXTAREA' || field.element.tagName === 'INPUT') {
					field.element.addEventListener('keyup', makeElementValidator(name, field.type), false);
				}
			}

			if (field.type === 'target') {
				this.target = field;
				if (typeof field.fieldset === 'string') {
					field.fieldset = document.getElementById(field.fieldset);
				}
			} else if (field.type === 'time') {
//				field.
			}

			this.fields[name] = field;
		}

		this.client = new Comm();

		this.client.listen('trackeventdata', function (e) {
			var message = e.data,
          n, field, options;

			//that.id = message.id;

			options = message.popcornOptions;
			for (n in that.fields) {
				field = that.fields[n];
				if (options[n] === undefined && field.defaultValue !== undefined) {
					that.trackEvent[n] = field.defaultValue;
					if (typeof field.callback === 'function') {
						field.callback(field, that.trackEvent[n]);
					}
				} else if (that.trackEvent[n] !== options[n]) {
					that.trackEvent[n] = options[n];
					if (typeof field.callback === 'function') {
						field.callback(field, that.trackEvent[n]);
					}

				}
			}

			that.targetsUpdated(message.targets);

			if (that.targets.length === 1) {
				that.trackEvent.target = that.targets[0];
			}

			that.undoStack = [];
			that.pushState();
			that.updateForm();
		});

		this.client.listen('trackeventupdated', function (e) {
			var message = e.data,
          n, field, options;

			if (that.id === message.id) {
				that.pushState();

				that.trackEvent = message;

				options = message;
				for (n in that.fields) {
					field = that.fields[n];
					if (that.trackEvent[n] !== options[n]) {
						that.trackEvent[n] = options[n];
						if (typeof field.callback === 'function') {
							field.callback(field, that.trackEvent[n]);
						}

					}
				}

				that.updateForm();
			}
		});
	}

	EditorState.prototype.save = function () {
		this.client.send( "submit", {
			eventData: this.trackEvent
		});
		this.lastStateSaved = clone(this.trackEvent);
	};

	EditorState.prototype.load = function (options) {
	};

	EditorState.prototype.targetsUpdated = function ( newTargets ) {
		var i, parent, target, targets,
			select, option, fieldset,
			field,
			validTarget = true;

		targets = newTargets || [];

		if (!this.target) {
			return;
		}
		field = this.target;

		if (typeof field.filter === 'function') {
			field.filter(field, targets);
		}

		select = field.element;
		fieldset = field.fieldset || select;

		if (targets.length <= 1) {
			if ( fieldset ) {
				fieldset.style.display = 'none';
			}

			if (targets.length) {
				this.trackEvent.target = targets[0];
			}
		} else {
			if ( fieldset ) {
				fieldset.style.display = '';
			}
			select = field.element;

			for (i = 0; i < targets.length; i++) {

				option = document.createElement('option');
				option.value = targets[i][0];
				option.appendChild( document.createTextNode(targets[i][0]) );
				select.appendChild(option);

				if (!i || targets[i][0] === this.trackEvent.target) {
					select.selectedIndex = i;
				}
			}

			if (!this.trackEvent.target) {
				this.trackEvent.target = targets[0];
			}

		}

		this.targets = targets;
	};

	EditorState.prototype.setField = function (fieldName, value) {
		var field = this.fields[fieldName];

		this.pushState();

		if (this.saveValue[field.type]) {
			this.trackEvent[fieldName] = this.saveValue[field.type](value, field);
		} else {
			this.trackEvent[fieldName] = value;
		}

		if (this.validators[field.type] && field.element) {
			field.element.value = this.validators[field.type](value);
		}

		if (typeof field.callback === 'function') {
			field.callback(field, value);
		}

		this.save();

		return this.trackEvent[fieldName];
	};

	EditorState.prototype.updateForm = function () {
		var n, field, value, oldValue;
		for (n in this.fields) {
			field = this.fields[n];
			if (field.element) {
				value = this.trackEvent[n];
				if (this.validators[field.type]) {
					value = this.validators[field.type](value);
				}

				field.element.value = (!value && value !== 0) ? '' : value;
			}
		}
	};
	EditorState.prototype.pushState = function () {
		var state = clone(this.trackEvent);
		this.undoStack.push(state);
	};

	EditorState.prototype.undo = function () {
		if (!this.undoStack.length) {
			return;
		}

		this.trackEvent = this.undoStack.pop();
		if (!this.undoStack.length) {
			this.pushState();
		}
		this.updateForm();
	};

	EditorState.prototype.reset = function () {
		if (!this.undoStack.length) {
			return;
		}

		this.trackEvent = this.undoStack[0];
		this.undoStack.splice(0, this.undoStack.length);
		this.pushState();
		this.updateForm();
	};

	EditorState.prototype.cancel = function () {
		this.reset();
		if (this.client) {
			this.client.send( '', 'cancelclicked');
		}
	};

	EditorState.prototype.del = function () {
		if (this.client) {
			this.client.send( '', 'deleteclicked');
		}
	};

	EditorState.prototype.ok = function () {
		if (this.client) {
			this.client.send( this.trackEvent, 'okayclicked');
		}
	};

	EditorState.util = {
		trim: function (str) {
			var	str = str.replace(/^\s\s*/, ''),
				ws = /\s/,
				i = str.length;
			while (ws.test(str.charAt(--i)));
			return str.slice(0, i + 1);
		},
		resolveUrl: function(url, base) {
			if (urlRegex.test(url)) {
				return url;
			}

			if (base && (matches = urlRegex.exec(base))) {
				base = {};
				base.protocol = matches[2] + ':';
				base.hostname = matches[3];
				base.port = matches[7] || '';
				base.host = base.hostname + (base.port ? ':' + base.port : '');
				base.pathname = matches[8];
			} else {
				base = window.location;
			}

			var urlSplit = url.split('/');

			if (urlSplit.length && urlSplit[0] === '' ) {
				return base.protocol + '//' + base.host + url;
			}

			var dir = base.pathname.split('?');
			dir = dir[0].split('/');
			dir.pop();
			var i;
			for (i = 0; i < urlSplit.length; i++) {
				if (urlSplit[i] === '..') {
					dir.pop();
				} else if (urlSplit[i] !== '.') { //do nothing if directory specified is '.'
					dir.push(urlSplit[i]);
				}
			}
			return base.protocol + '//' + base.host + dir.join('/');
		}
	};

	window.EditorState = EditorState;
}());
