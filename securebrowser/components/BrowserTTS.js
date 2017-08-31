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
    let msg = "DOMBROWSER:TTS: "+Array.join(arguments, ": ");
    BrowserDebug.log(msg);
  },

  error : function ()
  {
    let msg = "DOMBROWSER:TTS:ERROR: "+Array.join(arguments, ": ");
    BrowserDebug.log(msg);
  }
};

function SecureBrowserTTS () 
{
  // BrowserDebug.print("CONSTRUCTOR");
}

SecureBrowserTTS.prototype = 
{
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

      return window.sbIBrowserTTS._create(window, this);
    }
      catch (e) { BrowserDebug.error(e); }
  },

  pause : function (aCallback)
  {
    let o =
    {
      callback:aCallback,
      window:this._window
    };

    Services.obs.notifyObservers({ wrappedJSObject:o }, "sb-dom-browser-tts-pause", "");
  },

  stop : function (aCallback)
  {
    let o =
    {
      callback:aCallback,
      window:this._window
    };

    Services.obs.notifyObservers({ wrappedJSObject:o }, "sb-dom-browser-tts-stop", "");
  },

  resume : function (aCallback)
  {
    let o =
    {
      callback:aCallback,
      window:this._window
    };

    Services.obs.notifyObservers({ wrappedJSObject:o }, "sb-dom-browser-tts-resume", "");
  },

  setTimeout : function (delay) 
  {
    let timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
    timer.initWithCallback(this, delay, Ci.nsITimer.TYPE_ONE_SHOT);
  },

  speak : function (aTxt, aOptions, aCallback)
  {
    let o =
    {
      callback : aCallback,
       options : aOptions,
           txt : aTxt,
        window : this._window
    };

    Services.obs.notifyObservers({ wrappedJSObject:o }, "sb-dom-browser-tts-play", "");
  },

  // used with timer
  notify : function ()
  {
    BrowserDebug.print("NOTIFY");
  },

  getStatus : function (aCallback) 
  { 
    let o =
    {
      callback : aCallback,
        window : this._window
    };

    Services.obs.notifyObservers({ wrappedJSObject:o }, "sb-dom-browser-tts-status", "");
  },

  getVoices : function (aCallback) 
  { 
    let o =
    {
      callback : aCallback,
        window : this._window
    };

    Services.obs.notifyObservers({ wrappedJSObject:o }, "sb-dom-browser-tts-voices", "");
  },

  getVoiceName : function (aCallback) 
  { 
    let o =
    {
      callback : aCallback,
        window : this._window
    };

    Services.obs.notifyObservers({ wrappedJSObject:o }, "sb-dom-browser-tts-voice", "");
  },

         classID : Components.ID("{042574ba-77e6-4c4e-9c18-3a475ee641a4}"),
      contractID : "@mozilla.org/securebrowsertts;1",
  QueryInterface : XPCOMUtils.generateQI([Ci.nsISupports, Ci.nsIDOMGlobalPropertyInitializer])
};

this.NSGetFactory = XPCOMUtils.generateNSGetFactory([SecureBrowserTTS]);

