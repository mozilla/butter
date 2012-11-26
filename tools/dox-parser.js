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

function escapeString(str){
  return str.replace(/\</g, '&lt;').replace(/\>/g, '&gt;');
}

function processBlock(block){
  if(block.description.summary.indexOf(documentationPrefix) !== 0){
    return;
  }

  var path = block.description.summary.substr(documentationPrefix.length + 1).split('::');
  var name = path[path.length-1];

  var parentNode = rootNode;

  block._children = {};
  block._name = escapeString(name).replace(/_/g, '\\_');
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
  var signature;
  var usageString = '';
  var extraTagsString = '';
  var paramString = '';

  depth = depth || 1;

  if(node._name){

    if(node.ctx){
      usageString += 'Usage: ';
      if(node._usage){
        usageString += '`' + node._usage + '`';
      }
      else {
        var prefix = '';
        if(node._type === 'Class'){
          prefix = 'var ' + node.ctx.name[0].toLowerCase() + ' = new ';
        }
        else if(node.ctx.receiver){
          prefix = node._parent[0].toLowerCase() + node._parent.substr(1) + '.';
        }
        
        var argString = node._params.map(function(param){
          return param.name;
        }).join(', ');

        signature = node.ctx.name + '(' + argString +  ');';
        usageString += '`' + prefix + signature + '`';
      }

      usageString += '  \n';
    }
    else {
      signature = node._name;
    }

    if(node._params.length > 0){
      //paramString += 'Arguments:\n\n';
      node._params.forEach(function(param){
        paramString += '* __' + param.name + '__ ' + '[_' + param.types.join('_ or _') + '_]: ' + param.description + '  \n';
      });
      paramString += '  \n';
    }

    var extraTagsString = '';
    node.tags.forEach(function(tag){
      var prefix, suffix;
      if(ignoreTags.indexOf(tag.type) === -1){
        if(tag.type === 'see'){
          prefix = 'see';
          suffix = tag.local ? ('`' + tag.local + '`') : tag.url;
        }
        else if(tag.type === 'return'){
          prefix = 'return';
          suffix = '[_' + tag.types.join('_ or _') + '_] ' + tag.description;
        }
        else {
          prefix = tag.type;
          suffix = tag.string;
        }
        extraTagsString += '__' + prefix + '__: ' + suffix + '  \n';
      }
    });

    if(extraTagsString.length > 0){
      extraTagsString = '\n' + extraTagsString + '  \n\n';
    }


    output += depthHashes.substr(0, depth) + ' ';

    output += signature;
    if(node._type !== 'Property'){
      output += ' [_' + (node.isPrivate ? 'Private' : 'Public') + ' ' + node._type + '_]' + '\n';
    }
    else {
      output += ' [_' + (node._access ? node._access + ' ' : '' ) + 'Property_]' + '\n'; 
    }
    output += '\n';
    output += escapeString(node.description.body) + '\n';

    output += paramString + extraTagsString + usageString + '  \n';

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