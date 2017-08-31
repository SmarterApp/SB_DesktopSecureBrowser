// *******************************************************************************
// Educational Online Test Delivery System
// Copyright (c) 2017 American Institutes for Research
//
// Distributed under the AIR Open Source License, Version 1.0
// See accompanying file AIR-License-1_0.txt or at
// http://www.smarterapp.org/documents/American_Institutes_for_Research_Open_Source_Software_License.pdf
// *******************************************************************************

const {classes: Cc, interfaces: Ci, utils: Cu} = Components;

const DEBUG                 = 0;

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Components.utils.import("resource://gre/modules/Services.jsm");

const nsISupports           = Components.interfaces.nsISupports;
const nsICommandLineHandler = Components.interfaces.nsICommandLineHandler;
const nsIWindowWatcher      = Components.interfaces.nsIWindowWatcher;
const nsISupportsString     = Components.interfaces.nsISupportsString;

const nsIObserver           = Components.interfaces.nsIObserver;
const nsIObserverService    = Components.interfaces.nsIObserverService;

const nsIComponentManager   = Components.interfaces.nsIComponentManager;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;
const nsICategoryManager    = Components.interfaces.nsICategoryManager;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");

var gJSLibInited = false;

var BrowserDebug =
{
  log : function (aMsg)
  {
    Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService).logStringMessage(aMsg);
  },

  print : function ()
  {
    var msg = "SECUREBROWSER:SERVICE: "+Array.join(arguments, ": ");
    BrowserDebug.log(msg);
  },

  error : function ()
  {
    BrowserDebug.log("SECUREBROWSER:SERVICE:ERROR: ", Array.join(arguments, ": "));
  }
};


function initJSLib ()
{
  if (gJSLibInited) return;

  Components.classes["@mozilla.org/moz/jssubscript-loader;1"].
                  getService(Components.interfaces.mozIJSSubScriptLoader).
                  loadSubScript("chrome://jslib/content/jslib.js");

  include(jslib_dirutils);
  include(jslib_file);
  include(jslib_fileutils);
  include(jslib_dir);
  
  gJSLibInited = true;
}

function showUI (aShow)
{
  Services.prefs.setBoolPref("securebrowser.showUI", aShow);
}

function setSecureBrowsing ()
{
  Services.prefs.setBoolPref("securebrowser.mode.securebrowsing", true);
}

function setHomePage (aCmdLine)
{
  var url = aCmdLine.getArgument(aCmdLine.length-1);

  if (url == "homepage") 
    Services.prefs.clearUserPref("securebrowser.alt.homepage");
  else
    Services.prefs.setCharPref("securebrowser.alt.homepage", aCmdLine.getArgument(aCmdLine.length-1));

  goQuitApp();
}

function handleBase64URL (aURL)
{
  try
  {
    // BrowserDebug.print("handleBase64URL", aURL);
    if (/-options|toolbar|debug|admin|homepage|proxy|secure|cache/.test(aURL)) return;

    let url;

    try { url = atob(aURL); }
    catch (e) {}

    // BrowserDebug.print("handleBase64URL", url);

    if (!url) return;

    var fu = Components.classes["@mozilla.org/docshell/urifixup;1"].getService(Components.interfaces.nsIURIFixup);
    url = fu.createFixupURI(url, Components.interfaces.nsIURIFixup.FIXUP_FLAGS_MAKE_ALTERNATE_URI).spec;

    Services.prefs.setCharPref("securebrowser.startup.base64page", url);
  }
    catch (e) { BrowserDebug.error(e); }
}

function debugConsole (aShow)
{
  Services.prefs.setBoolPref("securebrowser.debug.enabled", aShow);
}

function setStartupTimestamp ()
{
  try
  {
    var d = new Date;
  

    var dateFormat = d.getUTCFullYear()+", "+d.getMonth()+", "+d.getDate()+", "+d.getHours()+", "+d.getSeconds()+", "+d.getMilliseconds();
    Services.prefs.setCharPref("securebrowser.startup.timestamp", d);
    Services.prefs.setCharPref("securebrowser.startup.timestamp.now", Date.now());
  }
    catch (e) { BrowserDebug.error("ERROR", e); }
}

var handleQuit =
{
  observe : function (subject, topic, data)
  {
    if (topic == "quit-application") 
    {
      Services.prefs.clearUserPref("securebrowser.debug.enabled");
      debugConsole(false);

      var du = new DirUtils;
      var f = new File(du.getMozUserHomeDir());

      var d = new Dir(f.parent);

      var c = d.readDir();

      // remove screenshot png files
      for (var i=0; i<c.length; i++)
      {
       if (/png/i.test(c[i].ext)) c[i].remove(0);
      }

#ifdef XP_MACOSX
      f = new File(du.getHomeDir());
      f.append("Desktop");

      d = new Dir(f);

      var ds = Services.prefs.getCharPref("securebrowser.startup.timestamp.now");
      var ts = new Date(Number(ds));

      c = d.readDir();

      for (i=0; i<c.length; i++)
      {
       // Desktop File
       var df = c[i];

       if (/png/i.test(df.ext) && /Screen/.test(df.leaf)) 
         if (df.dateModified.getTime() > ts.getTime()) df.remove();
      }
#endif
    }
  }
};

function init ()
{
  initJSLib();

  var os = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
  os.addObserver(handleQuit, "quit-application", false);

  Services.prefs.clearUserPref("securebrowser.debug.enabled");
}

