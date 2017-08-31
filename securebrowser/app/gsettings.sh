#!/bin/bash

echo "Attempting to configure gsettings from commandline...";
gsettings set org.gnome.settings-daemon.plugins.media-keys screenshot "disabled" > /dev/null 2>&1;
gsettings set org.gnome.settings-daemon.plugins.media-keys screenshot-clip "disabled" > /dev/null 2>&1;
gsettings set org.gnome.settings-daemon.plugins.media-keys window-screenshot "disabled" > /dev/null 2>&1;
gsettings set org.gnome.settings-daemon.plugins.media-keys window-screenshot-clip "disabled" > /dev/null 2>&1;
gsettings set org.gnome.settings-daemon.plugins.media-keys area-screenshot "disabled" > /dev/null 2>&1;
gsettings set org.gnome.settings-daemon.plugins.media-keys area-screenshot-clip "disabled" > /dev/null 2>&1;
gsettings set org.gnome.mutter overlay-key "" > /dev/null 2>&1;
gsettings set org.gnome.desktop.wm.keybindings minimize "['']" > /dev/null 2>&1;
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-down "['']" > /dev/null 2>&1;
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-up "['']" > /dev/null 2>&1;
gsettings set org.gnome.shell.keybindings toggle-message-tray "['']" > /dev/null 2>&1;
gsettings set org.gnome.shell.keybindings toggle-overview "['']" > /dev/null 2>&1;
gsettings set org.gnome.shell.keybindings toggle-application-view "['']" > /dev/null 2>&1;
gsettings set org.gnome.desktop.wm.keybindings cycle-panels "['']" > /dev/null 2>&1;
gsettings set org.gnome.desktop.wm.keybindings cycle-windows "['']" > /dev/null 2>&1;
gsettings set org.gnome.desktop.wm.keybindings activate-window-menu "['']" > /dev/null 2>&1;
gsettings set com.canonical.Unity2d.Launcher super-key-enable "['']" > /dev/null 2>&1;
gsettings set org.compiz.unityshell:/org/compiz/profiles/unity/plugins/unityshell/ launcher-hide-mode 1  > /dev/null 2>&1;

exit 0;

