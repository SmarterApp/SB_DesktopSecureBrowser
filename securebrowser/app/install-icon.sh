#!/bin/bash

# Installs shortcut to the browser on the desktop

# First, lets figure out where the browser is actually installed
# This cumbersome method handles cases where the script is run
# by clicking, by going to terminal, by using a sym-link to the script
# etc.

# SCRIPT_PATH="${BASH_SOURCE[0]}";

SCRIPT_PATH="$0";
WD=`pwd`

if([ -h "${SCRIPT_PATH}" ]) then
   while([ -h "${SCRIPT_PATH}" ]) do SCRIPT_PATH=`readlink "${SCRIPT_PATH}"`; done
fi
pushd . > /dev/null
cd `dirname ${SCRIPT_PATH}` > /dev/null
SCRIPT_PATH=`pwd`
popd > /dev/null

# Now we know where we are installed. Lets create the shortcut.
INSTALLDIR=${SCRIPT_PATH};
DESKTOP=~/Desktop;
ARCH=`/bin/uname -p`

SHORTCUT=%APP_NAME%.desktop;

touch ${DESKTOP}/${SHORTCUT};
chmod a+rx ${DESKTOP}/${SHORTCUT};

echo "[Desktop Entry]"                            > ${DESKTOP}/${SHORTCUT};
echo "Encoding=UTF-8"                            >> ${DESKTOP}/${SHORTCUT};
echo "Version=8.0"                     >> ${DESKTOP}/${SHORTCUT};
echo "Type=Application"                          >> ${DESKTOP}/${SHORTCUT};
echo "Terminal=false"                            >> ${DESKTOP}/${SHORTCUT};
echo "Exec=$INSTALLDIR/%APP_NAME%.sh"            >> ${DESKTOP}/${SHORTCUT};
echo "Icon=$INSTALLDIR/securebrowser.png"                >> ${DESKTOP}/${SHORTCUT};
echo "Name=%APP_NAME%"                           >> ${DESKTOP}/${SHORTCUT};

if [ "$1" = "-i" ]; then
  echo "icon only installed...";
  exit 0;
fi

# If SELINUX is running, we need to set the security context for 
# one of our libs - otherwise, the browser won't launch.
if [ -e /selinux/enforce ]; then
   chcon -t texrel_shlib_t ${INSTALLDIR}/libxul.so   
fi

# install SOX

ARCH=`/bin/uname -p`

which yum > /dev/null 2>&1;

if [ $? -eq 0  ]; then 
  echo Installing Secure Browser dependencies...;

  sudo yum -y update sox glibc gtk2 alsa-lib dbus-glib libXt readline alsa-plugins-pulseaudio;

  wait;

  sudo yum -y install sox glibc gtk2 alsa-lib dbus-glib libXt readline alsa-plugins-pulseaudio;

  wait;

  # install pico2wave
  sudo yum -y install binutils wget;
  sudo ./picotts-install.sh;

  exit 0;
fi

which apt-get > /dev/null 2>&1;

if [ $? -eq 0  ]; then 
  echo Installing Secure Browser dependencies...;
  echo;

  # install pico2wave on Debian systems
  sudo apt-get -y install libttspico0 libttspico-utils libttspico-data;
  # install picospeaker
  sudo install -D -m755 picospeaker /usr/bin/picospeaker;

  if [ "${ARCH}" = "x86_64" ]; then
    sudo apt-get -y install sox libasound2 libasound2-plugins libdbus-glib-1-2 libreadline6 libgtk2.0;
  else
    sudo apt-get -y install sox libstdc++6 libasound2 libasound2-plugins libdbus-glib-1-2 libreadline6 libgtk2.0;
  fi

  exit 0;
fi

which zypper > /dev/null 2>&1;

if [ $? -eq 0  ]; then 
  echo Installing Secure Browser dependencies...;

  sudo zypper -n install sox glibc dbus-1-glib gtk2-tools libXt6 libreadline6 libgthread-2_0-0;

  # install pico2wave
  sudo zypper -n install binutils wget;
  sudo ${WD}/./picotts-install.sh;
fi

exit 0;

