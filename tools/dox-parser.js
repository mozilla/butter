process.stdin.resume();
process.stdin.setEncoding('utf8');

var input = '';
var depthHashes = '##########################';
var documentationPrefix = 'Document:';

process.stdin.on('data', function(chunk){
  input += chunk;
});

var rootNode = {
  _children: {}
};

function processBlock(block){
  if(block.description.summary.indexOf(documentationPrefix) !== 0){
    return;
  }

  var path = block.description.summary.substr(documentationPrefix.length + 1).split('::');
  var name = path[path.length-1];

  var parentNode = rootNode;

  block._children = {};
  block._name = name.replace(/_/g, '\\_');
  block._params = [];
  block._parent = path[path.length-2] || '';

  block.tags.forEach(function(tag){
    if(tag.type === 'structure'){
      block._type = tag.string;
    }
    else if(tag.type === 'param'){
      block._params.push(tag);
    }
    else if(tag.type === 'usage'){
      block._usage = tag.string;
    }
    else if(tag.type === 'access'){
      block._access = tag.string;
    }
  });

  block._type = block._type || '';

  for(var i = 0, l = path.length - 1; i < l; ++i){
    parentNode = parentNode._children[path[i]] || parentNode;
  }

  parentNode._children[name] = block;
}

function generateMD(node, depth){
  var output = '';
  var ignoreTags = ['usage', 'structure', 'api', 'param'];

  depth = depth || 1;

  if(node._name){
    output += depthHashes.substr(0, depth) + ' ';
    if(node._type !== 'Property'){
      output += node._name + ' (_' + (node.isPrivate ? 'Private' : 'Public') + ' ' + node._type + '_)' + '\n';
    }
    else {
      output += node._name + ' (_' + (node._access ? node._access + ' ' : '' ) + 'Property_)' + '\n'; 
    }
    output += '\n';
    output += node.description.body + '\n';

    if(node._params.length > 0){
      output += 'Arguments:\n\n';
      node._params.forEach(function(param){
        output += '* __' + param.name + '__ ' + '[_' + param.types.join('_ or _') + '_]: ' + param.description + '\n';
      });
    }

    var extraTags = '';
    node.tags.forEach(function(tag){
      var prefix, suffix;
      if(ignoreTags.indexOf(tag.type) === -1){
        if(tag.type === 'see'){
          prefix = 'see';
          suffix = tag.local ? ('`' + tag.local + '`') : tag.url;
        }
        else if(tag.type === 'return'){
          prefix = 'return';
          suffix = '[_' + tag.types.join('_ or _') + '_] ' + tag.description + '\n';
        }
        else {
          prefix = tag.type;
          suffix = tag.string;
        }
        extraTags += '__' + prefix + '__: ' + suffix + '\n';
      }
    });

    if(extraTags.length > 0){
      output += '\n' + extraTags + '\n';
    }

    if(node.ctx){
      output += '\nUsage:\n\n';
      if(node._usage){
        output += '    ' + node._usage + '\n';
      }
      else {
        var prefix = '';
        if(node._type === 'Class'){
          prefix = 'var ' + node.ctx.name[0].toLowerCase() + ' = new ';
        }
        else if(node.ctx.receiver){
          prefix = (node.ctx.receiver === 'this' ? (node._parent[0].toLowerCase() + node._parent.substr(1)) : node.ctx.receiver) + '.';
        }
        
        var argString = node._params.map(function(param){
          return param.name;
        }).join(', ');

        output += '\n';
        output += '    ' + prefix + node.ctx.name + '(' + argString +  ');' + '\n';
        output += '\n';
      }
    }

    ++depth;
  }

  if(node._children){
    var properties = [];
    var nonProperties = [];
    Object.keys(node._children).forEach(function(childName){
      var child = node._children[childName];
      if(child._type === 'Property'){
        properties.push(child);
      }
      else {
        nonProperties.push(child);
      }
    });
    properties.concat(nonProperties).forEach(function(child){
      output += generateMD(child, depth);
    });
  }

  return output;
}

process.stdin.on('end', function(){
  var output = '';
  var jsonInput

  try{
    jsonInput = JSON.parse(input);
  }
  catch(e){
    process.stderr.write('Error parsing dox output');
    return;
  }

  process.stdout.write(output);

  if(jsonInput.length > 0){
    jsonInput.forEach(function(doxBlock){
      if(!doxBlock.ignore){
        processBlock(doxBlock);
      }
    });
    process.stdout.write(generateMD(rootNode));
  }
});