/* FF Default Settings */

pref("startup.homepage_override_url","chrome://securebrowser/content/splash.html");
pref("startup.homepage_welcome_url","chrome://securebrowser/content/splash.html");
pref("startup.homepage_welcome_url.additional", "chrome://securebrowser/content/splash.html");

// Interval: Time between checks for a new version (in seconds)
pref("app.update.interval", 43200); // 12 hours

// The time interval between the downloading of mar file chunks in the
// background (in seconds)
pref("app.update.download.backgroundInterval", 60);

// Give the user x seconds to react before showing the big UI. default=48 hours
pref("app.update.promptWaitTime", 172800);

// URL user can browse to manually if for some reason all update installation
// attempts fail.
pref("app.update.url.manual", "https://www.mozilla.org/firefox/");

// A default value for the "More information about this update" link
// supplied in the "An update is available" page of the update wizard. 
pref("app.update.url.details", "https://www.mozilla.org/%LOCALE%/firefox/notes");

// The number of days a binary is permitted to be old
// without checking for an update.  This assumes that
// app.update.checkInstallTime is true.
pref("app.update.checkInstallTime.days", 63);

pref("browser.search.param.ms-pc", "MOZI");
pref("browser.search.param.yahoo-fr", "moz35");
pref("browser.search.param.yahoo-fr-cjkt", "moz35"); // now unused
pref("browser.search.param.yahoo-fr-ja", "mozff");

// Number of usages of the web console or scratchpad.
// If this is less than 5, then pasting code into the web console or scratchpad is disabled
pref("devtools.selfxss.count", 0);

// Turn on PrivateBRowsing by default
// pref("browser.privatebrowsing.autostart", true);

/** 
 * 
 * BEGIN SB CUSTOM SETTINGS
 *
 */

// if we choose to allow tabs (HandScoring)
pref("securebrowser.allowtabs", false);

// Show Nav Toolbar
pref("securebrowser.showUI", false);

// Show Debug Console
pref("securebrowser.debug.console", false);

// Enable Debug
pref("securebrowser.debug.enabled", false);

// SMARTERAPP BROWSER PRODUCTION URL
pref("securebrowser.startup.homepage", "aHR0cHM6Ly9icm93c2VyLnNtYXJ0ZXJhcHAub3JnL2xhbmRpbmcK");

pref("securebrowser.startup.base64page", "");

// KILL LAUNCHED PROCESSES
pref("securebrowser.system.enableKillProcess", false);

// SHUTDOWN WHEN OTHER PROCESS IS LAUNCHED
pref("securebrowser.system.shutdownOnNewProcess", true);

pref("securebrowser.mode.permissive", false);

// SHOW CHROME MODE
pref("securebrowser.mode.showChrome", false);

// OSX Spaces is enabled
pref("securebrowser.spaces.enabled", false);

// OSX SIRI is enabled
pref("securebrowser.siri.enabled", false);

// OSX Expose is enabled
pref("securebrowser.expose.enabled", false);

// DISPOSE SPEECH CHANNEL
pref("securebrowser.speech.disposeSpeechChannel", true);

// VISTA WARNINGS
pref("securebrowser.settings.enableTaskManagerWarning", false);
pref("securebrowser.settings.enableSwitchUserWarning", false);

// Linux is gsettings available
pref("securebrowser.system.hasgsettings", false);

/***********************************************************
// VISTA WARNINGS
pref("securebrowser.settings.enableTaskManagerWarning", false);
pref("securebrowser.settings.enableSwitchUserWarning", false);

// JAVA BUNDLE
pref("securebrowser.settings.enableJavaBundle", true);

// SCAN PLUGINS
pref("securebrowser.plugins.enablesystem.scan", false);

// FORCE QUIT (Commenting this out as this is causing browser crash in 10.8)
// pref("securebrowser.system.detectForceQuit", true);

// SECURITY OVERRIDE EXPIRED SSL ERROR PAGE
pref("browser.ssl_override_behavior", 0);

// JAVA VERSION
// pref("securebrowser.java.version", "1.6.0_25");
pref("securebrowser.java.version", "1.6.0_29");

// used to tighten security access when browsing the web
pref("securebrowser.mode.securebrowsing", false);

***********************************************************/
