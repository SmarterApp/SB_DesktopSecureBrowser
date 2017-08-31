if (typeof(JS_LIB_LOADED) == 'boolean') 
{
  var JS_DOM_LOADED = true;
  var JS_DOM_FILE   = 'dom.js';

  function Dom () { } 

  Dom.prototype = 
  {
    getEl : function (aEl) { return document.getElementById(aEl); }
  }; // END CLASS
  
  jslibLoadMsg(JS_DOM_FILE);

} else { dump("load FAILURE: dom.js\n"); }
 
