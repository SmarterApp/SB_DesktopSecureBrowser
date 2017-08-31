#test for pico2wav

# echo "SynthesizeToSpeech.sh";

# get arg list
# for f in "$@"
# do
#   echo arg: "$f";
# done

text="$1"
wav_file="$2";

# echo arg3: [$3];

if [ "$3" ]; then
  locale="-l $3";
fi

# echo pico2wave -w "$wav_file" "$locale" "$text";
pico2wave -w "$wav_file" $locale "$text";

exit 0;
