var fs = require('fs');
var esprima = require('esprima');

var inputFilename = process.argv[2];
var depthHashes = '##########################';

function generateMD(objectTree, depth){
  var output = '';

  depth = depth === undefined ? 1 : depth;

  output += depthHashes.substr(0, depth);
  output += objectTree.title;

  objectTree.children.forEach(function(child){
    output += '\n\n';
    output += generateMD(child, depth+1);
  });

  return output;
}

if(!inputFilename){
  console.log('Must supply an input filename.');
  console.log('Usage: docutron <input>');
  return;
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
              comment: comment.value,
              type: 'function',
              name: object.id.name,
              params: getParams(object.params)
            };
          }
          else if(object.type === 'CallExpression'){
            root.description = {
              comment: comment.value,
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
                comment: comment.value,
                type: 'function',
                namespace: getNamespace(object.expression.left),
                name: object.expression.left.property.name,
                params: getParams(object.expression.right.params)
              };
            }
            else {
              root.description = {
                comment: comment.value,
                type: 'property',
                namespace: getNamespace(object.expression.left),
                name: object.expression.left.property.name
              };
            }
          }
          else if(object.type === 'VariableDeclaration' && object.declarations[0].init && object.declarations[0].init.type === 'FunctionExpression'){
            root.description = {
              type: 'function',
              comment: comment.value,
              name: object.declarations[0].id.name,
              params: getParams(object.declarations[0].init.params)
            };
          }
          else if(object.type === 'Property' && object.key.type === 'Identifier'){
            root.description = {
              type: 'property',
              comment: comment.value,
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
    console.log(JSON.stringify(walk(syntax.body, comments), null, 2));
  }
});