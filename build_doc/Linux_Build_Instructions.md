# Building SB10 for Linux
This page is a guide to building the Linux SB10 (Secure Browser v.10) on your own build machine. Getting set up won't be difficult, but it can take a while due to the amount of data that needs to be downloaded. Even on a fast connection, this can take ten to fifteen minutes of work spread out over an hour, while the actual build will take two to four hours depends on your system hardware. Please note that the build steps documented here were tested on CentOS 7 64-bit and the hardware listed below. You can visit the Mozilla Linux prerequisites page for more details "https://developer.mozilla.org/en-US/docs/Mozilla/Developer_guide/Build_Instructions/Linux_Prerequisites".

## System Requirements (OS and Hardware)
  1. CentOS 7 64-bit.
  2. CPU 4, 16 GB RAM and 40 GB free disk space (adding more RAM will significantly decrease build time).

## Build Tools and Dependencies
  1. Make sure your system is up to date: `yum update`.
  2. Install development tools and libraries
`yum groupinstall 'Development Tools' 'Development Libraries'`.

### 64-Bit Build Dependencies
Following are the required build dependencies to build the Secure Browser 10 64-bit binary.

Install build tools using yum:
```
yum install wget gcc gtk2-devel gtk3-3.14.13-20.el7 gtk3-devel-3.14.13-20.el7 libXt libXt-devel libIDL libIDL-devel gstreamer gstreamer-devel gstreamer-plugins-base-devel dbus-glib dbus-glib-devel alsa-lib alsa-lib-devel pulseaudio-libs pulseaudio-libs-devel libnotify libnotify-devel autoconf213 binutils binutils-devel perl-Digest-SHA perl-Digest-SHA1 perl-Digest-MD5 GConf2 GConf2-devel
```
Install yasm:
```
wget ftp://rpmfind.net/linux/epel/7/x86_64/y/yasm-1.2.0-4.el7.x86_64.rpm
rpm -ivh yasm-1.2.0-4.el7.x86_64.rpm
```
Install latest Mercurial:
```
wget https://www.mercurial-scm.org/release/centos7/RPMS/x86_64/mercurial-3.9.2-1.x86_64.rpm
rpm -ivh mercurial-3.9.2-1.x86_64.rpm
```
Install RustUP for both 64 and 32 bit builds:
```
curl -f -L https://static.rust-lang.org/rustup.sh -O
sh rustup.sh --revision=1.16.0 --prefix=/usr/local/rustc/
sh rustup.sh --revision=1.16.0  --with-target=i686-unknown-linux-gnu --prefix=/usr/local/rustc32
```

## Install 32-Bit Build Dependencies
Following are the required build dependencies to build the Secure Browser 10 32-bit binary.

Install build tools using yum:

```
yum install libstdc++.i686 libstdc++-devel.i686 glibc.i686 glibc-devel.i686 gtk2.i686 gtk2-devel.i686 gtk3-3.14.13-20.el7.i686 gtk3-devel-3.14.13-20.el7.i686 libXt.i686 libXt-devel.i686 freetype.i686 freetype-devel.i686 fontconfig.i686 fontconfig-devel.i686 pkgconfig.i686 dbus-glib.i686 dbus-glib-devel.i686 alsa-lib.i686 alsa-lib-devel.i686 pulseaudio-libs.i686 pulseaudio-libs-devel.i686 libnotify.i686 libnotify-devel.i686 binutils-devel.i686 mesa-libGL.i686 GConf2.i686 GConf2-devel.i686 libxcb-devel.i686 libX11-devel.i686 libXext-devel.i686 atk.i686 atk-devel.i686 pango.i686  pango-devel.i686 gdk-pixbuf2.i686 gdk-pixbuf2-devel.i686 cairo-gobject.i686 cairo-gobject-devel.i686 zlib.i686 zlib-devel.i686 libXrender.i686 libXrender-devel.i686 libXdamage.i686 libXdamage-devel.i686 libXfixes.i686 libXfixes-devel.i686 libXcomposite.i686 libXcomposite-devel.i686 dbus-devel.i686
```

### SB10 Build Process

  * Create a folder named "buildfolder" under your home directory and change directory to buildfolder: `cd ~;mkdir buildfolder;cd buildfolder`.
  * Check out the Desktop Secure Browser project from this repository
  * Clone Mozilla source and build Secure Browser Binary:
      1. `cd securebrowser10`
      2. update appname.txt with required brand name. File path: mozilla/securebrowser/config/appname.txt.
      3. run `make -f securebrowser-client.mk checkout`. This command will clone the Mozilla central and prepares build files.

#### 64-bit Binary Build
```
make -f securebrowser-client.mk mozconfig-linux64 (Do not run this command to build 32 bit binary)
cd ./mozilla
./mach configure || { echo "...Make Error: failed to configure build..." ; exit 1; }
./mach build || { echo "...Make Error: failed to run build..." ; exit 1; }
cd ./../opt*/securebrowser
make distro || { echo " Make Error: distro failed, please verify build ...."; exit 1; }
```
#### 32-bit Binary Build

To build 32-bit binary build steps are same as 64-bit, except do not run the command "make -f securebrowser-client.mk mozconfig-linux64".

Once all commands have run successfully, the Secure Browser Linux artifact will be created on your desktop.