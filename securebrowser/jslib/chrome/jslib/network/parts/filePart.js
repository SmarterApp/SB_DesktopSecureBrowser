/*** -*- Mode: Javascript; tab-width: 2;
The contents of this file are subject to the Mozilla Public
License Version 1.1 (the "License"); you may not use this file
except in compliance with the License. You may obtain a copy of
the License at http://www.mozilla.org/MPL/
                                                                                                    
Software distributed under the License is distributed on an "AS
IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
implied. See the License for the specific language governing
rights and limitations under the License.
                                                                                                    
The Original Code is jslib code.
The Initial Developer of the Original Code is jslib team.
                                                                                                    
Portions created by jslib team are
Copyright (C) 2000 jslib team.  All
Rights Reserved.
                                                                                                    
Contributor(s): Rajeev J Sebastian <rajeev_jsv@yahoo.com)> (original author)
                                                                                                    
*************************************/


if (typeof(JS_LIB_LOADED)=='boolean') {

var JS_FILEPART_FILE     = "filePart.js";
var JS_FILEPART_LOADED   = true;

function FilePart() {
}

FilePart.prototype = {
  _name: null,
  _file: null,
  _cnttype: null,

  setFile: function( name, jsFile, contenttype ) {
    this._name = name;
    this._cnttype = contenttype;
    this._file = jsFile.nsIFile;
  },

  //not applicable
  _getRequestUriParams: function() {
    return null;
  },

  _getRequestHeaders: function() {
    var list = new Dictionary();
    list.put("Content-type",_cnttype);
    if( _name != null )
      list.put("Content-disposition","form-data; name=\""+_name+"\";");
    return list;
  },

  _getBody: function() {
    var nsIFileInStrm = Components.interfaces.nsIFileInputStream;
    var nsIBufInStrm = Components.interfaces.nsIBufferedInputStream;

    var finstrm =
        Components.classes["@mozilla.org/network/file-input-stream;1"].
            createInstance( nsIFileInStrm );
    finstrm.init(_file, 1, 1, finstrm.CLOSE_ON_EOF);

    this.instrm =
        Components.classes["@mozilla.org/network/buffered-input-stream;1"].
            createInstance( nsIBufInStrm );
    this.instrm.init(finstrm, 4096);

    return fstrm;
  }
}

jslibDebug('*** load: '+JS_FILEPART_FILE+' OK');

} // END BLOCK JS_LIB_LOADED CHECK

// If jslib base library is not loaded, dump this error.
else {
   dump("JS_BASE library not loaded:\n"
        + " \tTo load use: chrome://jslib/content/jslib.js\n"

        + " \tThen: include(jslib_filepart);\n\n");

};
