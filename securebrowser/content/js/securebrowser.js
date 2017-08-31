// *******************************************************************************
// Educational Online Test Delivery System
// Copyright (c) 2017 American Institutes for Research
//
// Distributed under the AIR Open Source License, Version 1.0
// See accompanying file AIR-License-1_0.txt or at
// http://www.smarterapp.org/documents/American_Institutes_for_Research_Open_Source_Software_License.pdf
// *******************************************************************************

// SecrureBrowserChrome

var SecureBrowserChrome =
{
  debug : Services.prefs.getBoolPref("securebrowser.debug.enabled"),

  hooks : function ()
  {
    // When debug is enabled, toolbar and console are diaplayed
    // SecureBrowserDebug.print("DEBUG ENABLED", SecureBrowserChrome.debug);

    SecureBrowserUtils.emptyClipBoard();
    SecureBrowserChrome.addObservers();
    SecureBrowserChrome.addListeners();
    SecureBrowserUtils.init();

    SecureBrowserChrome.handleAdmin();
    SecureBrowserChrome.initUI();
    SecureBrowserChrome.handlePrefs();
  },

  init : function ()
  {
    SecureBrowserUtils.setFullscreen();
    SecureBrowserChrome.delayedInit();
  },

  delayedInit : function ()
  {
    // white blank screen has nothing to do w/ resize
    SecureBrowserUtils.sizeWindow();

    // for when we launch from a terminal
    setTimeout(SecureBrowserUtils.sizeWindow, 300);

    SecureBrowserUtils.loadFrameScript();
  },

  delayedStartupFinished :
  {
    observe : function (subject, topic, data)
    {
      if (topic == "browser-delayed-startup-finished")
      {
        SecureBrowserChrome.init();
        setTimeout(SecureBrowserUtils.sizeWindow, 800);
        Services.obs.removeObserver(SecureBrowserChrome.delayedStartupFinished, topic);
        setTimeout(SecureBrowserUtils.sizeWindow, 1000);
        setTimeout(SecureBrowserUtils.sizeWindow, 2500);
      }
    }
  },

  handleAdmin : function ()
  {
    if (!SecureBrowserChrome.debug) return;

    if (!SecureBrowserUtils.confirmAdminAccess()) 
    {
      SecureBrowserChrome.debug = false;
      setTimeout(SecureBrowserUtils.passFailed, 1000); 
    }
  },

  initUI : function ()
  {
    SecureBrowserChrome.hideUI();
  },

  addObservers : function ()
  {
    Services.obs.addObserver(SecureBrowserChrome.delayedStartupFinished, "browser-delayed-startup-finished", false);
  },

  addListeners : function ()
  {
    gBrowser.addProgressListener(SecureBrowserChrome.ProgressListener);

    addEventListener("MozDOMFullscreen:Entered", SecureBrowserChrome.onEnterFullScreen, true, false);
    addEventListener("MozDOMFullscreen:Exited", SecureBrowserChrome.onExitFullScreen, true, false);

    messageManager.addMessageListener("SecureBrowser:FrameMessageListener", SecureBrowserChrome.FrameMessageListener);
  },

  removeListeners : function ()
  {
    SecureBrowserDebug.print("REMOVE LISTENERS");

    removeEventListener("MozDOMFullscreen:Entered", SecureBrowserChrome.onEnterFullScreen, true, false);
    removeEventListener("MozDOMFullscreen:Exited", SecureBrowserChrome.onExitFullScreen, true, false);
  },

  removeObservers : function ()
  {
    SecureBrowserDebug.print("REMOVE OBSERVERS");
  },

  unload : function ()
  {
    SecureBrowserDebug.print("UNLOAD");
    SecureBrowserUtils.emptyClipBoard();
    SecureBrowserChrome.removeListeners();
    SecureBrowserChrome.removeObservers();
    SecureBrowserUtils.mSBRuntime = null;
  },

  hideUI : function ()
  {
    let el = document.getElementById("restore-button");
    el.collapsed = true;

    el = document.getElementById("PanelUI-button");
    el.hidden = el.collapsed = true;

    el = document.getElementById("TabsToolbar");
    if (el) el.collapsed = el.hidden = true;

    el = document.getElementById("addon-bar");
    if (el) el.collapsed = true;

    el = document.getElementById("browser-bottombox");
    if (el) el.collapsed = true;

    if (!SecureBrowserChrome.debug) 
    {
      el = document.getElementById("navigator-toolbox");
      if (el) el.collapsed = true;

      el = document.getElementById("titlebar");
      if (el) el.collapsed = true;
    }

    SecureBrowserChrome.handleDevControls();
  },

  handleDevControls : function ()
  {
    if (!SecureBrowserChrome.debug) 
    {
      // hide debug toolbox
      // SecureBrowserDebug.print("HIDE DEV MENUS");
      setTimeout(SecureBrowserChrome.handleDevControlsMenu, 1);
    }
      else
    {
      // show debug toolbox
      // SecureBrowserDebug.print("SHOW DEV TOOLBOX");
      setTimeout(gDevToolsBrowser.toggleToolboxCommand, 500, gBrowser);
    }
  },

  handleDevControlsMenu : function ()
  {
    let menu = document.getElementById("webDeveloperMenu");

    while (menu.hasChildNodes()) menu.removeChild(menu.firstChild);

    function test ()
    {
      let dtks = document.getElementById("devtoolsKeyset");
      // SecureBrowserDebug.print("DEV TOOLS KEYSET", dtks);

      if (dtks) dtks.parentNode.removeChild(dtks);
    }
 
    setTimeout(test, 1000);
  },

  handlePrefs : function ()
  {
    if (!SecureBrowserChrome.debug) Services.prefs.setIntPref("browser.sessionhistory.max_entries", 0);
    else Services.prefs.clearUserPref("browser.sessionhistory.max_entries");
  },

  onEnterFullScreen : function ()
  {
    SecureBrowserDebug.print("ENTER FULL SCREEN");
    SecureBrowserUtils.setFullscreen();
    SecureBrowserUtils.lockScreen();
  },

  onExitFullScreen : function ()
  {
    SecureBrowserDebug.print("EXIT FULL SCREEN");
    SecureBrowserUtils.setFullscreen();
  },

  insertTopLevelJSObject : function ()
  {
    try
    {
      if (gBrowser.selectedBrowser.documentContentType != "text/html") return;

      // example code to notify frame script
      // gBrowser.selectedBrowser.messageManager.sendAsyncMessage("SecureBrowser:InsertTopLevelJS", { one: "ONE", two: "TWO" }); 

      // SecureBrowserDebug.printProperties(SecureBrowser);

      // SecureBrowserDebug.print("SecureBrowser", SecureBrowser, "SecureBrowserChrome.tts.speak", typeof(SecureBrowserChrome.tts.speak), "SecureBrowserChrome.security.close", typeof(SecureBrowserChrome.security.close));
    }
      catch (e) { SecureBrowserDebug.error(e); }
  },

  ProgressListener : 
  {
    onProgressChange : function (wp, req, cur, max, curtotal, maxtotal) {},

    onStateChange : function (wp, req, state, status) { },

    onLocationChange : function (wp, req, loc)
    {
      try 
      { 
        // stop speaking if we left page
        if (SecureBrowserUtils.mSBRuntime) SecureBrowserUtils.mSBRuntime.stop();

        if (!/https|http/.test(loc.scheme)) return;

        SecureBrowserDebug.print("PAGE LOADED", loc.spec);
        // SecureBrowserDebug.printProperties(wp);

        SecureBrowserChrome.insertTopLevelJSObject(); 
        // sbAddClickListener();
      }
        catch (e) { }
    },

    onStatusChange : function (wp, req, status, message) {},

    onSecurityChange : function (wp, req, state) {}
  },

  // Listen for Frame Messages
  FrameMessageListener : function (aMsg)
  {
    let command = aMsg.data.command;

    // SecureBrowserDebug.print(aMsg.name, "COMMAND", command);

    switch (command)
    {
      case "sb-dom-browser-quit":
        SecureBrowserUtils.quit();
        break;

      case "sb-dom-browser-restart":
        Services.startup.quit(Ci.nsIAppStartup.eRestart|Ci.nsIAppStartup.eAttemptQuit);
        break;

      case "sb-dom-browser-getMacAddress":
        let ma = SecureBrowserUtils.mSBRuntime.getMACAddress();
        gBrowser.selectedBrowser.messageManager.sendAsyncMessage("SecureBrowser:GetMacAddress", { ma: ma });
        break;

      case "sb-dom-browser-tts-pause":
        SecureBrowserUtils.mSBRuntime.pause();
        gBrowser.selectedBrowser.messageManager.sendAsyncMessage("SecureBrowser:TTS:Pause", { status: SecureBrowserUtils.mSBRuntime.status });
        break;

      case "sb-dom-browser-tts-stop":
        SecureBrowserUtils.mSBRuntime.stop();
        SecureBrowserChrome.removeSpeakObservers();
        gBrowser.selectedBrowser.messageManager.sendAsyncMessage("SecureBrowser:TTS:Stop", { status: SecureBrowserUtils.mSBRuntime.status });
        break;

      case "sb-dom-browser-tts-resume":
        SecureBrowserUtils.mSBRuntime.resume();
        gBrowser.selectedBrowser.messageManager.sendAsyncMessage("SecureBrowser:TTS:Resume", { status: SecureBrowserUtils.mSBRuntime.status });
        break;

      case "sb-dom-browser-tts-play":
        SecureBrowserChrome.play(aMsg.data.o);
        break;

      case "sb-dom-browser-tts-status":
        gBrowser.selectedBrowser.messageManager.sendAsyncMessage("SecureBrowser:TTS:Status", { status: SecureBrowserUtils.mSBRuntime.status });
        break;

      case "sb-dom-browser-tts-voices":
        let voices = SecureBrowserUtils.mSBRuntime.voices.replace(/\\/g, "\\\\").split("|");
        gBrowser.selectedBrowser.messageManager.sendAsyncMessage("SecureBrowser:TTS:Voices", { voices:voices });
        break;

      case "sb-dom-browser-tts-voice":
        gBrowser.selectedBrowser.messageManager.sendAsyncMessage("SecureBrowser:TTS:Voice", { voice: SecureBrowserUtils.mSBRuntime.voiceName });
        break;

      case "sb-dom-browser-air-clearcache":
        SecureBrowserUtils.clearCache();
        break;

      case "sb-dom-browser-air-clearcookies":
        SecureBrowserUtils.clearCookies();
        break;

      case "sb-dom-browser-air-setboolpref":
        Services.prefs.setBoolPref(aMsg.data.o.name, aMsg.data.o.value);
        break;

      case "sb-dom-browser-air-setstringpref":
        Services.prefs.setCharPref(aMsg.data.o.name, aMsg.data.o.value);
        break;

      case "sb-dom-browser-air-setintpref":
        Services.prefs.setIntPref(aMsg.data.o.name, aMsg.data.o.value);
        break;

      case "sb-dom-browser-air-clearpref":
        try { Services.prefs.clearUserPref(aMsg.data.o.name); }
        catch (e) {}
        break;

      case "sb-dom-browser-air-killprocess":
        let rv = true;
        try { SecureBrowserUtils.mSBRuntime.killProcess(aMsg.data.o.name); }
        catch (e) { rv = false; }
        gBrowser.selectedBrowser.messageManager.sendAsyncMessage("SecureBrowser:AIR:KillProcess", { rv:rv });
        break;

      case "sb-dom-browser-air-launchprocess":
        let res = true;
        try { SecureBrowserUtils.mSBRuntime.startProcess(aMsg.data.o.name); }
        catch (e) { res = false; }
        gBrowser.selectedBrowser.messageManager.sendAsyncMessage("SecureBrowser:AIR:LaunchProcess", { rv:res });
        break;

      case "sb-dom-browser-security-examineprocesslist":
        let elist = SecureBrowserUtils.mSBRuntime.getRunningProcessList().split(",");
        gBrowser.selectedBrowser.messageManager.sendAsyncMessage("SecureBrowser:AIR:ExamineProcessList", { list:elist });
        break;

      case "sb-dom-browser-air-getprocesslist":
#ifdef XP_WIN
        let plist = SecureBrowserUtils.mSBRuntime.getAllProcesses().split(",");
#else
        let plist = SecureBrowserUtils.mSBRuntime.getRunningProcessList().split(",");
#endif
        gBrowser.selectedBrowser.messageManager.sendAsyncMessage("SecureBrowser:AIR:GetProcessList", { list:plist });
        break;

      case "sb-dom-browser-security-setAltStartPage":
        // SecureBrowserDebug.print("setAltStartPage", aMsg.data.o.url);
        Services.prefs.setCharPref("securebrowser.security.altHomePage.url", aMsg.data.o.url);
        break;

      case "sb-dom-browser-security-restoreDefaultStartPage":
        // SecureBrowserDebug.print("restoreDefaultStartPage");
        Services.prefs.clearUserPref("securebrowser.security.altHomePage.url");
        break;

      case "sb-dom-browser-security-permissive":
        let p = aMsg.data.o.permissive;
        SecureBrowserUtils.mSBRuntime.permissive = p;
        if (p) SecureBrowserUtils.resizeWindow();
        else SecureBrowserUtils.sizeWindow();
        let o = { p : SecureBrowserUtils.mSBRuntime.permissive };
        gBrowser.selectedBrowser.messageManager.sendAsyncMessage("SecureBrowser:SECURITY:Permissive", { o:o });
        break;

      case "sb-dom-browser-air-read":
        SecureBrowserUtils.read(aMsg.data.o.key, aMsg.data.o.filename);
        break;

      case "sb-dom-browser-air-write":
        SecureBrowserUtils.write(aMsg.data.o.key, aMsg.data.o.filename, aMsg.data.o.data);
        break;

      case "sb-dom-browser-air-readdirectory":
        SecureBrowserUtils.readDirectory(aMsg.data.o.key);
        break;

      case "sb-dom-browser-air-regwritedword":
        let dws = SecureBrowserUtils.writeRegDWORD(aMsg.data.o);
        gBrowser.selectedBrowser.messageManager.sendAsyncMessage("SecureBrowser:AIR:RegWriteDWORD", { success:dws });
        break;

      case "sb-dom-browser-air-regwritebool":
        let bs = SecureBrowserUtils.writeRegBool(aMsg.data.o);
        gBrowser.selectedBrowser.messageManager.sendAsyncMessage("SecureBrowser:AIR:RegWriteBool", { success:bs });
        break;

      case "sb-dom-browser-air-regwritestring":
        let ws = SecureBrowserUtils.writeRegString(aMsg.data.o);
        gBrowser.selectedBrowser.messageManager.sendAsyncMessage("SecureBrowser:AIR:RegWriteString", { success:ws });
        break;

      case "sb-dom-browser-air-regremove":
        let rr = SecureBrowserUtils.removeRegEntry(aMsg.data.o);
        gBrowser.selectedBrowser.messageManager.sendAsyncMessage("SecureBrowser:AIR:RegRemove", { success:rr });
        break;

      case "sb-dom-browser-settings-addEventListener":
        SecureBrowserChrome.handleDOMListener(aMsg.data.o.event);
        break;

      default:
        SecureBrowserDebug.print("FrameMessageListener", "UNHANDLED COMMAND", aMsg.data.command);
    }
  },

  _speakObserverAdded : false,

  play : function (aObj)
  {
    let options = aObj.options;

    if (typeof(options) == "object")
    {
      if (typeof(options.id) == "string") SecureBrowserUtils.mSBRuntime.voiceName = options.id;

      if (typeof(options.rate) == "number") SecureBrowserUtils.mSBRuntime.rate = options.rate;

      if (typeof(options.pitch) == "number") SecureBrowserUtils.mSBRuntime.pitch = options.pitch;

      if (typeof(options.volume) == "number") SecureBrowserUtils.mSBRuntime.volume = options.volume;
    }

    if (!SecureBrowserChrome._speakObserverAdded)
    {
      function observer (subject, topic, data)
      {
        if (topic == "sb-word-speak")
        {
          let a = null;
          let start = null;
          let length = null;
          let end = null;

          if (/,/.test(data))
          {
            a = data.split(",");
            start = parseInt(a[0].split(":")[1]);
            length = parseInt(a[1].split(":")[1]);
            end = start + length;
            data = "WordBoundry";
          }

          let o =
          {
             start : start,
            length : length,
               end : end,
              type : data,
            status : SecureBrowserUtils.mSBRuntime.status
          };

          // if (data == "Start") SecureBrowserDebug.print(data);

          if (data == "Done" || o.status == "Stopped") SecureBrowserChrome._speakObserverAdded =  false;

          // SecureBrowserDebug.print("start", o.start, "length", o.length, "end", o.end, "data", o.data, "status", o.status);

          gBrowser.selectedBrowser.messageManager.sendAsyncMessage("SecureBrowser:TTS:Play", { o:o });
        }
      }

      SecureBrowserChrome.removeSpeakObservers();

      // SecureBrowserDebug.print("ADD SPEAK OBSERVER");
      Services.obs.addObserver(observer, "sb-word-speak", false);
      SecureBrowserChrome._speakObserverAdded = true;
    }

#ifdef XP_MACOSX
    // start, end, word boundary, sentence boundary, synchronization/marker encountered, paused and error
    SecureBrowserUtils.mSBRuntime.initializeListener("soWordCallBack");
#endif

    SecureBrowserUtils.mSBRuntime.play(aObj.txt);
  },

  // remove all current observers
  removeSpeakObservers : function ()
  {
    let observers = Services.obs.enumerateObservers("sb-word-speak");
    while (observers.hasMoreElements()) 
    {
      // SecureBrowserDebug.print("REMOVE SPEAK OBSERVER");
      Services.obs.removeObserver(observers.getNext().QueryInterface(Ci.nsIObserver), "sb-word-speak");
    }

    SecureBrowserChrome._speakObserverAdded =  false;
  },

  handleDOMListener : function (aEvent)
  {
    // SecureBrowserDebug.print("handleDOMListener", aEvent);

    let o = 
    {
      observe : function (subject, topic, data)
      {
        if (topic == "sb-security-breach")
        {
          SecureBrowserDebug.print("OBSERVED", topic);
          gBrowser.selectedBrowser.messageManager.sendAsyncMessage("SecureBrowser:EVENTS:AddEventListener");
        }
      }
    };

    let observers = Services.obs.enumerateObservers("sb-security-breach");
    while (observers.hasMoreElements()) 
    {
      SecureBrowserDebug.print("REMOVE BREACH OBSERVER");
      Services.obs.removeObserver(observers.getNext().QueryInterface(Ci.nsIObserver), "sb-security-breach");
    }

    Services.obs.addObserver(o, aEvent, false);
  }
};

