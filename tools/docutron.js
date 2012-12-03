var fs = require('fs');
var esprima = require('esprima');

var inputFilename = process.argv[2];
var depthHashes = '##########################';

function generateMD(objectTree, depth, parent){
  var output = '';
  var newDepth = depth;
  var newParent = parent;

  depth = depth || 1;

  if(objectTree.description){
    var params = objectTree.description.comment.params;
    var otherOptions = {};
    var usage, structureType, api, access;
    var title;

    objectTree.description.comment.options.forEach(function(option){
      if(option.type === 'param'){
        params.push(option);
      }
      else {
        otherOptions[option.type] = option;
      }
    });

    structureType = otherOptions.type ? otherOptions.type.description : null;
    api = otherOptions.api ? otherOptions.api.description : null;
    access = otherOptions.access ? otherOptions.access.description : null;
    usage = otherOptions.usage ? otherOptions.usage.description : null;

    delete otherOptions.api;
    delete otherOptions.type;
    delete otherOptions.access;
    delete otherOptions.usage;

    output += depthHashes.substr(0, depth);

    title = objectTree.description.comment.title;
    if(title.indexOf('::') > -1){
      title = title.substr(title.lastIndexOf('::') + 2);      
    }

    output += title;
    if(api || structureType){
      output += ' (' + [access, api, structureType].filter(function(p){return !!p}).join(' ') + ')';
    }
    output += '\n\n';
    output += objectTree.description.comment.description;
    output += '\n\n';

    if(params.length > 0){
      params.forEach(function(param){
        output += '* __' + param.name + '__ [_' + param.varTypes.join('_ or _') + '_]: ' + param.description + '\n';
      });
      output += '\n';
    }

    var otherOptionKeys = Object.keys(otherOptions);
    if(otherOptionKeys.length > 0){
      otherOptionKeys.forEach(function(key){
        output += '__@' + key + '__';
        if(otherOptions[key].varTypes.length > 0){
          output += ' [_' + otherOptions[key].varTypes.join('_ or _') + '_]';
        }
        if(otherOptions[key].description){
          output += ': ' + otherOptions[key].description;
        }
        output += '  \n';
      });
      output += '  \n';
    }

    if(objectTree.description.type === 'function'){
      if(!usage){
        if(objectTree.description.name){
          var prefix = '';
          var args = objectTree.description.params ? objectTree.description.params.join(', ') : '';

          if(objectTree.description.namespace){
            if(objectTree.description.namespace === 'this'){
              prefix = parent.description.name[0].toLowerCase();
            }
            else {
              prefix = objectTree.description.namespace;
            }
            prefix += '.';
          }
          else if(structureType && structureType.toLowerCase() === 'class'){
            prefix += 'var ' + objectTree.description.name[0].toLowerCase() + ' = new ';
          }

          output += '\n\nUsage:  \n\n';
          output += '    ' + prefix + objectTree.description.name + '(' + args + ');';
          output += '  \n\n';
        }
      }
      else{
        output += '\n\nUsage:  \n\n';
        output += '    ' + usage;
        output += '  \n\n';
      }
    }

    newParent = objectTree;
    newDepth = depth + 1;
  }

  var functionChildren = [];
  var propertyChildren = [];
  var otherChildren = [];

  objectTree.children.forEach(function(child){
    if(child.description){
      if(child.description.type === 'function'){
        functionChildren.push(child);
      }
      else {
        propertyChildren.push(child);
      }
    }
    else {
      otherChildren.push(child);
    }
  });

  function alphaSort(a, b){
    return a.description.name > b.description.name ? 1 : (a.description.name < b.description.name ? -1 : 0);
  }

  propertyChildren = propertyChildren.sort(alphaSort);
  functionChildren = functionChildren.sort(alphaSort);

  output += otherChildren.concat(propertyChildren).concat(functionChildren).reduce(function(prev, child){
    return prev + generateMD(child, newDepth, newParent);
  }, '');

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
  var params = [];
  var index = descriptionEndIndex;
  var option;
  var endIndex;
  var fragment;

  while(index < inputString.length){
    if(inputString.indexOf('\n@', index) === index){
      endIndex = inputString.indexOf('\n@', index + 2);
      endIndex = endIndex === -1 ? inputString.length : endIndex;

      fragment = inputString.substring(index + 2, endIndex);
      option = fragment.match(/^([^\s]+)\s?(\{([^\}]+)\})?\s?([^\s]+)?\s?([^$]+)?$/);

      // @param {String} varName Description of the variable.
      if(option[1] === 'param' && option[3]){
        params.push({
          type: option[1],
          varTypes: option[3].split('|'),
          name: option[4] || '',
          description: option[5] || ''
        });
      }

      else if(option[1]){
        options.push({
          type: option[1],
          varTypes: option[3] ? option[3].split('|') : [],
          description: [option[4], option[5]].filter(function(p){return !!p}).join(' ')
        });
      }

      else {
        options.push({type: fragment});
      }
      index = endIndex;
    }
    else {
      ++index;
    }
  }

  return {
    title: title,
    description: description,
    options: options,
    params: params
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

            var getter, setter, configurable;
            if(object.value){
              if(object.value.type === 'ObjectExpression'){

                root.description = {
                  type: 'property',
                  comment: parseBlockComment(comment.value),
                  name: object.key.name
                };

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
              else if(object.value.type === 'FunctionExpression'){
                root.description = {
                  type: 'function',
                  comment: parseBlockComment(comment.value),
                  name: object.key.name,
                  params: getParams(object.value.params)
                };
              }
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