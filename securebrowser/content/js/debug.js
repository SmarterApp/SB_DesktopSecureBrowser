// *******************************************************************************
// Educational Online Test Delivery System
// Copyright (c) 2017 American Institutes for Research
//
// Distributed under the AIR Open Source License, Version 1.0
// See accompanying file AIR-License-1_0.txt or at
// http://www.smarterapp.org/documents/American_Institutes_for_Research_Open_Source_Software_License.pdf
// *******************************************************************************

// SecureBrowserDebug

var SecureBrowserDebug =
{
  log : function (aMsg)
  {
    Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService).logStringMessage(aMsg);
  },

  print : function ()
  {
    let msg = "SECUREBROWSER: "+Array.join(arguments, ": ");
    SecureBrowserDebug.log(msg);
  },

  printProperties : function (aObj)
  {
    let p = this.getProperties(aObj);

    for (let i=0; i<p.length; i++) this.print(p[i]);
  },

  getProperties : function (aObj)
  {
    let p = new Array;

    for (let list in aObj) p.push(list);

    let rv = p.sort();;

    return rv;
  },

  displayProperties : function (aObj)
  {
    let props = this.getProperties(aObj);

    let rv = "";

    for (let i=0; i<props.length; i++) 
    {
      this.print(props[i], typeof(aObj[props[i]]), aObj[props[i]]);
      rv += typeof(aObj[props[i]]) + " : " + props[i] + "\n";
    }

    return rv;
  },

  error : function ()
  {
    let msg = "SECUREBROWSER:ERROR: "+Array.join(arguments, ": ");
    SecureBrowserDebug.log(msg);
  },

  alert : function () 
  { 
    let ps = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
    ps.alert(window, "OpenKiosk Debug", Array.join(arguments, ": ")); 
  },

  delayedAlert : function ()
  {
    setTimeout(SecureBrowserDebug.alert, 2000, Array.join(arguments, ": "));
  }
};

