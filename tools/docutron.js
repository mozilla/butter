var fs = require('fs');
var esprima = require('esprima');

var inputPath = process.argv[2];
var depthHashes = '##########################';

var filename = inputPath.lastIndexOf('/') > -1 ? inputPath.substr(inputPath.lastIndexOf('/') + 1) : inputPath;

function generateUsage(objectTree){
  var description = objectTree.description;
  if(description.usage){
    return description.usage;
  }

  if(description.name){
    var prefix = '';
    var args = description.signatureParams ? description.signatureParams.join(', ') : '';
    var parent;

    if(description.type.toLowerCase() === 'module'){
      return 'var ' + description.name + ' = require(\'path/to/module/' + filename + '\');';
    }
    else if(description.namespace){
      if(description.namespace === 'this'){
        parent = findParentWithDescription(objectTree._parent);
        if(parent){
          prefix = parent.description.name[0].toLowerCase();
        }
      }
      else {
        prefix = description.namespace;
      }
      prefix += '.';
    }
    else if(description.type && description.type.toLowerCase() === 'class'){
      prefix += 'var ' + description.name[0].toLowerCase() + ' = new ';
    }

    return prefix + description.name + '(' + args + ');';
  }
}

function generateMD(objectTree, depth){
  function parseMultilineDescription(description){
    var lines = description.split('\n-');

    if(lines.length > 1){
      lines[0] = lines[0] + '  ';
      lines = lines.map(function(line, index){
        var match;
        if(index > 0){
          match = line.match(/^\s*([^\s]+)\s\{([^\}]+)\}\s([^$]*)$/);
          if(match){
            return '> __' + match[1] + '__ [ _' + match[2].split('|').join('_ or _') + '_ ] ' + match[3] + '  ';
          }
        }
        return line + '  ';
      });
    }

    return lines.join('\n');
  }

  var output = '';
  var newDepth = depth;
  var description = objectTree.description;
  var usage;

  depth = depth || 1;

  if(description){
    newDepth = depth + 1;

    output += depthHashes.substr(0, depth);

    output += description.name;
    if(description.api || description.type || description.access){
      output += ' (' + [description.access, description.api, description.type].filter(function(p){return !!p}).join(' ') + ')';
    }
    output += '\n\n';
    output += description.comment.description;
    output += '\n\n';

    if(description.params.length > 0){
      description.params.forEach(function(param){
        output += '* __' + param.name + '__ [_' + param.varTypes.join('_ or _') + '_]: ' + parseMultilineDescription(param.description) + '\n';
      });
      output += '\n';
    }

    if(description.options.length > 0){
      description.options.forEach(function(option){
        output += '__@' + option.type + '__';
        if(option.varTypes.length > 0){
          output += ' [_' + option.varTypes.join('_ or _') + '_]';
        }
        if(option.description){
          output += ': ' + option.description;
        }
        output += '  \n';
      });
      output += '  \n';
    }

    if(description.blockType === 'function' && !description.noUsage){
      usage = generateUsage(objectTree);
      if(usage){
        output += '\n\nUsage:  \n\n';
        output += '    ' + usage;
        output += '\n\n';
      }
    }

    output += '  \n\n';
  }

  var functionChildren = [];
  var propertyChildren = [];
  var otherChildren = [];

  objectTree.children.forEach(function(child){
    if(child.description){
      if(child.description.blockType === 'function'){
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
    return prev + generateMD(child, newDepth);
  }, '');

  return output;
}

if(!inputPath){
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

function findParentWithDescription(parent){
  while(parent){
    if(parent.description){
      return parent;
    }
    parent = parent._parent;
  }
}

var scrapers = [
  function(tree, comment){
    if(tree.type === 'FunctionDeclaration'){
      return {
        comment: parseBlockComment(comment.value),
        blockType: 'function',
        name: tree.id.name,
        signatureParams: getParams(tree.params)
      };
    }
  },

  function(tree, comment){
    var params;
    if(tree.type === 'CallExpression'){
      tree.arguments.forEach(function(arg){
        if(arg.type === 'FunctionExpression'){
          params = getParams(arg.params);
        }
      });
      return {
        comment: parseBlockComment(comment.value),
        blockType: 'function',
        signatureParams: params
      };
    }
  },

  function(tree, comment){
    if(tree.type === 'ExpressionStatement' &&
      tree.expression.type === 'AssignmentExpression' &&
      tree.expression.left.type === 'MemberExpression'){

      if(tree.expression.right.type === 'FunctionExpression'){
        return {
          comment: parseBlockComment(comment.value),
          blockType: 'function',
          namespace: getNamespace(tree.expression.left),
          name: tree.expression.left.property.name,
          signatureParams: getParams(tree.expression.right.params)
        };
      }
      else {
        return {
          comment: parseBlockComment(comment.value),
          blockType: 'property',
          namespace: getNamespace(tree.expression.left),
          name: tree.expression.left.property.name
        };
      }
    }
  },

  function(tree, comment){
    if(tree.type === 'VariableDeclaration' && tree.declarations[0].init && tree.declarations[0].init.type === 'FunctionExpression'){
      return {
        blockType: 'function',
        comment: parseBlockComment(comment.value),
        name: tree.declarations[0].id.name,
        signatureParams: getParams(tree.declarations[0].init.params)
      };
    }
  },

  function(tree, comment, parent){
    var getter, setter, configurable;
    var parent;

    if(tree.type === 'Property' && tree.key.type === 'Identifier'){
      if(tree.value){
        if(tree.value.type === 'ObjectExpression'){

          tree.value.properties.forEach(function(prop){
            if(prop.key.name === 'get'){
              getter = true;
            }
            else if(prop.key.name === 'set'){
              setter = true;
            }
          });

          return {
            blockType: 'property',
            comment: parseBlockComment(comment.value),
            name: tree.key.name,
            access: getter && !setter ? 'read-only' : (!getter && setter ? 'write-only' : 'read-write')
          };

        }
        else if(tree.value.type === 'FunctionExpression'){
          parent = findParentWithDescription(parent);

          return {
            blockType: 'function',
            comment: parseBlockComment(comment.value),
            name: tree.key.name,
            signatureParams: getParams(tree.value.params),
            namespace: parent ? parent.description.name : null
          };
        }
      }
    }
  }
];

function walk(object, comments, parent){
  var root;

  if(object){
    root = {
      description: null,
      children: []
    };

    if(object.type){
      comments.forEach(function(comment){
        if(!root.description && comment.loc.end.line === object.loc.start.line - 1){
          scrapers.forEach(function(scraper){
            root.description = root.description || scraper(object, comment, parent);
          });
        }
      });

      if(root.description){
        root.description.params = root.description.comment.params;
        root.description.options = [];
        root.description.name = root.description.comment.title;

        if(root.description.name.indexOf('::') > -1){
          root.description.name = root.description.name.substr(root.description.name.lastIndexOf('::') + 2);
        }

        root.description.comment.options.forEach(function(option){
          if(['usage', 'type', 'api', 'access'].indexOf(option.type) > -1){
            root.description[option.type] = option.description;
          }
          else if(option.type === 'nousage'){
            root.description.noUsage = true;
          }
          else {
            (option.type === 'param' ? root.description.params : root.description.options).push(option);
          }
        });        
      }
      root._parent = parent;
      parent = root;
    }

    if(Array.isArray(object)){
      object.forEach(function(child){
        var result = walk(child, comments, parent);
        if(result){
          root.children.push(result);
        }
      });
    }
    else if(typeof object === 'object'){
      Object.keys(object).forEach(function(key){
        var result = walk(object[key], comments, parent);
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

fs.readFile(inputPath, 'utf8', function(err, data){
  var objectTree, syntax, comments;

  if(!err){
    syntax = esprima.parse(data, {loc: true, comment: true});
    comments = syntax.comments.filter(function(comment){
      return comment.type === 'Block' && comment.value.indexOf('*$') === 0;
    });
    
    process.stdout.write(generateMD(walk(syntax.body, comments)));
    // generateMD(walk(syntax.body, comments));
    // console.log(JSON.stringify(syntax, null, 2));
  }
});