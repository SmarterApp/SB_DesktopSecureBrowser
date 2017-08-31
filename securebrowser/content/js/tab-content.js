// *******************************************************************************
// Educational Online Test Delivery System
// Copyright (c) 2017 American Institutes for Research
//
// Distributed under the AIR Open Source License, Version 1.0
// See accompanying file AIR-License-1_0.txt or at
// http://www.smarterapp.org/documents/American_Institutes_for_Research_Open_Source_Software_License.pdf
// *******************************************************************************

var { classes: Cc, interfaces: Ci, utils: Cu, results: Cr } = Components;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/ExtensionContent.jsm");

var BrowserDebug =
{
  log : function (aMsg)
  {
    Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService).logStringMessage(aMsg);
  },

  print : function ()
  {
    var msg = "TAB:FRAME: "+Array.join(arguments, ": ");
    BrowserDebug.log(msg);
  },

  error : function ()
  {
    BrowserDebug.log("ERROR", Array.join(arguments, ": "));
  }
};

addMessageListener("SecureBrowser:InsertTopLevelJS", function (aMsg)
{
  BrowserDebug.print("SecureBrowser:InsertTopLevelJS", "MESSAGE", aMsg.data.one, aMsg.data.two, content.location);

  // BrowserDebug.print("sendAsyncMessage", typeof(sendAsyncMessage));
});

