let FOO = "BAR";

if (typeof(JS_LIB_LOADED) == "undefined") 
{
  try 
  {
  
    var JS_LIB_LOADED = true;
  
    var JS_LIBRARY = "jslib";
    var JS_LIB_FILE = "jslib.js";
    var JS_LIB_PATH = "chrome://jslib/content/";
    var JS_LIB_VERSION = "0.1.375";

    var JS_LIB_AUTHORS = "\tPete Collins       <pete@mozdevgroup.com>\n" +
      "\tNeil Deakin        <neil@mozdevgroup.com>\n"            +
      "\tBrian King         <brian@mozdevgroup.com>\n"           +
      "\tEric Plaster       <plaster@urbanrage.com>\n"           +
      "\tMartin.T.Kutschker <Martin.T.Kutschker@blackbox.net>\n" +
      "\tAlex Vincent       <ajvincent@gmail.com>\n";


    var JS_LIB_BUILD = "mozilla 1.3+";

    var JS_LIB_ABOUT = "\tThis is an effort to provide a fully " +
                          "functional js library\n"                +
                          "\tfor mozilla package authors to use "  +
                          "in their applications\n";

    var JS_LIB_HOME = "http://jslib.mozdev.org/";
  
    var JS_LIB_ON = true;
    var JS_LIB_OFF = false;
  
    // DEPRICATED
    if (typeof(C) == "undefined")
      var C                 = Components;
  
    var jsC = Components;
    var jslibRes = jsC.results;
    var jslibI = jsC.interfaces;
    var jslibCls = jsC.classes;
  
    var JS_LIB_OK = jslibRes.NS_OK;
    var JS_LIB_VOID = void(null);
    
    // DEPRICATED
    var jslib_results = jslibRes;
  
    if (typeof(JS_LIB_DEBUG) != "boolean")
      var JS_LIB_DEBUG      = JS_LIB_OFF;
  
    var JS_LIB_VERBOSE      = JS_LIB_OFF;
    var JS_LIB_DEBUG_ALERT  = JS_LIB_OFF;
    var JS_LIB_ERROR        = JS_LIB_ON;
    var JS_LIB_ERROR_ALERT  = JS_LIB_OFF;
  
      var JS_LIB_HELP = "\n\nWelcome to jslib version "+JS_LIB_VERSION+"\n\n" +
      "Global Constants:\n\n" +
      "JS_LIBRARY     \n\t"+JS_LIBRARY     +"\n"    +
      "JS_LIB_FILE    \n\t"+JS_LIB_FILE    +"\n"    +
      "JS_LIB_PATH    \n\t"+JS_LIB_PATH    +"\n"    +
      "JS_LIB_VERSION \n\t"+JS_LIB_VERSION +"\n"    +
      "JS_LIB_AUTHORS \n"  +JS_LIB_AUTHORS          +
      "JS_LIB_BUILD   \n\t"+JS_LIB_BUILD   +"\n"    +
      "JS_LIB_ABOUT   \n"  +JS_LIB_ABOUT            +
      "JS_LIB_HOME    \n\t"+JS_LIB_HOME    +"\n\n"  +
      "Global Variables:\n\n"                       +
      "  JS_LIB_DEBUG\n  JS_LIB_ERROR\n\n";
  
  
    function 
    jslibGetService (aURL, aInterface) 
    {
      var rv;
      try {
        // determine how 'aInterface' is passed and handle accordingly
        switch (typeof(aInterface))
        {
          case "object":
            rv = jsC.classes[aURL].getService(aInterface);
            break;
  
          case "string":
            rv = jsC.classes[aURL].getService(jsC.interfaces[aInterface]);
            break;
       
          default:
            rv = jsC.classes[aURL].getService();
            break;
        }
      } catch (e) { rv = jslibError(e); }
  
      return rv;
    }
  
    function 
    jslibCreateInstance (aURL, aInterface) 
    {
      var rv;
      try {
        rv = jsC.classes[aURL].createInstance(jsC.interfaces[aInterface]);
      } catch (e) { rv = jslibError(e); }
  
      return rv;
    }
   
    function 
    jslibGetInterface (aInterface) 
    {
      var rv;
      try {
        rv = jsC.interfaces[aInterface];
      } catch (e) { rv = jslibError(e); }
  
      return rv;
    }
   
    function 
    jslibQI (aObj, aInterface)
    {
      try {
        return aObj.QueryInterface(jslibI[aInterface]);
      } catch (e) { return jslibError(e); }
    }
   
    function 
    jslibConstructor (aCID, aInterface, aFunc)
    {
      try {
        if (aFunc)
          return new jsC.Constructor(aCID, aInterface, aFunc);
        else
          return new jsC.Constructor(aCID, aInterface);
      } catch (e) { return jslibError(e); }
    }
   
    /**
     * void include(aScriptPath)
     * aScriptPath is an argument of string lib chrome path
     * returns NS_OK on success, 1 if file is already loaded and
     * - errorno or throws exception on failure
     *   eg:
     *       var path='chrome://jslib/content/io/file.js';
     *       include(path);
     *  Or:
     *       include(jslib_file);
     *
     *   outputs: void(null)
     */
  
    function include (aScriptPath) 
    {
      if (!aScriptPath) {
  			if (JS_LIB_DEBUG) debug("include: Missing file path argument");
        throw - jslibRes.NS_ERROR_XPC_NOT_ENOUGH_ARGS;
      }
  
      if (aScriptPath == JS_LIB_PATH+JS_LIB_FILE) {
        if (JS_LIB_DEBUG) debug("include: ", aScriptPath, "is already loaded!");
        throw - jslibRes.NS_ERROR_INVALID_ARG;
      }
  
      var start   = aScriptPath.lastIndexOf('/') + 1;
      var end     = aScriptPath.lastIndexOf('.');
      var slice   = aScriptPath.length - end;
      var loadID  = aScriptPath.substring(start, (aScriptPath.length - slice));
  
      if (typeof(this['JS_'+loadID.toUpperCase()+'_LOADED']) == "boolean")
        return JS_LIB_OK;
  
      var rv;
      try {
        if (jslibNeedsPrivs())
          netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
  
        if (!checkXPCShell())
          jslibGetService("@mozilla.org/moz/jssubscript-loader;1", 
                          "mozIJSSubScriptLoader").loadSubScript(aScriptPath);
        else
          xpcShellLoad(aScriptPath);
  
        rv = jslibRes.NS_OK;
        if (JS_LIB_VERBOSE) debug("include: ", aScriptPath);
      } catch (e) {
        var msg = aScriptPath+" is not a valid path or is already loaded\n";
        if (JS_LIB_DEBUG) {
  			  debugError(e);
          debug("include: ", msg);
  			}
        rv = - jslibRes.NS_ERROR_INVALID_ARG;
      }
  
      return rv;
    }
  
    function jslibNeedsPrivs ()
    {
      var rv;
      if (typeof(this.location) == "object") {
        var proto = this.location.protocol;
        rv = (proto == "file:")
      }
      return rv;
    }
  
    function 
    checkXPCShell () 
    {
      return (typeof(clear) == "function"   &&
              typeof(gc) == "function"      &&
              typeof(debugXPC) == "function" &&
              typeof(build)   == "function" &&
              typeof(clear)   == "function" &&
              typeof(load) == "function");
  
    }
  
    // this is a work around for bug #209045
    // https://bugzilla.mozilla.org/show_bug.cgi?id=209045
    function 
    xpcShellLoad (aURL) 
    {
      var localFile = aURL.replace(/:\/|content\//g, "");
      debug("xpcShell loading ... ", localFile);
      load(localFile);
    }
  
    // include debug methods
    var jslib_debug = JS_LIB_PATH+"debug/debug.js"
    include(jslib_debug);
  
    function jslibUninstall (aPackage, aCallback)
    {
      if (!aPackage) {
        jslibErrorWarn("NS_ERROR_XPC_NOT_ENOUGH_ARGS");
        throw - jslibRes.NS_ERROR_INVALID_ARG;
      }
  
      include (jslib_window);
      var win = new CommonWindow(null, 400, 400);
      win.position = JS_MIDDLE_CENTER;
      win.openUninstallWindow(aPackage, aCallback);
    }
  
    /**
     * Launch JSLIB Splash 
     */
    function jslibLaunchSplash ()
    {
      include (jslib_window);
      var win = new CommonWindow("chrome://jslib/content/splash.xul", 400, 220);
      win.position = JS_MIDDLE_CENTER;
      win.openSplash();
    }
  
    function jslibLaunchConsole ()
    {
      include (jslib_window);
      var win = new CommonWindow("javascript:", 400, 220);
      win.position = JS_MIDDLE_CENTER;
      win.open();
    }
  
    function jslibTurnDumpOn () 
    {
      include (jslib_prefs);
      // turn on debug
      var pref = new Prefs;
      var prefStr = "browser.dom.window.debug.enabled"
  
      // turn debug on if not enabled
      if (!pref.getBool(prefStr)) {
        pref.setBool(prefStr, true);
        pref.save();
      } 
  
      return;
    }
  
    // DEPRICATED
    var jslib_turnDumpOn = jslibTurnDumpOn;
  
    function jslibTurnDumpOff () 
    {
      include (jslib_prefs);
      // turn off debug
      var pref = new Prefs;
      var prefStr = "browser.dom.window.debug.enabled"
  
      // turn debug off if enabled
      if (pref.getBool(prefStr)) {
        pref.setBool(prefStr, false);
        pref.save();
      } 
  
      return;
    }
  
    // DEPRICATED
    var jslib_turnDumpOff = jslibTurnDumpOff;
  
    function jslibTurnStrictOn () 
    {
      include (jslib_prefs);
      // turn on debug
      var pref = new Prefs;
      var prefStr = "javascript.options.strict";
  
      // turn debug on if not enabled
      if (!pref.getBool(prefStr)) {
        pref.setBool(prefStr, true);
        pref.save();
      } 
      return;
    }
  
    function jslibTurnStrictOff () 
    {
      include (jslib_prefs);
      // turn off debug
      var pref = new Prefs;
      var prefStr = "javascript.options.strict";
  
      // turn debug off if enabled
      if (pref.getBool(prefStr)) {
        pref.setBool(prefStr, false);
        pref.save();
      } 
      return;
    }
  
    var jslib_modules = JS_LIB_PATH+"modules.js"
    include (jslib_modules);
  
  } 
    catch (e) { debugError(e); }

  function jslibRestartApp () 
  {
    try 
    {
      var as = jslibGetService("@mozilla.org/toolkit/app-startup;1", 
                               "nsIAppStartup");

      as.quit(jslibI.nsIAppStartup.eRestart | jslibI.nsIAppStartup.eAttemptQuit);
    } 
      catch (e) { debugError(e); }
  } 
} 
  
