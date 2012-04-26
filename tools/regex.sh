#!/bin/bash

# get rid of end of line comments
sed -i '' -E 's/(};?) (\/\/*.*)/\1/g' $1
# remove space after function and first round bracket
sed -i '' -E 's/function \(/function(/g' $1
# remove all end of line whitespace
sed -i '' -E 's/ +$//g' $1
echo regex ran on $1
