// *******************************************************************************
// Educational Online Test Delivery System
// Copyright (c) 2017 American Institutes for Research
//
// Distributed under the AIR Open Source License, Version 1.0
// See accompanying file AIR-License-1_0.txt or at
// http://www.smarterapp.org/documents/American_Institutes_for_Research_Open_Source_Software_License.pdf
// *******************************************************************************

"use strict";

const {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");

var BrowserDebug =
{
  log : function (aMsg)
  {
    Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService).logStringMessage(aMsg);
  },

  print : function ()
  {
    let msg = "DOMBROWSER:SECURITY: "+Array.join(arguments, ": ");
    BrowserDebug.log(msg);
  },

  error : function ()
  {
    let msg = "DOMBROWSER:SECURITY:ERROR: "+Array.join(arguments, ": ");
    BrowserDebug.log(msg);
  }
};

function SecureBrowserSecurity () 
{
  // BrowserDebug.print("CONSTRUCTOR");
}

SecureBrowserSecurity.prototype = 
{
  _SBRuntime : null,
     _window : null,
        _uri : null,

  init : function (window) 
  {
    try
    {
      // BrowserDebug.print("INIT");

      this._window = window;
       this._uri = window.document.documentURIObject;

      window.QueryInterface(Ci.nsIInterfaceRequestor);

      // local init
      try { this._SBRuntime = Cc["@mozilla.org/securebrowser;1"].getService(Ci.mozISecureBrowser); }
      catch (e) { BrowserDebug.error(e); }

      return window.sbIBrowserSecurity._create(window, this);
    }
      catch (e) { BrowserDebug.error(e); }
  },

  close : function (aRestart)
  {
    // BrowserDebug.print(!aRestart ? "CLOSE" : "RESTART");

    if (aRestart) Services.obs.notifyObservers(null, "sb-dom-browser-restart", "");
    else Services.obs.notifyObservers(null, "sb-dom-browser-quit", "");
  },

  lockDown : function (aEnable, aCallbackSuccess, aCallbackError)
  {
    if (aEnable) this._SBRuntime.permissive = false;

    if (typeof(aCallbackSuccess == "function")) aCallbackSuccess(!this._SBRuntime.permissive);
  },

  restoreDefaultStartPage : function ()
  {
    BrowserDebug.print("restoreDefaultStartPage");
    Services.obs.notifyObservers(null, "sb-dom-browser-security-restoreDefaultStartPage", "");
  },

  setAltStartPage : function (aURL)
  {
    BrowserDebug.print("setAltStartPage", aURL);
    let o = { url:aURL };
    Services.obs.notifyObservers({ wrappedJSObject:o }, "sb-dom-browser-security-setAltStartPage", "");
  },

  isEnvironmentSecure : function (aCallback)
  {
    let secure = !this._SBRuntime.permissive;
    let msg;

    secure ? msg="SecureMode" : msg="PermissiveMode";

    let o = { secure:secure, messageKey:msg };

    if (typeof(aCallback == "function")) aCallback(Cu.cloneInto(o, this._window));
  },

  /**
   * NOOP
   */
  getCapability : function (aFeature)
  {
    return; 
  },

  /**
   * NOOP
   */
  setCapability : function (aFeature, aValue, aCallbackSuccess, aCallbackError)
  {
    return; 
  },

  getDeviceInfo : function (aCallback)
  {
    // BrowserDebug.print("getDeviceInfo");

#ifdef XP_WIN
    let a = this._SBRuntime.OSversion.split("|");
#else
    let a = this._SBRuntime.OSversion.split(" ");
#endif

    let o = { os:a[0], name:a[1], version: a[2], brand:a[3], model:null, manufacturer:null };

    if (typeof(aCallback == "function")) aCallback(Cu.cloneInto(o, this._window));
  },

  emptyClipBoard : function ()
  {
    try
    {
      let ch = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper);

      try
      {
        // OS's that support selection like Linux
        let supportsSelect = Cc["@mozilla.org/widget/clipboard;1"].getService(Ci.nsIClipboard).supportsSelectionClipboard();

        if (supportsSelect) ch.copyStringToClipboard("", Ci.nsIClipboard.kSelectionClipboard);

        ch.copyStringToClipboard("", Ci.nsIClipboard.kGlobalClipboard);

      }
        catch (e) { BrowserDebug.error(e); }

    }
      catch (e) { BrowserDebug.error(e); }
  },

  examineProcessList : function (aPListArray, aCallback)
  {
    BrowserDebug.print("examineProcessList");

    let o = 
    { 
      callback:aCallback,
      plist:aPListArray,
      window:this._window
    };

    Services.obs.notifyObservers({ wrappedJSObject:o }, "sb-dom-browser-security-examineprocesslist", "");
  },

  getMACAddress : function (aCallback)
  {
    // BrowserDebug.print("getMACAddress");

    let o =
    {
      callback:aCallback,
      window:this._window
    };

    Services.obs.notifyObservers({ wrappedJSObject:o }, "sb-dom-browser-getMacAddress", "");
  },

  getPermissiveMode : function (aCallback)
  {
    if (typeof(aCallback == "function")) aCallback(this._SBRuntime.permissive);
  },

  setPermissiveMode : function (aEnabled, aCallback)
  {
    BrowserDebug.print("setPermissiveMode", aEnabled);

    this._SBRuntime.permissive = aEnabled;

#ifdef XP_WIN
    let o =
    {
      permissive:aEnabled,
      callback:aCallback,
      window:this._window
    };

    Services.obs.notifyObservers({ wrappedJSObject:o }, "sb-dom-browser-security-permissive", "");
#else

    if (typeof(aCallback == "function")) aCallback(this._SBRuntime.permissive);
#endif
  },

         classID : Components.ID("{10a50fd2-10f7-43fc-8f9a-10edafc1bbd1}"),
      contractID : "@mozilla.org/securebrowsersecurity;1",
  QueryInterface : XPCOMUtils.generateQI([Ci.nsISupports, Ci.nsIDOMGlobalPropertyInitializer])
};

this.NSGetFactory = XPCOMUtils.generateNSGetFactory([SecureBrowserSecurity])

