# Building SB10 for Windows

## Installing the build prerequisites:
  * Make sure you are running Windows 7 64bit .
  * Make sure your system is up-to-date through Windows Update.
    Control Panel >> System and Security >> Windows Update >> Check for Updates.
  * Once system is up to date, download and install ‘Visual Studio Community 2015 Update 3’ from Microsoft. Do not accept the default configuration. Instead, select Programming Languages > Visual C++ > Common Tools for Visual C++ 2015. This option is required for Rust (see Step #5). After Installation, be sure to Launch Visual studio 2015 from the GUI to complete the first time run procedure to associate this installation with an account.  Otherwise, you will be running an evaluation version which will not properly update via Windows Update.
  * Next, you need to download and install the Cumulative Servicing Release for Microsoft Visual Studio 2015 Update 3 (KB3165756). It might have already been installed part of step #2.
  * Install Rust. Rust version 1.17.0 is not compatible with this build. You can install either version 1.16.0 (validated and tested) or 1.15.0. To install 1.16.0 follow the steps below.
      1. Get rust exe from https://rustup.rs/
      2. Run the exe. As we are building the SB with 32 bit, DO not proceed with default installation instead select 2 (customization install) enter “i686-pc-windows-msvc” for default host triple, then go with default options. By default rust installed at “%userprofile% \.cargo\bin” with the latest available version(1.17.0)
      3. Open CMD and run “rustup override set 1.16.0” which overwrites the installed version with 1.16.0. 
      4. Go to folder “%userprofile% \.rustup\toolchains, delete the “stable-i686-pc-windows-msvc” folder and rename “1.16.0-i686-pc-windows-msvc” to “stable-i686-pc-windows-msvc”
      5. Create folder rust32 under c:/ and copy “%userprofile% \.cargo\bin” to “C:\rustc32\”
  * Download the [MozillaBuild](https://ftp.mozilla.org/pub/mozilla.org/mozilla/libraries/win32/MozillaBuildSetup-Latest.exe) Package from Mozilla. Accept the default settings, in particular the default installation directory: c:\mozilla-build\. On some versions of Windows an error dialog will give you the option to "reinstall with the correct settings", and you should agree and proceed.
  * Install makemsi. For MSI, you need to have [MakeMSI](http://dennisbareis.com/zips_fw/makemsi.zip) installed. This installs in C:\Program Files (x86). Once this is done, apply build customization to this by exploding MakeMSI-Modified.zip on top of the installation of the MakeMSI. Create a file named .profile in the user’s home directory and point the makemasi path to it “PATH=~/bin:/c/Program\ Files\ \(x86\)/MakeMsi/:$PATH; export PATH” .
  * Install the [June 2010 DirectX SDK](https://www.microsoft.com/en-us/download/details.aspx?id=6812).

##Build Process:
  * Launch  the `start-shell-msvc2015` (for 32 bit build) batch file under C:\mozilla-build which, This will launch an MSYS/BASH command prompt properly configured to build one of the aforementioned code bases. All further commands should be executed in this command prompt window. (Note that this is not the same as what you get with the Windows CMD.EXE shell.)
  * Create folder name "buildfolder" under C:/ and change directory to buildfolder. `cd c:/;mkdir buildfolder;cd buildfolder`
  * Check out the Desktop Secure Browser project from this repository
  * Clone Mozilla source and build Secure Browser MSI:
      1. `cd securebrowser10`
      2. update appname.txt with required brand name. File path : mozilla/securebrowser/config/appname.txt.
      3. run `make –f  securebrowser-client.mk checkout`. This command will clone the Mozilla central and prepares build files.
      4. `cd ./mozilla`
      5. `mach build || { echo "...Make Error: failed to run build..." ; exit 1; }` #this might take more than 90 mins depending on your system resources.
      6. `cd ./../opt*/securebrowser`
      7. `mozmake msi || { echo " MSI Build failed, please verify build ...."; exit 1; }`
  * SB msi file will be created on your desktop