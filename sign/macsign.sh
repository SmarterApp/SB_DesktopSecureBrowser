#!/bin/sh

# MUST SET CODESIGN ID HERE
ID="Enter Codesign ID Here"

if [ ! $1 ]; then
  echo "    Usage: $0 <file.dmg>";
  exit 1;
fi

appname=`echo $1 | cut -f1 -d. | sed 's/\(.*[a-z]\)\(.*\)/\1/'`
name=`echo $1 | sed -e 's:.dmg::g'`;

# text decoration
bold=`tput bold`
normal=`tput sgr0`
green='\033[0;32m'
red='\033[0;31m'
NC='\033[0m' # No Color

dmgname=$name-signed.dmg;

rm -rf $appname.app;

hdiutil mount $1;

cp -RH /Volumes/$appname .;

wait;

hdiutil unmount /Volumes/$appname;

mv $appname /Volumes;

if [ $? -ne 0 ]; then
  echo Must change permission of /Volumes folder to writable
  sudo chmod 777 /Volumes;
  wait;
fi

rm -f /Volumes/$appname/$appname.app/precomplete

echo "Signing package [$appname.app]";

# This is not necessary for me but *might* be necessary on another box
export CODESIGN_ALLOCATE="/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/codesign_allocate";

pushd /Volumes/$appname/;

# this "folder" is breaking signing...
rm -rf $appname.app/Contents/MacOS/res/MainMenu.nib;

find . | xargs xattr -c;
wait;

codesign --timestamp=none --deep -f -v -s "$ID" $appname.app;

if [ $? -eq 0 ]; then
  echo "Package [$appname.app] ${bold}${green}successfully signed...${NC}${normal}";
else
  echo "Package [$appname.app] ${bold}${red}not successfully signed...${NC}${normal}";
  rm -rf /Volumes/$appname/;
  exit 1;
fi

codesign -v $appname.app;

popd;

echo "Creating dmg file[$dmgname]...";

hdiutil create $dmgname -srcfolder /Volumes/$appname -ov;

wait;

rm -rf /Volumes/$appname;

hdiutil attach -owners on $dmgname -shadow;

wait;

SetFile -a C /Volumes/$appname/;

hdiutil detach /Volumes/$appname;

wait;

hdiutil convert -format UDZO -o .$dmgname $dmgname -shadow;

wait;

mv .$dmgname $dmgname;

rm -f *.shadow;

echo "Signing dmg...";

codesign -s "$ID" $dmgname

codesign -v $dmgname;

if [ $? -eq 0 ]; then
  echo "dmg [$dmgname] ${bold}${green}successfully signed...${NC}${normal}";
else
  echo "dmg [$dmgname] ${bold}${red}not successfully signed...${NC}${normal}";
fi

exit 0;
