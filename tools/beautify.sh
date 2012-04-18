#!/bin/bash

cd ../
if [ -n "$1" ]; then
  files=$1
else
  DIRS=( src editors test templates dialogs cornfield config )
  files=`find ${DIRS[*]} -name '*.js'`
fi
touch tmp.txt
for word in $files
do
  python tools/jsbeautifier.py -s 2 -j -o tmp.txt --extra-expr-spacing=1 $word
  rm $word
  mv tmp.txt $word
  echo beautified $word
  # get rid of end of line comments
  sed -i '' -E 's/(};?) (\/\/*.*)/\1/g' $word
  # remove space after function and first round bracket
  sed -i '' -E 's/function \(/function(/g' $word
  # remove all end of line whitespace
  sed -i '' -E 's/ +$//g' $word
  echo regex ran on $word
done
