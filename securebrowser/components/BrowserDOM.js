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
    let msg = "DOMBROWSER: "+Array.join(arguments, ": ");
    BrowserDebug.log(msg);
  },

  error : function ()
  {
    let msg = "DOMBROWSER:ERROR: "+Array.join(arguments, ": ");
    BrowserDebug.log(msg);
  }
};

function SecureBrowserDOM () 
{
  // BrowserDebug.print("CONSTRUCTOR");
}

SecureBrowserDOM.prototype = 
{
#ifndef SB_OPEN_SOURCE 
        _air : null,
#endif
     _events : null,
        _tts : null,
   _security : null,
   _settings : null,
     _window : null,
        _uri : null,

  init : function (window) 
  {
    try
    {
      // BrowserDebug.print("INIT", window);

      this._window = window;
      this._uri = window.document.documentURIObject;

      window.QueryInterface(Ci.nsIInterfaceRequestor);

#ifndef SB_OPEN_SOURCE 
      this._air = window._air;
#endif
      this._events = window._events;
      this._tts = window._tts;
      this._security = window._security;
      this._settings = window._settings;

      return window.sbIBrowser._create(window, this);
    }
      catch (e) { BrowserDebug.error(e); }
  },

#ifndef SB_OPEN_SOURCE 
  get air () 
  { 
    return this._air; 
  },
#endif

  get events () 
  { 
    return this._events;
  },

  get security () 
  { 
    return this._security; 
  },

  get tts () 
  { 
    return this._tts; 
  },

  get settings () 
  { 
    return this._settings;
  },

         classID : Components.ID("{c83dd7b5-050f-4ede-90dd-c93b9ec0380e}"),
      contractID : "@mozilla.org/securebrowserdom;1",
  QueryInterface : XPCOMUtils.generateQI([Ci.nsISupports, Ci.nsIDOMGlobalPropertyInitializer])
};

this.NSGetFactory = XPCOMUtils.generateNSGetFactory([SecureBrowserDOM])

