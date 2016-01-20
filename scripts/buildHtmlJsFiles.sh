

#!/bin/sh
for filename in ../partials/*.html; do
  outFile="${filename//partials/gen/}"
  outFile="${outFile//.html/HTML1.js}"

  ../scripts/htmlIntoJs.sh "$filename" "$outFile"

  outFileFinal="${outFile//HTML1/HTML}"
  tr '\n' ' ' < $outFile > $outFileFinal
  rm $outFile
done
