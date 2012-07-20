var fs = require('fs');
/**
 * Tokenizer
 *
 * Simple tokenizer. Chomps through data one segment at a time according to given rules.
 *
 * Usage:
 * var t = new Tokenizer();                             // setup tokenizer
 * t.addRule(/someRegex/, 'my-rule', optionalLength);   // add a rule
 * t.on('my-rule', function(match){ ... });             // setup listeners for rule occurrences
 * t.tokenize(inputData);                               // start tokenizing
 */
function Tokenizer(){

  var _rules = [];
  var _types = [];
  var _lengths = [];
  var _this = this;
  var _tokenListeners = {};

  // For helping to make decisions about what to do when specific tokens are found. Useful in tandem with on().
  this.lastToken = null;
  this.lastCharacter = null;

  /**
   * Member: addRule
   *
   * Adds a rule to the tokenizer. Rules are regexps that are used to slowly chew through data.
   * When the input string meets the requirements of a rule, the input string is shortened by the
   * length of the string found, or by the given length (for more exact matching).
   *
   * @param {RegExp} rule: A regular expression used to determine the existence of a token.
   * @param {String} type: Name of token.
   * @param {Number} length: Optional. If length is given, it will be used to slice the input string if this rule is met.
   */
  this.addRule = function(rule, type, length){
    _rules.push(rule);
    _types.push(type);
    _lengths.push(length);
  };

  /**
   * Member: on
   *
   * Listen for the occurrence of a token.
   *
   * @param {String} token: Name of token to listen for.
   * @param {Function} listener: Callback to use when token is found.
   */
  this.on = function(token, listener){
    _tokenListeners[token] = listener;
  };

  /**
   * Member: tokenize
   *
   * Tokenize some data. This function will attempt to match each rule against the input string in the order they were added. When a rule
   * is met, the input data will be shortened by the matched string's length (from the beginning). If a rule is not met, the string will
   * be shortened by one character (from the beginning). This routine will continue until the input string is empty.
   *
   * @param {String} data: Data to tokenize.
   */
  this.tokenize = function(data){
    var successRule = -1;
    var rule;
    var match;
    var length;
    var i;

    // Spin until there is no data left.
    while(data.length){

      // Compare each rule until one is found to match.
      for(i=0, l=_rules.length; i<l; ++i){
        rule = _rules[i];
        match = data.match(rule);
        if(match){
          break;
        }
      }

      // If a rule matched, tokenize!
      if(match){
        // If there was a listener for this token, call it now.
        if(_tokenListeners[_types[i]]){
          _tokenListeners[_types[i]](match[0]);
        }
        // Figure out the appropriate length to shorten the input string and shorten it.
        length = _lengths[i] || match[0].length;
        data = data.substr(length);

        // Remember some important data for the next loop.
        _this.lastCharacter = match[0][match[0].length-1];
        _this.lastToken = _types[i];
        _this.lastMatch = match[0];
      }
      else{
        // Remember some important data and march on.
        _this.lastCharacter = data[0];
        _this.lastMatch = null;
        _this.lastToken = null;
        data = data.substr(1);
      }
    }
  };
}

