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
  bash tools/regex.sh $word
  echo regex ran on $word
done
