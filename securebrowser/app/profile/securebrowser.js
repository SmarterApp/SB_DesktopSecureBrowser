#include firefox.js

// SECUREBROWSER PREFS
pref("accessibility.tabfocus_applies_to_xul", false);
pref("app.update.certs.2.commonName", "*.tds.airast.org");
pref("app.update.certs.2.issuerName", "CN=Go Daddy Secure Certificate Authority - G2,O=\"GoDaddy.com, Inc.\",C=US");
pref("app.update.channel", "release");
pref("app.update.enabled", false);
pref("app.update.log", true);
pref("app.update.url.details", "https://sbupdate.tds.airast.org/");
pref("browser.chromeURL","chrome://securebrowser/content/");
pref("browser.formfill.enable", false);
pref("browser.fullscreen.autohide", false);
pref("browser.hiddenWindowChromeURL", "chrome://securebrowser/content/hiddenWindow.xul");
pref("browser.link.open_newwindow", 1);
pref("browser.link.open_newwindow.restriction", 0);
pref("browser.newtabpage.directory.ping", "");
pref("browser.newtabpage.directory.source", "about:blank");
pref("browser.newtabpage.enabled", false);
pref("browser.offline-apps.notify", false);
pref("browser.safebrowsing.enabled", false);
pref("browser.safebrowsing.malware.enabled", false);
pref("browser.search.geoip.url", "");
pref("browser.search.update", false);
pref("browser.selfsupport.url", "https://localhost");

// this pref breaks about:preferences SB-222
// pref("browser.sessionhistory.max_entries", 0);

pref("browser.sessionstore.resume_from_crash", false);
pref("browser.shell.checkDefaultBrowser", false);
pref("browser.ssl_override_behavior", 0);
pref("browser.startup.page", 0);
pref("browser.tabs.closeWindowWithLastTab", false);
pref("browser.uiCustomization.state", "{\"placements\":{\"PanelUI-contents\":[\"edit-controls\",\"zoom-controls\",\"new-window-button\",\"privatebrowsing-button\",\"save-page-button\",\"print-button\",\"history-panelmenu\",\"fullscreen-button\",\"find-button\",\"preferences-button\",\"add-ons-button\",\"bookmarks-menu-button\",\"developer-button\",\"sync-button\",\"pocket-button\",\"home-button\",\"downloads-button\",\"loop-button\",\"search-container\"],\"addon-bar\":[\"addonbar-closebutton\",\"status-bar\"],\"PersonalToolbar\":[\"personal-bookmarks\"],\"nav-bar\":[\"urlbar-container\",\"ok-reset-button\"],\"TabsToolbar\":[\"tabbrowser-tabs\",\"new-tab-button\",\"alltabs-button\"]},\"seen\":[\"loop-button\",\"pocket-button\",\"developer-button\"],\"dirtyAreaCache\":[\"PersonalToolbar\",\"nav-bar\",\"TabsToolbar\",\"PanelUI-contents\",\"addon-bar\"],\"currentVersion\":6,\"newElementCount\":0}");
pref("browser.usedOnWindows10", true);
pref("dom.max_chrome_script_run_time", 0);
pref("dom.max_script_run_time", 0);
pref("extensions.blocklist.enabled", false);
pref("extensions.update.autoUpdateDefault", false);
pref("extensions.update.enabled", false);
pref("layers.acceleration.disabled", true);
pref("media.gmp-manager.certs.1.commonName", "");
pref("media.gmp-manager.certs.2.commonName", "");
pref("media.gmp-manager.url", "");
pref("media.webspeech.synth.enabled", true);
pref("network.captive-portal-service.enabled", false);
pref("plugin.default.state", 0);
pref("plugin.state.flash", 2);
pref("plugin.state.java", 2);
pref("privacy.clearOnShutdown.cache",       false);
pref("privacy.clearOnShutdown.cookies",     false);
pref("privacy.clearOnShutdown.downloads",   true);
pref("privacy.clearOnShutdown.formdata",    true);
pref("privacy.clearOnShutdown.history",     true);
pref("privacy.clearOnShutdown.offlineApps", false);
pref("privacy.clearOnShutdown.passwords",   true);
pref("privacy.clearOnShutdown.sessions",    true);
pref("privacy.clearOnShutdown.siteSettings", true);
pref("privacy.cpd.cache",                   false);
pref("privacy.cpd.cookies",                 false);
pref("privacy.cpd.formdata",                true);
pref("privacy.cpd.history",                 true);
pref("privacy.cpd.passwords",               true);
pref("privacy.cpd.siteSettings",            true);
pref("privacy.sanitize.sanitizeOnShutdown", true);
pref("privacy.sanitize.timeSpan", 0);
pref("securebrowser.admin.login", "17a1d3b785d23992047dad7caaa96394");
pref("securebrowser.domain.whitelist", "airast.org,airws.org,smarterbalanced.org,smarterapp.org,opentestsystem.org");
pref("securebrowser.osx.missioncontrol.customkeys.enabled", false);
pref("securebrowser.tts.pitch", 10);
pref("securebrowser.tts.rate", 10);
pref("security.OCSP.enabled", 0);
pref("security.ssl.enable_ocsp_stapling", false);
pref("services.sync.prefs.sync.security.OCSP.enabled", false);
pref("services.sync.prefs.sync.security.OCSP.require", false);

pref("services.sync.prefs.sync.browser.safebrowsing.phishing.enabled", false);
pref("services.sync.prefs.sync.browser.safebrowsing.malware.enabled", false);
pref("browser.safebrowsing.phishing.enabled", false);
pref("browser.safebrowsing.malware.enabled", false);


pref("toolkit.telemetry.archive.enabled", false);
pref("toolkit.telemetry.enabled", false);
pref("toolkit.telemetry.reportingpolicy.firstRun", false);
pref("toolkit.telemetry.unified", false);
pref("xpinstall.enabled", false);
pref("zoom.maxPercent", 100);
pref("zoom.minPercent", 100);
