#!/bin/bash

cd ../
DIRS=( src editors test templates )
files=`find $DIRS -name '*.js'`
touch tmp.txt
for word in $files
do
  python tools/jsbeautifier.py -s 2 -j -o tmp.txt $word
  rm $word
  mv tmp.txt $word
  echo beautified $word
  # get rid of end of line comments
  sed -i '' -E 's/(};?) (\/\/*.*)/\1/g' $word
  # add whitespace after left round bracket
  sed -i '' -E 's/\(([^){])/\( \1/g' $word
  # add whitespace after right round bracket
  sed -i '' -E 's/([^(}])\)/\1 \)/g' $word
  # add whitespace after first and last square bracket
  sed -i '' -E 's/\[(.*)\]/\[ \1 \]/g' $word
  # add space between last round bracket and first curly bracket
  sed -i '' -E 's/){/) {/g' $word
  # remove space after function and first round bracket
  sed -i '' -E 's/function \(/function(/g' $word
  # remove all end of line whitespace
  sed -i '' -E 's/ +$//g' $word
  echo regex ran on $word
done
