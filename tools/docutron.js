var fs = require('fs');

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

function findEndOfBlockComment(data, startIndex){
  for(var i = startIndex, l = data.length; i < l; ++i){
    if(data.indexOf('*/', i) === i){
      return data.substring(startIndex, i);
    }
  }
}

function parseBlockComment(inputString){
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

function findBlockComments(data){
  var blockComment;
  var objectTreeDepth = 0;

  var objectTree = {comments:[], children: [], parent: null};
  var currentObject = objectTree;
  var tempObject;

  for(var i = 0, l = data.length; i < l; ++i){
    if(data.indexOf('/**$', i) === i){
      blockComment = findEndOfBlockComment(data, i + 5);
      i += blockComment.length;
      currentObject.comments.push(parseBlockComment(blockComment));
    }
    if(data.indexOf('//', i) === i){
      i = data.indexOf('\n', i);
    }
    if(i === -1){
      break;
    }
    if(data[i] === '{'){
      ++objectTreeDepth;
      tempObject = {
        comments: [],
        children: [],
        parent: currentObject
      };
      currentObject.children.push(tempObject);
      currentObject = tempObject;
    }
    else if(data[i] === '}'){
      --objectTreeDepth;
      tempObject = currentObject.parent;
      if(currentObject.comments.length === 0 && currentObject.children.length === 0){
        currentObject.parent.children.splice(currentObject.parent.children.indexOf(currentObject));
      }
      currentObject = tempObject;
    }
  }

  if(objectTree.comments.length === 0 && objectTree.children.length === 1){
    return objectTree.children[0];
  }

  return objectTree;
}

if(!inputFilename){
  console.log('Must supply an input filename.');
  console.log('Usage: docutron <input>');
  return;
}

fs.readFile(inputFilename, 'utf8', function(err, data){
  var objectTree;

  if(!err){
    objectTree = findBlockComments(data);
    console.log(objectTree);
    var mdString = generateMD(objectTree) + '\n';
    process.stdout.write(mdString);
  }
});