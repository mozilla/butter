var fs = require('fs');
var esprima = require('esprima');

var inputFilename = process.argv[2];
var depthHashes = '##########################';

function generateMD(objectTree, depth){
  var output = '';

  depth = depth === undefined ? 1 : depth;

  if(objectTree.description){
    output += depthHashes.substr(0, depth);
    output += objectTree.description.comment.title;
    output += '\n\n';
  }

  objectTree.children.forEach(function(child){
    output += generateMD(child, depth+1);
  });

  return output;
}

if(!inputFilename){
  console.log('Must supply an input filename.');
  console.log('Usage: docutron <input>');
  return;
}

function parseBlockComment(inputString){
  inputString = inputString.substr(inputString.indexOf('$\n') + 2);

  var prefixRegex = /(^|\n)\s*\*\s*/;
  while(inputString.search(prefixRegex) > -1){
    inputString = inputString.replace(prefixRegex, '\n');
  }

  inputString = inputString.replace(/\n\s*$/, '');

  inputString = inputString.substr(1);

  var title = inputString.substr(0, inputString.indexOf('\n'));
  var descriptionEndIndex = inputString.indexOf('\n@');

  descriptionEndIndex = descriptionEndIndex === -1 ? inputString.length -1 : descriptionEndIndex;

  var description = inputString.substring(title.length + 1, descriptionEndIndex);

  var options = [];
  var index = descriptionEndIndex;
  var option;
  var endIndex;

  while(index < inputString.length){
    if(inputString.indexOf('\n@', index) === index){
      endIndex = inputString.indexOf('\n@', index + 2);
      endIndex = endIndex === -1 ? inputString.length : endIndex;
      option = inputString.substring(index + 2, endIndex).match(/([^\s]+)\s?(\{([^\}]+)\})?\s?([^\s]+)?\s?([^$]+)?$/);
      options.push({
        type: option[1],
        varTypes: option[3] ? option[3].split('|') : [],
        name: option[4],
        description: option[5]
      });
      index = endIndex;
    }
    else {
      ++index;
    }
  }

  return {
    title: title,
    description: description,
    options: options
  }
}

function getParams(obj){
  return obj.map(function(paramObject){
      return paramObject.name;
  });
}

function getNamespace(obj){
  return obj.object.type === 'ThisExpression' ? 'this' : obj.object.name;
}

function walk(object, comments){
  var root;

  if(object){
    root = {
      description: null,
      children: []
    };

    if(object.type){
      comments.forEach(function(comment){
        if(!root.description && comment.loc.end.line === object.loc.start.line - 1){
          if(object.type === 'FunctionDeclaration'){
            root.description = {
              comment: parseBlockComment(comment.value),
              type: 'function',
              name: object.id.name,
              params: getParams(object.params)
            };
          }
          else if(object.type === 'CallExpression'){
            root.description = {
              comment: parseBlockComment(comment.value),
              type: 'function'
            };
            object.arguments.forEach(function(arg){
              if(!root.description.params && arg.type === 'FunctionExpression'){
                root.params = getParams(arg.params);
              }
            });
          }
          else if(object.type === 'ExpressionStatement' &&
            object.expression.type === 'AssignmentExpression' &&
            object.expression.left.type === 'MemberExpression'){

            if(object.expression.right.type === 'FunctionExpression'){
              root.description = {
                comment: parseBlockComment(comment.value),
                type: 'function',
                namespace: getNamespace(object.expression.left),
                name: object.expression.left.property.name,
                params: getParams(object.expression.right.params)
              };
            }
            else {
              root.description = {
                comment: parseBlockComment(comment.value),
                type: 'property',
                namespace: getNamespace(object.expression.left),
                name: object.expression.left.property.name
              };
            }
          }
          else if(object.type === 'VariableDeclaration' && object.declarations[0].init && object.declarations[0].init.type === 'FunctionExpression'){
            root.description = {
              type: 'function',
              comment: parseBlockComment(comment.value),
              name: object.declarations[0].id.name,
              params: getParams(object.declarations[0].init.params)
            };
          }
          else if(object.type === 'Property' && object.key.type === 'Identifier'){
            root.description = {
              type: 'property',
              comment: parseBlockComment(comment.value),
              name: object.key.name
            };

            var getter, setter, configurable;

            if(object.value){
              object.value.properties.forEach(function(prop){
                if(prop.key.name === 'get'){
                  getter = true;
                }
                else if(prop.key.name === 'set'){
                  setter = true;
                }
              });

              root.access = getter && !setter ? 'read-only' : (!getter && setter ? 'write-only' : 'read-write');
            }
          }
        }
      });
    }

    if(Array.isArray(object)){
      object.forEach(function(child){
        var result = walk(child, comments);
        if(result){
          root.children.push(result);
        }
      });
    }
    else if(typeof object === 'object'){
      Object.keys(object).forEach(function(key){
        var result = walk(object[key], comments);
        if(result){
          root.children.push(result);
        }
      });
    }

    if(root.description){
      return root;
    }
    else if(root.children.length > 0){
      if(root.children.length === 1){
        return root.children[0];
      }
      return root;
    }
  }
}

fs.readFile(inputFilename, 'utf8', function(err, data){
  var objectTree, syntax, comments;

  if(!err){
    syntax = esprima.parse(data, {loc: true, comment: true});
    comments = syntax.comments.filter(function(comment){
      return comment.type === 'Block' && comment.value.indexOf('*$') === 0;
    });
    // console.log(JSON.stringify(syntax, null, 2));
    process.stdout.write(generateMD(walk(syntax.body, comments)));
  }
});