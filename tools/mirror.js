var fs = require('fs');

function Tokenizer(){

  var _rules = [];
  var _types = [];
  var _lengths = [];
  var _this = this;
  var _tokenListeners = {};

  this.lastToken = null;
  this.lastCharacter = null;

  this.addRule = function(rule, type, length){
    _rules.push(rule);
    _types.push(type);
    _lengths.push(length);
  };

  this.on = function(token, listener){
    _tokenListeners[token] = listener;
  };

  this.tokenize = function(data, tokenFunction){
    var successRule = -1;
    var rule;
    var match;
    var length;
    while(data.length){
      for(var i=0, l=_rules.length; i<l; ++i){
        rule = _rules[i];
        match = data.match(rule);
        if(match){
          break;
        }
      }
      if(match){
        if(_tokenListeners[_types[i]]){
          _tokenListeners[_types[i]](match[0]);
        }
        length = _lengths[i] || match[0].length;
        data = data.substr(length);
        _this.lastCharacter = match[0][match[0].length-1];
        _this.lastToken = _types[i];
        _this.lastMatch = match[0];
      }
      else{
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

  var lineNumber = 1;
  var lines = data.split('\n');

  t.addRule(/^('[^']*'|"[^"]*")/, 'string');
  t.addRule(/\./, 'dot');
  t.addRule(/^\s+/, 'whitespace');
  t.addRule(/^\/{2,}[^\n]*/, 'comment');
  t.addRule(/^\/\*(([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*)\*+\//, 'block-comment');
  t.addRule(/^\/.*\/[gmi]*/, 'regexp');
  t.addRule(/^[\+\&\|\>\<\-\*\/]\=/, 'assignment');
  t.addRule(/^([+-]{2}[\w\d]+|[\w\d]+[+-]{2})/, 'short-math');
  t.addRule(/^[\+\-\*\/]/, 'operator');
  t.addRule(/^={1,3}/, 'equals');
  t.addRule(/^if[^\w]/, 'if', 2);
  t.addRule(/^else[^\w]/, 'else', 4);
  t.addRule(/^for[^\w]/, 'for', 3);
  t.addRule(/^while[^\w]/, 'while', 5);
  t.addRule(/^switch[^\w]/, 'switch', 6);
  t.addRule(/^do[^\w]/, 'do', 2);
  t.addRule(/^case[^\w]/, 'case', 4);
  t.addRule(/^throw[^\w]/, 'throw', 5);
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

  function reportError(error){
    console.log(fileName + ':' + lineNumber + ':   ' + error + ' \n' + lines[lineNumber-1]);
  }

  function collectNewlines(match){
    var newlineMatch = match.match(/\n/g);
    if(newlineMatch){
      lineNumber += newlineMatch.length;
    }
  }

  t.on('function', function(){
    if(t.lastToken !== 'whitespace'){
      reportError('no whitespace before "function" keyword. found "' + t.lastCharacter + '" instead.');
    }
  });

  t.on('whitespace', function(match){
    collectNewlines(match);
  });

  t.on('block-comment', function(match){
    collectNewlines(match);
  });

  t.on('left-circle-bracket', function(match){
    if(['if', 'for', 'while', 'switch'].indexOf(match) > -1){
      reportError('no whitespace after "' + t.lastMatch + '" keyword. found "' + match + '" instead.' );
    }
  });

  t.on('left-curly-bracket', function(match){
    if(t.lastToken !== 'whitespace'){
      reportError('no whitespace before "' + match + '" keyword. found "' + t.lastMatch + '" instead.' );
    }
  });

  t.on('right-circle-bracket', function(match){
    if(t.lastToken !== 'whitespace'){
      reportError('no whitespace after "' + t.lastMatch + '". found "' + match + '" instead.' );
    }
  });

  t.on('equals', function(match){
    if(t.lastToken !== 'whitespace'){
      reportError('no whitespace before "=". found "' + t.lastMatch + '" instead.');
    }
  });

  t.on('word', function(match){
    if(['whitespace', 'dot'].indexOf(t.lastToken) === -1){
      reportError('!!!no whitespace before "' + match + '". found "' + t.lastMatch + '" instead.' );
    }
  });

  t.on('operator', function(match){
    if(t.lastToken !== 'whitespace'){
      reportError('no whitespace before "' + match + '". found "' + t.lastMatch + '" instead.' );
    }
  });

  t.tokenize(data);
}

function processFile(fileName, onFinished){
  fs.readFile(fileName, function(err, data){
    if(err){
      console.error("Could not open file: %s", err);
      process.exit(1);
    }

    var splitData = data.toString().split("\n");
    tokenize(fileName, data.toString());
    onFinished();
  });
}

if(process.argv.length > 2){
  var filesArray = process.argv.slice( 2 );
  var filesIndex = 0;

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
  console.log("usage: node mirror.js filename");
}