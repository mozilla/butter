#!/bin/bash

FILE1=./test/beautifier/${1}
FILE2=./test/beautifier/${2}
touch tmp.txt
python ./tools/jsbeautifier.py -s 2 -j -o tmp.txt --extra-expr-spacing=1 $FILE1
bash tools/regex.sh tmp.txt
echo `diff tmp.txt $FILE2`
