#/bin/sh

# THESE MUST BE SET
PASS="Enter Code Sign Password Here"
FILE="Enter pfx file name here"

MSI=$1;

if [ ! "$1" ]; then
  echo "usage: $0 <msi>";
  exit 0;
fi

cmd /c "signtool sign /f ${FILE} /p ${PASS} ${MSI}";

cmd /c "signtool verify /pa ${MSI}";




