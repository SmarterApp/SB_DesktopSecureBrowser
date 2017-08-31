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
    let msg = "DOMBROWSER:SETTINGS: "+Array.join(arguments, ": ");
    BrowserDebug.log(msg);
  },

  error : function ()
  {
    let msg = "DOMBROWSER:SETTINGS:ERROR: "+Array.join(arguments, ": ");
    BrowserDebug.log(msg);
  }
};

function SecureBrowserSettings () 
{
  // BrowserDebug.print("CONSTRUCTOR");
}

SecureBrowserSettings.prototype = 
{
  _SBRuntime : null,
        _tts : null,
   _security : null,
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
      try {this._SBRuntime = Cc["@mozilla.org/securebrowser;1"].getService(Ci.mozISecureBrowser); }
      catch (e) { BrowserDebug.error(e); }

      // BrowserDebug.print("INIT", "GET", "systemVolume", this._SBRuntime.systemVolume);

      return window.sbIBrowserSettings._create(window, this);
    }
      catch (e) { BrowserDebug.error(e); }
  },

  // securebrowser.spaces.enabled
  get isSpacesEnabled () 
  { 
    return Services.prefs.getBoolPref("securebrowser.spaces.enabled");
  },

  get systemVolume ()
  { 
    return this._SBRuntime.systemVolume;
  },

  set systemVolume (aVol)
  { 
    if (aVol >= 10) aVol = 10;
    if (aVol <= 0) aVol = 0;

    this._SBRuntime.systemVolume = aVol;
  },

  get systemMute () 
  { 
    return this._SBRuntime.systemMute;
  },

  set systemMute (aMute) 
  { 
    this._SBRuntime.systemMute = aMute;
  },

  get appStartTime () 
  { 
    return new Date(Services.prefs.getCharPref("securebrowser.startup.timestamp"));
  },

         classID : Components.ID("{550b3d53-5496-41e8-95e6-4224e2fc0a96}"),
      contractID : "@mozilla.org/securebrowsersettings;1",
  QueryInterface : XPCOMUtils.generateQI([Ci.nsISupports, Ci.nsIDOMGlobalPropertyInitializer])
};

this.NSGetFactory = XPCOMUtils.generateNSGetFactory([SecureBrowserSettings])

