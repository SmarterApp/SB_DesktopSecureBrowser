// *******************************************************************************
// Educational Online Test Delivery System
// Copyright (c) 2017 American Institutes for Research
//
// Distributed under the AIR Open Source License, Version 1.0
// See accompanying file AIR-License-1_0.txt or at
// http://www.smarterapp.org/documents/American_Institutes_for_Research_Open_Source_Software_License.pdf
// *******************************************************************************

// SecureBrowserUtils

var SecureBrowserUtils =
{
  mSBRuntime : null,
     _winreg : null,

  init : function ()
  {
    try 
    { 
      // SecureBrowserDebug.print("mozISecureBrowser", typeof(Ci.mozISecureBrowser), "@mozilla.org/securebrowser;1", typeof(Cc["@mozilla.org/securebrowser;1"]));
      SecureBrowserUtils.mSBRuntime = Cc["@mozilla.org/securebrowser;1"].getService(Ci.mozISecureBrowser); 
    }
      catch (e) { SecureBrowserDebug.error(e); }
  },

  sizeWindow : function ()
  {
    var height = screen.height;
    var width = screen.width;

    window.moveTo(0, 0);
    window.resizeTo(width, height);
  },

  resizeWindow : function ()
  {
    var height = screen.availHeight;
    var width = screen.width;

    window.resizeTo(width, height);
  },

  setFullscreen : function ()
  {
    window.fullScreen = true;

#ifdef XP_MACOSX
    // because we are setting to fullscreen mozilla unlock the UI
    // so we need to relock it
    SecureBrowserUtils.lockScreen();
#endif
  },

  lockScreen : function () 
  { 
#ifdef XP_MACOSX
    if (SecureBrowserUtils.mSBRuntime) SecureBrowserUtils.mSBRuntime.lockScreen(false); 
#endif
  },

  unsetFullscreen : function ()
  {
    window.fullScreen = false;
  },

  loadHomePage : function ()
  {
    // SecureBrowserDebug.print("WINDOW ARGUMENTS", window.arguments[0]);

    if (window.arguments[0] != "about:blank") return;

    let url = atob(Services.prefs.getCharPref("securebrowser.startup.homepage"));

    loadURI(url);
  },

  loadFrameScript : function ()
  {
    let mm = window.getGroupMessageManager("browsers");

    mm.loadFrameScript("chrome://securebrowser/content/js/tab-content.js", true);
  },

  binaryToHex : function  (input)
  {
    let result = "";

    for (var i = 0; i < input.length; ++i) 
    {
      var hex = input.charCodeAt(i).toString(16);
      if (hex.length == 1) hex = "0" + hex;
      result += hex;
    }

    return result;
    // return ("0" + input.toString(16)).slice(-2);
  },

  md5 : function (aStr, aUseRuntime)
  {
    let converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
  
    converter.charset = "UTF-8";
  
    if (aUseRuntime)
    {
      let r = Components.classes["@mozilla.org/securebrowser;1"].createInstance(Components.interfaces.mozISecureBrowser);
      aStr += atob(r.key);
    }

    let data = converter.convertToByteArray(aStr, {});

    let ch = Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);
    ch.init(Components.interfaces.nsICryptoHash.MD5);

    ch.update(data, data.length);

    // let hash = ch.finish(false);

    // hash = [SecureBrowserUtils.binaryToHex(hash.charCodeAt(i)) for (i in hash)].join("");
    let hash = SecureBrowserUtils.binaryToHex(ch.finish(false));

    return hash;
  },

  validatePassword : function (aPass)
  {
    // uncomment to see encrypted pass
    // SecureBrowserDebug.print("encrypt password", SecureBrowserUtils.md5(btoa(aPass)));

    return (Services.prefs.getCharPref("securebrowser.admin.login") == SecureBrowserUtils.md5(btoa(aPass)));
  },

  confirmAdminAccess : function ()
  {
    let ps = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService);

    let pwd = { value: "" };

    if (!ps.promptPassword(null,
                           "Admin Access",
                           "Please enter password.",
                           pwd,
                           null,
                           {value: null}))
      setTimeout(SecureBrowserUtils.quit, 1);
      

    let rv = SecureBrowserUtils.validatePassword(pwd.value);

    return rv;
  },

  passFailed : function ()
  {
    let ps = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService);
    
    ps.alert(window, "Admin Access", "Admin Login Password Incorrect...");
  },

  clearCache : function ()
  {
    try
    {
      SecureBrowserDebug.print("UTILS", "clearCache");

      let {Sanitizer} = Cu.import("resource:///modules/Sanitizer.jsm", {});

      let s = new Sanitizer;

      let itemsToClear = new Array;

      itemsToClear.push("cache", "sessions");

      s.sanitize(itemsToClear);
    }
      catch (e) { SecureBrowserDebug.error(e); }
  },

  clearCookies : function ()
  {
    try
    {
      SecureBrowserDebug.print("UTILS", "clearCookies");

      let {Sanitizer} = Cu.import("resource:///modules/Sanitizer.jsm", {});

      let s = new Sanitizer;

      let itemsToClear = new Array;

      itemsToClear.push("cookies");

      s.sanitize(itemsToClear);
    }
      catch (e) { SecureBrowserDebug.error(e); }
  },

  read : function (aKey, aFileName)
  {
    let data = null;

    try
    {
      let file = null;

      try { file = FileUtils.getFile(aKey, [aFileName]); }
      catch (e) 
      { 
        file = new FileUtils.File(aKey); 
        file.append(aFileName);
      }

      // SecureBrowserDebug.print("read", file, file.path);

      function cb (inputStream, status) 
      { 
        if (!Components.isSuccessCode(status)) 
        {
          SecureBrowserDebug.print("UTILS", "READ", "FAILED");
        }
          else
        {
          data = NetUtil.readInputStreamToString(inputStream, inputStream.available());
        }

        // SecureBrowserDebug.print(data);
        gBrowser.selectedBrowser.messageManager.sendAsyncMessage("SecureBrowser:AIR:Read", { filedata:data });
      }

      NetUtil.asyncFetch(file, cb);
    }
      catch (e) 
      { 
        SecureBrowserDebug.error(e); 
        gBrowser.selectedBrowser.messageManager.sendAsyncMessage("SecureBrowser:AIR:Read", { filedata:data });
      }
  },

  write : function (aKeyOrPath, aFileName, aData)
  {
    SecureBrowserDebug.print("write", aKeyOrPath, aFileName, aData, typeof(aData));

    try
    {
      let result = null;
      let file = null;

      try { file = FileUtils.getFile(aKeyOrPath, [aFileName]); }
      catch (e) 
      { 
        file = new FileUtils.File(aKeyOrPath); 
        file.append(aFileName);
      }

      // SecureBrowserDebug.print("file", file.path);

      let ostream = FileUtils.openSafeFileOutputStream(file);
      SecureBrowserDebug.print("ostream", ostream);

      let converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
      converter.charset = "UTF-8";
      // SecureBrowserDebug.print("converter", converter);

      let istream = converter.convertToInputStream(aData);

      function cb (status) 
      { 
        // SecureBrowserDebug.print("status", status);
        gBrowser.selectedBrowser.messageManager.sendAsyncMessage("SecureBrowser:AIR:Write", { result:status });
      }

      NetUtil.asyncCopy(istream, ostream, cb);
    }
      catch (e) { SecureBrowserDebug.error(e); }
  },

  readDirectory : function (aKey)
  {
    let entries = null;
    let result = null;

    try
    {
      let dir = null;

      try { dir = FileUtils.getFile(aKey, [null]); }
      catch (e) { dir = new FileUtils.File(aKey); }

      // SecureBrowserDebug.print("readDirectory", dir, dir.path);

      if (dir.isDirectory())
      {
        result = new Array;
        entries = dir.directoryEntries;

        while (entries.hasMoreElements()) 
        {
          let entry = entries.getNext();
          entry.QueryInterface(Ci.nsIFile);
          // SecureBrowserDebug.print(entry.leafName, entry.isDirectory());
          let o = { name:entry.leafName, isDir:entry.isDirectory() }
          result.push(o);
        }
      }

      gBrowser.selectedBrowser.messageManager.sendAsyncMessage("SecureBrowser:AIR:ReadDirectory", { entries:result });
    }
      catch (e) 
      { 
        SecureBrowserDebug.error(e); 
        gBrowser.selectedBrowser.messageManager.sendAsyncMessage("SecureBrowser:AIR:ReadDirectory", { entries:entries });
      }
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
        catch (e) { SecureBrowserDebug.error(e); }

    }
      catch (e) { SecureBrowserDebug.error(e); }
  },

  getHkey : function (aHkey)
  {
    let rv = null;

    switch (aHkey)
    {
      case "HKEY_CURRENT_USER":
      rv = Ci.nsIWindowsRegKey.ROOT_KEY_CURRENT_USER;
      break;

      case "HKEY_CLASSES_ROOT":
      rv = Ci.nsIWindowsRegKey.ROOT_KEY_CLASSES_ROOT;
      break;

      case "HKEY_LOCAL_MACHINE":
      rv = Ci.nsIWindowsRegKey.ROOT_KEY_LOCAL_MACHINE;
      break;
    }

    return rv;

  },

  get windowsReg ()
  {
    let rv = this._winreg;

    if (!rv) rv = this._winreg = Cc["@mozilla.org/windows-registry-key;1"].createInstance(Ci.nsIWindowsRegKey);

    return rv;
  },

  writeRegDWORD : function (aObj)
  {
    let rv;

    try
    {
      // SecureBrowserDebug.print("writeRegDWORD", aObj.hkey, aObj.key, aObj.name, aObj.value);

      let hkey = this.getHkey(aObj.hkey);

      let key = this.windowsReg;

      // create or open reg key for writing
      key.create(hkey, aObj.key, Ci.nsIWindowsRegKey.ACCESS_ALL);

      let name = aObj.name;
      let type = Ci.nsIWindowsRegKey.TYPE_INT;
      let hasVal = key.hasValue(name);
      if (hasVal) type = key.getValueType(name);

      let val = parseInt(aObj.value);

      if (type == Ci.nsIWindowsRegKey.TYPE_INT) key.writeIntValue(name, val);

      // SecureBrowserDebug.print(key, "hasVal", hasVal, "type", type, "val", val);

      rv = true;
    }
      catch (e) { rv = false; }

    return rv;
  },

  writeRegBool : function (aObj)
  {
    let rv;

    try
    {
      SecureBrowserDebug.print("writeRegBool", aObj.hkey, aObj.key, aObj.name, aObj.value);

      let hkey = this.getHkey(aObj.hkey);

      let key = this.windowsReg;

      // create or open reg key for writing
      key.create(hkey, aObj.key, Ci.nsIWindowsRegKey.ACCESS_ALL);

      let name = aObj.name;
      let type = Ci.nsIWindowsRegKey.TYPE_INT;
      let hasVal = key.hasValue(name);
      if (hasVal) type = key.getValueType(name);

      let val = 0;

      if (aObj.value) val = 1;

      if (type == Ci.nsIWindowsRegKey.TYPE_INT) key.writeIntValue(name, val);

      // SecureBrowserDebug.print(key, "hasVal", hasVal, "type", type, "val", val);

      rv = true;
    }
      catch (e) { rv = false; SecureBrowserDebug.error(e); }

    return rv;
  },

  writeRegString : function (aObj)
  {
    let rv;

    try
    {
      // SecureBrowserDebug.print("writeRegString", aObj.hkey, aObj.key, aObj.name, aObj.value);

      let hkey = this.getHkey(aObj.hkey);

      let key = this.windowsReg;

      // create or open reg key for writing
      key.create(hkey, aObj.key, Ci.nsIWindowsRegKey.ACCESS_ALL);

      let name = aObj.name;
      let type = Ci.nsIWindowsRegKey.TYPE_STRING;
      let hasVal = key.hasValue(name);
      if (hasVal) type = key.getValueType(name);

      let val = aObj.value;

      if (type == Ci.nsIWindowsRegKey.TYPE_STRING) key.writeStringValue(name, val);

      // SecureBrowserDebug.print(key, "hasVal", hasVal, "type", type, "val", val);

      rv = true;
    }
      catch (e) { rv = false; }

    return rv;
  },

  removeRegEntry : function (aObj)
  {
    let rv;

    try
    {
      // SecureBrowserDebug.print("removeRegEntry", aObj.hkey, aObj.key, aObj.name);

      let hkey = this.getHkey(aObj.hkey);

      let key = this.windowsReg;

      key.open(hkey, aObj.key, Ci.nsIWindowsRegKey.ACCESS_ALL);

      let name = aObj.name;

      key.removeValue(name);

      rv = true;
    }
      catch (e) { rv = false; SecureBrowserDebug.error(e); }

    return rv;
  },

  quit : function () { Services.startup.quit(Ci.nsIAppStartup.eAttemptQuit); }
};