function tokenize(fileName, data){
  var t = new Tokenizer();

  // Used to determine on which line an error occured.
  var lineNumber = 1;
  var lines = data.split('\n');

  // Lots of tokens commonly known for JavaScript.
  t.addRule(/^('[^']*'|"[^"]*")/, 'string');
  t.addRule(/^\n\s*\}\)/, 'final-brackets');
  t.addRule(/^\}\(\)\);/, 'final-brackets-execution');
  t.addRule(/^\./, 'dot');
  t.addRule(/^\s+/, 'whitespace');
  t.addRule(/^\/{2,}[^\n]*/, 'comment');
  t.addRule(/^\/\*(([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*)\*+\//, 'block-comment');
  t.addRule(/^\/.*\/[gmi]*/, 'regexp');
  t.addRule(/^[\+\&\|\>\<\-\*\/]\=/, 'assignment');
  t.addRule(/^([+-]{2}[\w\d]+|[\w\d]+[+-]{2})/, 'short-math');
  t.addRule(/^[\+\-\*\/]/, 'operator');
  t.addRule(/^\!=+/, 'not-equal');
  t.addRule(/^={1,3}/, 'equals');
  t.addRule(/^if[^\w]/, 'if', 2);
  t.addRule(/^else[^\w]/, 'else', 4);
  t.addRule(/^for[^\w]/, 'for', 3);
  t.addRule(/^while[^\w]/, 'while', 5);
  t.addRule(/^switch[^\w]/, 'switch', 6);
  t.addRule(/^do[^\w]/, 'do', 2);
  t.addRule(/^case[^\w]/, 'case', 4);
  t.addRule(/^throw[^\w]/, 'throw', 5);
  t.addRule(/^\!/, 'not');
  t.addRule(/^\(/, 'left-circle-bracket');
  t.addRule(/^\)/, 'right-circle-bracket');
  t.addRule(/^\[/, 'left-square-bracket');
  t.addRule(/^\]/, 'right-square-bracket');
  t.addRule(/^\</, 'left-angle-bracket');
  t.addRule(/^\>/, 'right-angle-bracket');
  t.addRule(/^\{/, 'left-curly-bracket');
  t.addRule(/^\}/, 'right-curly-bracket');
  t.addRule(/^function/, 'function');
  t.addRule(/^var/, 'var');
  t.addRule(/^\n/, 'newline');
  t.addRule(/^[\w\d]+/, 'word');

  // Output a well-formatted error.
  function reportError(error){
    console.log(fileName + ':' + lineNumber + ':  ' + error + ' \n' + lines[lineNumber-1]);
  }

  // Figure out how many newlines were in a match and advance the counter.
  function collectNewlines(match){
    var newlineMatch = match.match(/\n/g);
    if(newlineMatch){
      lineNumber += newlineMatch.length;
    }
  }

  // Listeners!

  t.on('function', function(){
    if(t.lastToken !== 'whitespace'){
      reportError('no whitespace before "function" keyword. found "' + t.lastCharacter + '" instead.');
    }
  });

  t.on('final-brackets', collectNewlines);
  t.on('block-comment', collectNewlines);
  t.on('whitespace', collectNewlines);

  t.on('left-circle-bracket', function(match){
    if(['if', 'for', 'while', 'switch'].indexOf(match) > -1){
      reportError('no whitespace after "' + t.lastMatch + '" keyword. found "' + match + '" instead.' );
    }
  });

  t.on('left-curly-bracket', function(match){
    if(t.lastToken !== 'whitespace'){
      reportError('no whitespace before "' + match + '". found "' + t.lastMatch + '" instead.' );
    }
  });

  t.on('right-circle-bracket', function(match){
    if(['whitespace', 'left-circle-bracket'].indexOf(t.lastToken) === -1 ){
      reportError('no whitespace after "' + t.lastMatch + '". found "' + match + '" instead.' );
    }
  });

  t.on('equals', function(match){
    if(t.lastToken !== 'whitespace'){
      reportError('no whitespace before "=". found "' + t.lastMatch + '" instead.');
    }
  });

  t.on('word', function(match){
    if(['whitespace', 'dot', 'not'].indexOf(t.lastToken) === -1){
      reportError('no whitespace before "' + match + '". found "' + t.lastMatch + '" instead.' );
    }
  });

  t.on('operator', function(match){
    if(t.lastToken !== 'whitespace'){
      reportError('no whitespace before "' + match + '". found "' + t.lastMatch + '" instead.' );
    }
  });

  t.on('assignment', function(match){
    if(t.lastToken !== 'whitespace'){
      reportError('no whitespace before "' + match + '". found "' + t.lastMatch + '" instead.' );
    }
  });

  t.tokenize(data);
}

// Process one file.
function processFile(fileName, onFinished){
  fs.readFile(fileName, function(err, data){
    if(err){
      console.error("Could not open file: %s", err);
      process.exit(1);
    }

    tokenize(fileName, data.toString());
    onFinished();
  });
}

// Only continue if there are files given on the command line.
if(process.argv.length > 2){
  var filesArray = process.argv.slice( 2 );
  var filesIndex = 0;

  // After one file is finished, attempt to process the next.
  var onFinished = function(){
    filesIndex++;
    if(filesIndex < filesArray.length ){
      processFile(filesArray[ filesIndex ], onFinished);
    }
  };

  processFile(filesArray[ 0 ], onFinished);
}
else{
  console.log("mirror.js - butter style linter");
  console.log("usage: node mirror.js filename [filename2 ...]");
}