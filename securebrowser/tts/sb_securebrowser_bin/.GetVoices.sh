#test for pico2wav

text="$1"
wav_file="$2";

pico2wave -w /tmp/foo.wav -l help 2>&1 | grep [a-z]-[A-Z] | sed '$d';

exit 0;
