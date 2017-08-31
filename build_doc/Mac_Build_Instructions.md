# Building SB10 for Mac

## System prerequisites:
  * Make sure you are running MacOS 10.10 and SDK 10.9. For minimum hardware requirements visit [Mac OS X Prerequisites](https://developer.mozilla.org/en-US/docs/Mozilla/Developer_guide/Build_Instructions/Mac_OS_X_Prerequisites).
  * Install Python version 2.7.11 and latest mercurial using dmg package.
  * Download and install XCode 6.2 and commandline tools for XCode 6.2.
  * Run `sudo xcode-select -switch /Applications/Xcode.app` to point to installed XCode version
  * Perform the one line setup using the following command to install build prerequisites and follow the prompts. If bootstrap fails initially, try once more: `sudo curl https://hg.mozilla.org/mozilla-central/raw-file/default/python/mozboot/bin/bootstrap.py > bootstrap.py && python bootstrap.py`
      1. It will prompt with options as follows for Firefox type: Type 2 for desktop
        * Firefox for Desktop Artifact Mode
        * Firefox for Desktop
        * Firefox for Android Artifact Mode
        * Firefox for Android
      2. Select `homebrew` when prompted by the installer to pick either Homebrew or Ports.
      3. Several other prompts will follow, like configuring mercurial - retain the defaults.
  * Install autoconf `brew install autoconf@2.13`.
  * Install tools `brew install yasm gawk ccache wget`
  * Install latest clang `brew install llvm`. Add clang path to .bash_profile file `export PATH=/usr/local/Cellar/llvm/4.0.1/bin:$PATH`. Check the installed version and update the path accordingly.
  * Install rust version 1.16.0.
      1. Download rust script using `curl -f -L https://static.rust-lang.org/rustup.sh -O`.
      2. Install 64 bit rust `sh rustup.sh --revision=1.16.0 --prefix=/usr/local/rustc`.     
      3. Install 32 bit rust `sh rustup.sh --revision=1.16.0 --prefix=/usr/local/rustc32 --with-target=i686-apple-darwin`.

## Build Process:

  * Create folder name "buildfolder" under your home directory and change directory to buildfolder. `cd ~;mkdir buildfolder;cd buildfolder`
  * Check out the Desktop Secure Browser project from this repository
  * Clone Mozilla source and Build Secure Browser DMG:
      1. `cd securebrowser10`
      2. update appname.txt with required brand name. File path: securebrowser/config/appname.txt.
      3. run `make –f  securebrowser-client.mk checkout` . This will clone the Mozilla central and prepares the build files.
      4. Update the MAC OS SDK 10.9 path in "securebrowser/config/mozconfig.Darwin.universal" file (for variables:mk_add_options HOST_CXXFLAGS, ac_add_options --with-macos-sdk and export HOST_CXXFLAGS) or create a symlink to path "/Developer/SDKs/MacOSX10.9.sdk". In the same file you can also customize the rust and cargo installation paths.
      5. Run following commands to build MAC SB DMG
         
`````
./mach configure
./mach build || { echo "...Make Error: failed to run build..." ; exit 1; }
cd ./../opt*/i386/securebrowser
make || { echo " Make Error: 386 make build failed at first run"; exit 1;  }
make || { echo " Make Error: 386 make build failed at first run"; exit 1;  } Yes, needs to be run twice.
cd ./../../x86_64/securebrowser
make || { echo " Make Error: x86_64 make build failed at first run"; exit 1;  }
make || { echo " Make Error: x86_64 make build failed at first run"; exit 1;  }
cd ./../../../mozilla; cd ./../opt*/i386/securebrowser
Build distro `make distro || { echo " Make Error: distro failed, please verify build ...."; exit 1; }
`````
  * Once all commands have run successfully, the Secure Browser Mac DMG artifact will be created on your desktop.