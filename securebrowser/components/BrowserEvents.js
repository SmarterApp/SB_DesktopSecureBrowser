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
    let msg = "DOMBROWSER:EVENTS: "+Array.join(arguments, ": ");
    BrowserDebug.log(msg);
  },

  error : function ()
  {
    let msg = "DOMBROWSER:Events:ERROR: "+Array.join(arguments, ": ");
    BrowserDebug.log(msg);
  }
};

function SecureBrowserEvents () 
{
  // BrowserDebug.print("CONSTRUCTOR");
}

SecureBrowserEvents.prototype = 
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
      // try {this._SBRuntime = Cc["@mozilla.org/securebrowser;1"].getService(Ci.mozISecureBrowser); }
      // catch (e) { BrowserDebug.error(e); }

      return window.sbIBrowserEvents._create(window, this);
    }
      catch (e) { BrowserDebug.error(e); }
  },

  addEventListener : function (aEvent, aCallBack)
  {
    // BrowserDebug.print("addEventListener", aEvent, typeof(aCallBack));

    if (typeof(aCallBack) == "function")
    {
      let o =
      {
          window : this._window,
           event : aEvent,
        callback : aCallBack
      };

      Services.obs.notifyObservers({ wrappedJSObject:o }, "sb-dom-browser-settings-addEventListener", "");
    }
  },

         classID : Components.ID("{6cb77b12-466e-4115-884d-950f8b1cb273}"),
      contractID : "@mozilla.org/securebrowserevents;1",
  QueryInterface : XPCOMUtils.generateQI([Ci.nsISupports, Ci.nsIDOMGlobalPropertyInitializer])
};

this.NSGetFactory = XPCOMUtils.generateNSGetFactory([SecureBrowserEvents])

