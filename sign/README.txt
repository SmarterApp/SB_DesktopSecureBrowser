To automate codesign on Windows

  a. Edit the file "sign-win32.sh" and fill in the two variables

    1. PASS - Code Sign PASSWORD

    2. FILE - PFX File Name 

Example:

  PASS="MY CodeSign Password"
  FILE="my.pfx"


To run, open up a bash terminal and run the script 

  $ sh sign-win32.sh myFile.msi


To codesign on OSX

  a. Edit the file "macsign.sh" and fill in the variable

    1. ID - Code Sign ID


Example:

  ID="MY CodeSign ID"

To run, open up a terminal and run the script 

  $ ./macsign.sh myFile.dmg

