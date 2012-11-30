var esprima = require('esprima');
var fs = require('fs');

var filename = process.argv[2];

function parseFunctionDeclaration(json){
  return {
    name: json.id ? json.id.name : undefined,
    line: json.loc.start.line,
    params: parseFunctionParams(json)
  };
}

function parseFunctionParams(json){
  var params;

  if(json.params){
    params = [];
    json.params.forEach(function(param){
      params.push(param.name)
    });
  }

  return params;
}

function parseMemberFunction(json){
  var parsed = parseFunctionDeclaration(json);
  parsed.name = json.left.property.name;
  return parsed;
}

var parsers = {
  'AssignmentExpression': function(json){
    if(json.left.type === 'MemberExpression'){
      if(json.right.type === 'FunctionExpression'){
        return parseMemberFunction(json);
      }
    }
  },
  'ExpressionStatement': function(json){
  },
  'FunctionExpression': function(json){
    if(json.body && Array.isArray(json.body.body) && json.body.body[0] && json.body.body[0].type === 'FunctionDeclaration'){
      return parseFunctionDeclaration(json.body.body[0]);
    }
  }
};

var validBlockCommentTypes = [
  'CallExpression',
  'FunctionDeclaration'
];

function walk(object, comments){
  var children = [];
  var parser;
  var data;
  var blockComment;

  if(object.type){
    parser = parsers[object.type];
    if(parser){
      data = parser(object);
    }

    if(object.loc){
      comments.forEach(function(comment){
        if(comment.loc.end.line === object.loc.start.line - 1){
          blockComment = comment.value;
        }
      });
    }
  }

  function doChildItem(item){
    var parsed;
    if(item){
      parsed = walk(item, comments);
      if(parsed.children.length > 0 || parsed.data){
        children.push(parsed);
      }
    }
  }

  if(Array.isArray(object)){
    object.forEach(doChildItem);
  }
  else if(typeof object === 'object'){
    Object.keys(object).forEach(function(item){
      doChildItem(object[item]);
    });
  }

  if(!data && !blockComment && children.length === 1){
    if(blockComment && !children[0].comment){
      children[0].comment = blockComment;
    }
    return children[0];
  }

  if(children.length === 1 && !children[0].data){
    children = children[0].children;
  }

  return {
    data: data,
    children: children,
    comment: blockComment
  };
}

fs.readFile(filename, 'utf8', function(err, data){
  var syntax;

  if(!err){
    syntax = esprima.parse(data, {
      comment: true,
      loc: true
    });

    console.log(JSON.stringify(walk(syntax, syntax.comments), null, 4));
    //console.log(JSON.stringify(syntax, null, 4));
  }
});