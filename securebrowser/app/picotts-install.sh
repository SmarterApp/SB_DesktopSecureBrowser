#!/bin/bash

# Installer for SVOX Pico TTS on non-Debian platforms
# Author: Steven Mirabito <smirabito@csh.rit.edu>

# Check architechure
arch=`uname -m`

if [ "$arch" == "x86_64" ]
then
    pkgarch="amd64"
else
    pkgarch="i386"
fi

# Get work directories set up
pushd /usr/src
mkdir -p libttspico

# Download and extract Pico TTS libraries
wget http://mirrors.kernel.org/ubuntu/pool/multiverse/s/svox/libttspico0_1.0%2bgit20130326-3_${pkgarch}.deb
ar x libttspico0_1.0+git20130326-3_${pkgarch}.deb data.tar.xz
tar -xf data.tar.xz -C "libttspico"
rm -f data.tar.xz

# Dowload and extract Pico TTS voice data
wget http://mirrors.kernel.org/ubuntu/pool/multiverse/s/svox/libttspico-data_1.0%2bgit20130326-3_all.deb
ar x libttspico-data_1.0+git20130326-3_all.deb data.tar.xz
tar -xf data.tar.xz -C "libttspico"
rm -f data.tar.xz

# Download and extract Pico TTS utilities (pico2wave)
wget http://mirrors.kernel.org/ubuntu/pool/multiverse/s/svox/libttspico-utils_1.0%2bgit20130326-3_${pkgarch}.deb
ar x libttspico-utils_1.0+git20130326-3_${pkgarch}.deb data.tar.xz
tar -xf data.tar.xz -C "libttspico"
rm -f data.tar.xz

# Delete packages
rm -f libttspico*.deb

# copy files into place
cp -r "libttspico/usr/lib/"*-linux-gnu/* "libttspico/usr/lib"
rm -rf "libttspico/usr/lib/"*-linux-gnu
cp -r libttspico/usr/bin/* /usr/bin/
cp -r libttspico/usr/lib/* /usr/lib/
cp -r libttspico/usr/share/pico /usr/share/
cp -r libttspico/usr/share/doc/* /usr/share/doc/
cp -r libttspico/usr/share/man/man1/* /usr/share/man/man1/

# Install picospeaker
popd;
install -D -m755 picospeaker /usr/bin/picospeaker

# run ldconfig to rebuild library cache
ldconfig;

rm -rf /usr/src/libttspico;

exit 0;