var SecureBrowserFrame =
{
  // DOMBrower Observer
  DOMBrowserObserver :
  {
         _speakCallBack : null,
    _speakListenerAdded : false,
        _previousStatus : null,
                _window : null,

    observe : function (subject, topic, data)
    {
      /**
       * SECURITY QUIT
       */
      if (topic == "sb-dom-browser-quit")
      {
        BrowserDebug.print("QUIT");
        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-quit" });
      }

      /**
       * SECURITY RESTART
       */
      if (topic == "sb-dom-browser-restart")
      {
        BrowserDebug.print("OBSERVER", "RESTART");
        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-restart" });
      }

      /**
       * SECURITY GETMACADDRESS
       */
      if (topic == "sb-dom-browser-getMacAddress")
      {
        function cb (aMsg) 
        { 
          if (typeof(subject.wrappedJSObject.callback == "function")) subject.wrappedJSObject.callback(aMsg.data.ma);

          removeMessageListener("SecureBrowser:GetMacAddress", cb);
        }

        addMessageListener("SecureBrowser:GetMacAddress", cb);
        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-getMacAddress" });
      }

      /**
       * TTS PAUSE
       */
      if (topic == "sb-dom-browser-tts-pause")
      {
        function cb (aMsg) 
        { 
          if (typeof(subject.wrappedJSObject.callback == "function")) subject.wrappedJSObject.callback(aMsg.data.status);

          removeMessageListener("SecureBrowser:TTS:Pause", cb);
        }

        addMessageListener("SecureBrowser:TTS:Pause", cb);
        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-tts-pause" });
      }

      /**
       * TTS STOP
       */
      if (topic == "sb-dom-browser-tts-stop")
      {
        function cb (aMsg) 
        { 
          if (typeof(subject.wrappedJSObject.callback == "function")) subject.wrappedJSObject.callback(aMsg.data.status);

          removeMessageListener("SecureBrowser:TTS:Stop", cb);
        }

        addMessageListener("SecureBrowser:TTS:Stop", cb);
        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-tts-stop" });
      }

      /**
       * TTS RESUME
       */
      if (topic == "sb-dom-browser-tts-resume")
      {
        function cb (aMsg) 
        { 
          if (typeof(subject.wrappedJSObject.callback == "function")) subject.wrappedJSObject.callback(aMsg.data.status);

          removeMessageListener("SecureBrowser:TTS:Resume", cb);
        }

        addMessageListener("SecureBrowser:TTS:Resume", cb);
        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-tts-resume" });
      }

      /**
       * TTS PLAY
       */
      if (topic == "sb-dom-browser-tts-play")
      {
        SecureBrowserFrame.DOMBrowserObserver._speakCallBack = subject.wrappedJSObject.callback;
        SecureBrowserFrame.DOMBrowserObserver._window = subject.wrappedJSObject.window;

        function cb (aMsg) 
        { 
          let status = aMsg.data.o.status;
          let type = aMsg.data.o.type;

          try
          {
            if (typeof(SecureBrowserFrame.DOMBrowserObserver._speakCallBack == "function")) 
            {
              let e = 
              {
                     type : null,
                charindex : aMsg.data.o.start,
                     mark : null,
                   length : aMsg.data.o.length,
                  message : null
              };

              e.type = "word";

#ifdef XP_MACOSX
              if (aMsg.data.o.start == 0) e.type = "start";
#endif

              if (type == "Start") e.type = "start";

              if (type == "SentenceStart") e.type = "sentence";

              if (type == "Done") e.type = "end";

              if (type == "Sync") 
              {
                e.type = "sync";
                e.mark = true;
              }

              if (type == "Phoneme") e.type = "phoneme";

              if (status == "Paused") e.type = "pause";

              if (SecureBrowserFrame.DOMBrowserObserver.previousStatus == "Paused" && status == "Playing") e.type = "resumed"; 

              SecureBrowserFrame.DOMBrowserObserver._speakCallBack(Cu.cloneInto(e, SecureBrowserFrame.DOMBrowserObserver._window));
              SecureBrowserFrame.DOMBrowserObserver.previousStatus = status;
            }
          } 
            catch (e) { BrowserDebug.error(e); }
        }

        let o = 
        {
          options : subject.wrappedJSObject.options,
              txt : subject.wrappedJSObject.txt
        };

        try
        {
          // BrowserDebug.print("PLAY", "REMOVE MESSAGE LISTENER");
          removeMessageListener("SecureBrowser:TTS:Play", cb);
        } 
          catch (e) { BrowserDebug.error(e); }

        // BrowserDebug.print("PLAY", "ADD MESSAGE LISTENER");
        if (!SecureBrowserFrame.DOMBrowserObserver._speakListenerAdded)
        {
          addMessageListener("SecureBrowser:TTS:Play", cb);
          SecureBrowserFrame.DOMBrowserObserver._speakListenerAdded = true;
        }

        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-tts-play", o:o });
      }

      /**
       * TTS STATUS
       */
      if (topic == "sb-dom-browser-tts-status")
      {
        // BrowserDebug.print("STATUS");

        function cb (aMsg) 
        { 
          if (typeof(subject.wrappedJSObject.callback == "function")) subject.wrappedJSObject.callback(aMsg.data.status);

          removeMessageListener("SecureBrowser:TTS:Status", cb);
        }

        addMessageListener("SecureBrowser:TTS:Status", cb);
        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-tts-status" });
      }

      /**
       * TTS VOICES
       */
      if (topic == "sb-dom-browser-tts-voices")
      {
        function cb (aMsg) 
        { 
          if (typeof(subject.wrappedJSObject.callback == "function")) 
          {
            let a = new Array;
            for (let el of aMsg.data.voices) 
            {
              // BrowserDebug.print("EL", el);
              let s = "new Object("+el+")";
              let o = eval(s);
              // BrowserDebug.print(typeof(o), o.name, o.gender, o.language);
              a.push(o);
              
            }

            subject.wrappedJSObject.callback(Cu.cloneInto(a, subject.wrappedJSObject.window));
          }

          removeMessageListener("SecureBrowser:TTS:Voices", cb);
        }

        addMessageListener("SecureBrowser:TTS:Voices", cb);
        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-tts-voices" });
      }

      /**
       * TTS VOICE
       */
      if (topic == "sb-dom-browser-tts-voice")
      {
        function cb (aMsg) 
        { 
          if (typeof(subject.wrappedJSObject.callback == "function")) 
          {
            subject.wrappedJSObject.callback(aMsg.data.voice);
          }

          removeMessageListener("SecureBrowser:TTS:Voice", cb);
        }

        addMessageListener("SecureBrowser:TTS:Voice", cb);
        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-tts-voice" });
      }

      /**
       * CLEAR CACHE
       */
      if (topic == "sb-dom-browser-air-clearcache")
      {
        function cb (aMsg) 
        { 
          removeMessageListener("SecureBrowser:AIR:ClearCache", cb);
        }

        addMessageListener("SecureBrowser:AIR:ClearCache", cb);
        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-air-clearcache" });
      }

      /**
       * CLEAR COOKIES
       */
      if (topic == "sb-dom-browser-air-clearcookies")
      {
        function cb (aMsg) 
        { 
          removeMessageListener("SecureBrowser:AIR:ClearCookies", cb);
        }

        addMessageListener("SecureBrowser:AIR:ClearCookies", cb);
        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-air-clearcookies" });
      }

      /**
       * SET BOOL PREF
       */
      if (topic == "sb-dom-browser-air-setboolpref")
      {
        // BrowserDebug.print("sb-dom-browser-air-setboolpref", subject.wrappedJSObject.name, subject.wrappedJSObject.value);

        function cb (aMsg) 
        { 
          removeMessageListener("SecureBrowser:AIR:SetBoolPref", cb);
        }

        let o =
        {
          name : subject.wrappedJSObject.name,
          value : subject.wrappedJSObject.value
        };

        addMessageListener("SecureBrowser:AIR:SetBoolPref", cb);
        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-air-setboolpref", o:o });
      }

      /**
       * SET STRING PREF
       */
      if (topic == "sb-dom-browser-air-setstringpref")
      {
        // BrowserDebug.print("sb-dom-browser-air-setstringpref", subject.wrappedJSObject.name, subject.wrappedJSObject.value);

        function cb (aMsg) 
        { 
          removeMessageListener("SecureBrowser:AIR:SetStringPref", cb);
        }

        let o =
        {
          name : subject.wrappedJSObject.name,
          value : subject.wrappedJSObject.value
        };

        addMessageListener("SecureBrowser:AIR:SetStringPref", cb);
        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-air-setstringpref", o:o });
      }

      /**
       * SET INT PREF
       */
      if (topic == "sb-dom-browser-air-setintpref")
      {
        // BrowserDebug.print("sb-dom-browser-air-setintpref", subject.wrappedJSObject.name, subject.wrappedJSObject.value);

        function cb (aMsg) 
        { 
          removeMessageListener("SecureBrowser:AIR:SetIntPref", cb);
        }

        let o =
        {
          name : subject.wrappedJSObject.name,
          value : subject.wrappedJSObject.value
        };

        addMessageListener("SecureBrowser:AIR:SetIntPref", cb);
        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-air-setintpref", o:o });
      }

      /**
       * CLEAR PREF
       */
      if (topic == "sb-dom-browser-air-clearpref")
      {
        function cb (aMsg) 
        { 
          removeMessageListener("SecureBrowser:AIR:ClearPref", cb);
        }

        let o = { name : subject.wrappedJSObject.name };

        addMessageListener("SecureBrowser:AIR:ClearPref", cb);
        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-air-clearpref", o:o });
      }

      /**
       * KILL PROCESS
       */
      if (topic == "sb-dom-browser-air-killprocess")
      {
        // BrowserDebug.print("sb-dom-browser-air-killprocess", subject.wrappedJSObject.name);

        function cb (aMsg) 
        { 
          removeMessageListener("SecureBrowser:AIR:KillProcess", cb);
          if (typeof(subject.wrappedJSObject.callback == "function")) subject.wrappedJSObject.callback(aMsg.data.rv);
        }

        let o = { name : subject.wrappedJSObject.name };

        addMessageListener("SecureBrowser:AIR:KillProcess", cb);
        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-air-killprocess", o:o });
      }

      /**
       * LAUNCH PROCESS
       */
      if (topic == "sb-dom-browser-air-launchprocess")
      {
        // BrowserDebug.print("sb-dom-browser-air-launchprocess", subject.wrappedJSObject.name);

        function cb (aMsg) 
        { 
          removeMessageListener("SecureBrowser:AIR:LaunchProcess", cb);
          if (typeof(subject.wrappedJSObject.callback == "function")) subject.wrappedJSObject.callback(aMsg.data.rv);
        }

        let o = { name : subject.wrappedJSObject.name };

        addMessageListener("SecureBrowser:AIR:LaunchProcess", cb);
        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-air-launchprocess", o:o });
      }

      /**
       * GET PROCESS LIST
       */
      if (topic == "sb-dom-browser-air-getprocesslist")
      {
        function cb (aMsg) 
        { 
          removeMessageListener("SecureBrowser:AIR:GetProcessList", cb);
          if (typeof(subject.wrappedJSObject.callback == "function")) subject.wrappedJSObject.callback(Cu.cloneInto(aMsg.data.list, subject.wrappedJSObject.window));
        }

        addMessageListener("SecureBrowser:AIR:GetProcessList", cb);
        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-air-getprocesslist" });
      }

      /**
       * EXAMINE PROCESS LIST
       */
      if (topic == "sb-dom-browser-security-examineprocesslist")
      {
        function cb (aMsg) 
        { 
          let inArray = subject.wrappedJSObject.plist;
          let rv = new Array;

          if (Array.isArray(inArray))
          {
            let plist = aMsg.data.list;

            // BrowserDebug.print("PROCESS LIST", plist);

            for (let iItem of inArray)
            {
              for (let eItem of plist)
              {
                // BrowserDebug.print(iItem.toLowerCase(), eItem.toLowerCase());

                if (iItem.toLowerCase() == eItem.toLowerCase()) rv.push(iItem);
              }
            }
          }

          removeMessageListener("SecureBrowser:AIR:ExamineProcessList", cb);
          if (typeof(subject.wrappedJSObject.callback == "function")) subject.wrappedJSObject.callback(Cu.cloneInto(rv, subject.wrappedJSObject.window));
        }

        addMessageListener("SecureBrowser:AIR:ExamineProcessList", cb);
        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-security-examineprocesslist" });
      }

      /**
       * SET ALT STARTPAGE
       */
      if (topic == "sb-dom-browser-security-setAltStartPage")
      {
        BrowserDebug.print("sb-dom-browser-security-setAltStartPage");

        function cb (aMsg) 
        { 
          removeMessageListener("SecureBrowser:SECURITY:SetAltStartPage", cb);
        }

        let o = { url : subject.wrappedJSObject.url };

        addMessageListener("SecureBrowser:SECURITY:SetAltStartPage", cb);
        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-security-setAltStartPage", o:o });
      }

      /**
       * RESTORE ALT STARTPAGE
       */
      if (topic == "sb-dom-browser-security-restoreDefaultStartPage")
      {
        BrowserDebug.print("sb-dom-browser-security-restoreDefaultStartPage");

        function cb (aMsg) 
        { 
          removeMessageListener("SecureBrowser:SECURITY:RestoreDefaultStartPage", cb);
        }

        addMessageListener("SecureBrowser:SECURITY:RestoreDefaultStartPage", cb);
        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-security-restoreDefaultStartPage" });
      }

      /**
       * SECURITY PERMISSIVE
       */
      if (topic == "sb-dom-browser-security-permissive")
      {
        function cb (aMsg) 
        { 
          try
          {
            // BrowserDebug.print("CALLBACK", "permissive", typeof(subject.wrappedJSObject.callback));
            if (typeof(subject.wrappedJSObject.callback == "function")) subject.wrappedJSObject.callback(aMsg.data.o.p);

            removeMessageListener("SecureBrowser:SECURITY:Permissive", cb);
          }
            catch (e) { BrowserDebug.error(e); }
        }

        let o =
        {
          permissive : subject.wrappedJSObject.permissive
        };

        addMessageListener("SecureBrowser:SECURITY:Permissive", cb);
        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-security-permissive", o:o });
      }

      /**
       * READ
       */
      if (topic == "sb-dom-browser-air-read")
      {
        // BrowserDebug.print("sb-dom-browser-air-read");

        function cb (aMsg) 
        { 
          if (typeof(subject.wrappedJSObject.callback == "function")) subject.wrappedJSObject.callback(aMsg.data.filedata);

          removeMessageListener("SecureBrowser:AIR:Read", cb);
        }

        let o =
        {
               key : subject.wrappedJSObject.key,
          filename : subject.wrappedJSObject.filename
        };

        addMessageListener("SecureBrowser:AIR:Read", cb);
        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-air-read", o:o });
      }

      /**
       * WRITE
       */
      if (topic == "sb-dom-browser-air-write")
      {
        BrowserDebug.print("sb-dom-browser-air-write");

        function cb (aMsg) 
        { 
          if (typeof(subject.wrappedJSObject.callback == "function")) subject.wrappedJSObject.callback(aMsg.data.result);

          removeMessageListener("SecureBrowser:AIR:Write", cb);
        }

        let o =
        {
               key : subject.wrappedJSObject.key,
          filename : subject.wrappedJSObject.filename,
              data : subject.wrappedJSObject.data
        };

        addMessageListener("SecureBrowser:AIR:Write", cb);
        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-air-write", o:o });
      }

      /**
       * READ DIRECTORY
       */
      if (topic == "sb-dom-browser-air-readdirectory")
      {
        // BrowserDebug.print("sb-dom-browser-air-readdirectory");

        function cb (aMsg) 
        { 
          if (typeof(subject.wrappedJSObject.callback == "function")) subject.wrappedJSObject.callback(Cu.cloneInto(aMsg.data.entries, subject.wrappedJSObject.window));

          removeMessageListener("SecureBrowser:AIR:ReadDirectory", cb);
        }

        let o =
        {
          key : subject.wrappedJSObject.key,
        };

        addMessageListener("SecureBrowser:AIR:ReadDirectory", cb);
        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-air-readdirectory", o:o });
      }

      /**
       * REG WRITE DWORD
       */
      if (topic == "sb-dom-browser-air-regwritedword")
      {
        function cb (aMsg) 
        { 
          // BrowserDebug.print("success", aMsg.data.success);

          if (typeof(subject.wrappedJSObject.callback == "function")) subject.wrappedJSObject.callback(aMsg.data.success);

          removeMessageListener("SecureBrowser:AIR:RegWriteDWORD", cb);
        }

        let o =
        {
          hkey : subject.wrappedJSObject.hkey,
           key : subject.wrappedJSObject.key,
          name : subject.wrappedJSObject.name,
         value : subject.wrappedJSObject.value,
        };

        addMessageListener("SecureBrowser:AIR:RegWriteDWORD", cb);
        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-air-regwritedword", o:o });
      }

      /**
       * REG WRITE BOOL
       */
      if (topic == "sb-dom-browser-air-regwritebool")
      {
        function cb (aMsg) 
        { 
          // BrowserDebug.print("success", aMsg.data.success);

          if (typeof(subject.wrappedJSObject.callback == "function")) subject.wrappedJSObject.callback(aMsg.data.success);

          removeMessageListener("SecureBrowser:AIR:RegWriteBool", cb);
        }

        let o =
        {
          hkey : subject.wrappedJSObject.hkey,
           key : subject.wrappedJSObject.key,
          name : subject.wrappedJSObject.name,
         value : subject.wrappedJSObject.value,
        };

        addMessageListener("SecureBrowser:AIR:RegWriteBool", cb);
        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-air-regwritebool", o:o });
      }

      /**
       * REG WRITE STRING
       */
      if (topic == "sb-dom-browser-air-regwritestring")
      {
        function cb (aMsg) 
        { 
          // BrowserDebug.print("success", aMsg.data.success);

          if (typeof(subject.wrappedJSObject.callback == "function")) subject.wrappedJSObject.callback(aMsg.data.success);

          removeMessageListener("SecureBrowser:AIR:RegWriteString", cb);
        }

        let o =
        {
          hkey : subject.wrappedJSObject.hkey,
           key : subject.wrappedJSObject.key,
          name : subject.wrappedJSObject.name,
         value : subject.wrappedJSObject.value,
        };

        addMessageListener("SecureBrowser:AIR:RegWriteString", cb);
        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-air-regwritestring", o:o });
      }

      /**
       * REG REMOVE
       */
      if (topic == "sb-dom-browser-air-regremove")
      {
        function cb (aMsg) 
        { 
          // BrowserDebug.print("success", aMsg.data.success);

          if (typeof(subject.wrappedJSObject.callback == "function")) subject.wrappedJSObject.callback(aMsg.data.success);

          removeMessageListener("SecureBrowser:AIR:RegRemove", cb);
        }

        let o =
        {
          hkey : subject.wrappedJSObject.hkey,
           key : subject.wrappedJSObject.key,
          name : subject.wrappedJSObject.name,
        };

        addMessageListener("SecureBrowser:AIR:RegRemove", cb);
        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-air-regremove", o:o });
      }

      /**
       * ADD EVENT LISTENER
       */
      if (topic == "sb-dom-browser-settings-addEventListener")
      {
        let domCallBack = subject.wrappedJSObject.callback;

        // BrowserDebug.print("sb-dom-browser-settings-addEventListener", "domCallBack", domCallBack);

        function handleDOM () { if (typeof(domCallBack == "function")) domCallBack(); }

        function cb (aMsg) 
        { 
          try
          {
            if (Components.utils.isDeadWrapper(subject.wrappedJSObject.window)) return;

            // BrowserDebug.print("CALLBACK", "SecureBrowser:EVENTS:AddEventListener");

            handleDOM();
          }
            catch (e) {}
        }

        let o = { event : subject.wrappedJSObject.event };

        removeMessageListener("SecureBrowser:EVENTS:AddEventListener", cb);
        addMessageListener("SecureBrowser:EVENTS:AddEventListener", cb);

        sendAsyncMessage("SecureBrowser:FrameMessageListener", { command: "sb-dom-browser-settings-addEventListener", o:o });
      }
    }
  }
};

Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-quit", false);
Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-restart", false);
Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-getMacAddress", false);
Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-tts-pause", false);
Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-tts-stop", false);
Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-tts-resume", false);
Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-tts-play", false);
Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-tts-status", false);
Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-tts-voices", false);
Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-tts-voice", false);
Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-air-clearcache", false);
Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-air-clearcookies", false);
Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-air-setboolpref", false);
Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-air-setstringpref", false);
Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-air-setintpref", false);
Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-air-clearpref", false);
Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-air-killprocess", false);
Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-air-launchprocess", false);
Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-air-getprocesslist", false);
Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-air-read", false);
Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-air-write", false);
Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-air-readdirectory", false);
Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-air-regwritedword", false);
Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-air-regwritebool", false);
Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-air-regwritestring", false);
Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-air-regremove", false);
Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-security-setAltStartPage", false);
Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-security-restoreDefaultStartPage", false);
Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-security-permissive", false);
Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-security-examineprocesslist", false);
Services.obs.addObserver(SecureBrowserFrame.DOMBrowserObserver, "sb-dom-browser-settings-addEventListener", false);

