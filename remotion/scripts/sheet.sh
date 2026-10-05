#!/bin/zsh
# foglio di controllo: sheet.sh out.jpg a.png b.png ... (affiancati a 432x768)
out=$1; shift
ins=(); fl=""; i=0
for f in "$@"; do ins+=(-i "$f"); fl+="[$i:v]scale=432:768[a$i];"; i=$((i+1)); done
st=""; for j in $(seq 0 $((i-1))); do st+="[a$j]"; done
ffmpeg -v error -y "${ins[@]}" -filter_complex "${fl}${st}hstack=$i" -q:v 3 $out