function handleProxy (aArg)
{
  try
  {
    var pref = Components.classes["@mozilla.org/preferences-service;1"]
                               .getService(Components.interfaces.nsIPrefService);

    pref = pref.getBranch("network.proxy.");

    var num = pref.getIntPref("type");

    // 4 is default
    var type = aArg;

    if (/^1/.test(aArg)) 
    {
      var a = aArg.split(":");

      if (a.length != 4) 
      {
        dump("    usage: -proxy type:protocol:host:port \n");
        goQuitApp();
        return;
      }

      type  = a[0];
      var proto = a[1];
      var host  = a[2];
      var port  = a[3];

      switch (proto)
      {
        case "http":
         pref.setCharPref("http", host);
         pref.setIntPref("http_port", port);
         break;
        
        case "ssl":
         pref.setCharPref("ssl", host);
         pref.setIntPref("ssl_port", port);
         break;
        
        case "ftp":
         pref.setCharPref("ftp", host);
         pref.setIntPref("ftp_port", port);
         break;
        
        case "gopher":
         pref.setCharPref("gopher", host);
         pref.setIntPref("gopher_port", port);
         break;
        
        case "socks":
         pref.setCharPref("socks", host);
         pref.setIntPref("socks_port", port);
         break;

        case "*":
         pref.setCharPref("http", host);
         pref.setIntPref("http_port", port);
         pref.setCharPref("ssl", host);
         pref.setIntPref("ssl_port", port);
         pref.setCharPref("ftp", host);
         pref.setIntPref("ftp_port", port);
         pref.setCharPref("gopher", host);
         pref.setIntPref("gopher_port", port);
         pref.setCharPref("socks", host);
         pref.setIntPref("socks_port", port);
         break;
      }

      pref.setIntPref("type", type);
    }
      else if (/^2/.test(aArg)) 
    {
      var a = aArg.split(":");

      if (a.length != 2) 
      {
        dump("    usage: -proxy type:url \n");
        goQuitApp();
        return;
      }

      type  = a[0];
      var url = a[1];

      BrowserDebug.print("URL", url);

      pref.setCharPref("autoconfig_url", url);
      pref.setIntPref("type", type);
    }
      else
    {
      pref.setIntPref("type", type);
    }

    // for testing only
    // goQuitApp();
  }
    catch (e) { BrowserDebug.error(e); }
}

function handleArgs (aArg, aCmdLine)
{
  var ww = Components.classes['@mozilla.org/embedcomp/window-watcher;1']
                     .getService(nsIWindowWatcher);

  var args = Components.classes['@mozilla.org/supports-string;1']
                       .getService(nsISupportsString);

  switch (aArg)
  {
    case "admin":
      var ps = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
      ps.alert(null, "Not Supported", "admin is no longer supported");
      break;

    case "debug":
    case "toolbar":
      showUI(true);
      debugConsole(true);
      aCmdLine.preventDefault = false;
      break;

    case "secure":
      setSecureBrowsing();
      aCmdLine.preventDefault = false;
      break;

    case "homepage":
      setHomePage(aCmdLine);
      aCmdLine.preventDefault = false;
      break;

    case "proxy":
      ww.openWindow(null, "chrome://browser/content/preferences/connection.xul", "_blank", 
                    "centerscreen,resizable=no", args);
      break;

    case "cache":
      ww.openWindow(null, // make this an app-modal window on Mac
                "chrome://browser/content/sanitize.xul",
                "Sanitize",
                "chrome,titlebar,centerscreen,modal",
                null);
      break;

    default:
      ww.openWindow(null, "chrome://securebrowser/content/", "_blank", "all,chrome,dialog=no", args);
  }

  return 0;
}

function goQuitApp ()
{
  var appStartup = Components.classes['@mozilla.org/toolkit/app-startup;1'].
                   getService(Components.interfaces.nsIAppStartup);

  appStartup.quit(Components.interfaces.nsIAppStartup.eAttemptQuit);
}

function nsSBCommandLineHandler () {}

nsSBCommandLineHandler.prototype = 
{
  /* nsISupports */
  // QueryInterface : XPCOMUtils.generateQI([nsICommandLineHandler]),

  classID: Components.ID("{601ac075-ab89-41c1-a732-a835dd1c7442}"),

  /* nsISupports */
  QueryInterface : function clh_QI (iid) 
  {
    if (!iid.equals(nsISupports) &&
        !iid.equals(nsICommandLineHandler))
      throw Components.results.NS_ERROR_NO_INTERFACE;

    return this;
  },

  handle : function clh_handle (cmdLine) 
  {
    try
    {
      init();

      for (let i=0; i<cmdLine.length; i++) 
      {
        // BrowserDebug.print("arg", i, atob(cmdLine.getArgument(i)) ? atob(cmdLine.getArgument(i)) : cmdLine.getArgument(i)); 
        handleBase64URL(cmdLine.getArgument(i));
      }

      setStartupTimestamp();

      var flag = cmdLine.findFlag("options", false);

      var isProxy = cmdLine.findFlag("proxy", false);

      // BrowserDebug.print("flag", flag, "isProxy", isProxy);

      // pass to default clh 
      if (flag < 0 && isProxy < 0) return;

      if (flag >= 0) var arg = cmdLine.getArgument(++flag);

      if (isProxy >= 0) var arg2 = cmdLine.getArgument(++isProxy);
   
      if (/^-/.test(arg))
      {
        BrowserDebug.print("Warning: unrecognized command line flag [" +arg+ "]");
        goQuitApp();
        return;
      }

      cmdLine.preventDefault = true;

      if (isProxy >= 0) handleProxy(arg2);

      if (cmdLine.length == 0 || flag >=0) handleArgs(arg, cmdLine);
    }
      catch (e) { BrowserDebug.error(e); }
  },

  helpInfo : "Usage: securebrowser -options admin       \n"
}

const NSGetFactory = XPCOMUtils.generateNSGetFactory([nsSBCommandLineHandler]);

