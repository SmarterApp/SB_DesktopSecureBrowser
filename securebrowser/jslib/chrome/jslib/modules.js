/** 
 * jslib module identifiers
 */

// insure jslib base is loaded
if (typeof(JS_LIB_LOADED)=='boolean') 
{

  var JS_MODULES_LOADED        = true;
  var JS_MODULES_FILE          = "modules.js";
  
  // help identifier
  var jslib_help = "need to write some global help docs here\n";
  
  // Library Identifiers
  
  // io library modules
  var jslib_io         = JS_LIB_PATH+'io/io.js';
  var jslib_filesystem = JS_LIB_PATH+'io/filesystem.js'
  var jslib_file       = JS_LIB_PATH+'io/file.js';
  var jslib_fileutils  = JS_LIB_PATH+'io/fileUtils.js';
  var jslib_dir        = JS_LIB_PATH+'io/dir.js';
  var jslib_dirutils   = JS_LIB_PATH+'io/dirUtils.js';
  var jslib_chromefile = JS_LIB_PATH+'io/chromeFile.js';
  
  // data structures
  var jslib_dictionary       = JS_LIB_PATH+'ds/dictionary.js';
  var jslib_chaindictionary  = JS_LIB_PATH+'ds/chainDictionary.js';
  
  // RDF library modules
  var jslib_rdf           = JS_LIB_PATH+'rdf/rdf.js';
  var jslib_rdfbase       = JS_LIB_PATH+'rdf/rdfBase.js';
  var jslib_rdffile       = JS_LIB_PATH+'rdf/rdfFile.js';
  var jslib_rdfcontainer  = JS_LIB_PATH+'rdf/rdfContainer.js';
  var jslib_rdfresource   = JS_LIB_PATH+'rdf/rdfResource.js';
  var jslib_rdfmemory     = JS_LIB_PATH+'rdf/inMemoryRDF.js';
  
  // network library modules
  var jslib_remotefile   = JS_LIB_PATH+'network/remoteFile.js';
  var jslib_socket       = JS_LIB_PATH+'network/socket.js';
  var jslib_networkutils = JS_LIB_PATH+'network/networkUtils.js';
  
  // network - http
  var jslib_http                = JS_LIB_PATH+'network/http.js';
  var jslib_getrequest          = JS_LIB_PATH+'network/getRequest.js';
  var jslib_postrequest         = JS_LIB_PATH+'network/postRequest.js';
  var jslib_multipartrequest    = JS_LIB_PATH+'network/multipartRequest.js';
  var jslib_filepart            = JS_LIB_PATH+'network/parts/filePart.js';
  var jslib_textpart            = JS_LIB_PATH+'network/parts/textPart.js';
  var jslib_urlparameterspart   = JS_LIB_PATH+'network/parts/urlParametersPart.js';
  var jslib_bodyparameterspart  = JS_LIB_PATH+'network/parts/bodyParametersPart.js';
  
  // xul dom library modules
  var jslib_dialog      = JS_LIB_PATH+'xul/commonDialog.js';
  var jslib_filepicker  = JS_LIB_PATH+'xul/commonFilePicker.js';
  var jslib_window      = JS_LIB_PATH+'xul/commonWindow.js';
  var jslib_routines    = JS_LIB_PATH+'xul/appRoutines.js';
  
  // sound library modules
  var jslib_sound = JS_LIB_PATH+'sound/sound.js';
  
  // utils library modules
  var jslib_date        = JS_LIB_PATH+'utils/date.js';
  var jslib_dom         = JS_LIB_PATH+'utils/dom.js';
  var jslib_packageinfo = JS_LIB_PATH+'utils/packageInfo.js';
  var jslib_prefs       = JS_LIB_PATH+'utils/prefs.js';
  var jslib_profile     = JS_LIB_PATH+'utils/profile.js';
  var jslib_validate    = JS_LIB_PATH+'utils/validate.js';
  var jslib_sax         = JS_LIB_PATH+'utils/sax.js';
  var jslib_system      = JS_LIB_PATH+'utils/system.js';
  var jslib_uuid        = JS_LIB_PATH+'utils/uuid.js';
  var jslib_xpcom       = JS_LIB_PATH+'utils/xpcom.js';
  
  // zip
  var jslib_zip  = JS_LIB_PATH+'zip/zip.js';
  
  // install/uninstall
  var jslib_install    = JS_LIB_PATH+'install/install.js';
  var jslib_uninstall  = JS_LIB_PATH+'install/uninstall.js';
  var jslib_autoupdate = JS_LIB_PATH+'install/autoupdate.js';
  
  jslibLoadMsg(JS_MODULES_FILE);
  
} else { dump("Load Failure: modules.js\n"); }
  
