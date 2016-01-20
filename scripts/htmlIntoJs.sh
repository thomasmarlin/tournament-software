#!/bin/sh

echo Sending contents of $1 into new file:  $2

# Grab the entire file contents into 'fileContents'
fileContents=`cat $1`

# Replace all single-quotes with double-quotes
fileContents="${fileContents//\"/\\\"}"

sourceFileName=$1
sourceFileName="${sourceFileName//.html/HTML}"
sourceFileName="${sourceFileName//..\/partials\//}"

# echo out the results into a new file of the correct name
echo "var $sourceFileName =\n \"$fileContents\"" > $2
