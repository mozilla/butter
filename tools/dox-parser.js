process.stdin.resume();
process.stdin.setEncoding('utf8');

var input = '';

process.stdin.on('data', function(chunk){
  input += chunk;
});

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
    console.log(jsonInput[2]);
    return;
    jsonInput.forEach(function(doxBlock){
      if(!doxBlock.ignore){
        console.log(doxBlock);
      }
    });
  }
});