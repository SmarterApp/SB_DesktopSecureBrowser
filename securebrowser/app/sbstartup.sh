#!/bin/sh

echo "Secure Browser Linux Startup Script..."

gconftool --set  /apps/metacity/window_keybindings/close --type=string '' > /dev/null 2>&1;
gconftool-2 --set /apps/metacity/window_keybindings/close --type=string '' > /dev/null 2>&1;
gconftool-2 --set /apps/metacity/window_keybindings/activate_window_menu --type=string '' > /dev/null 2>&1;

gsettings set org.gnome.desktop.screensaver lock-enabled false > /dev/null 2>&1;
gsettings set org.gnome.desktop.notifications show-in-lock-screen false > /dev/null 2>&1;
gsettings set org.gnome.desktop.lockdown disable-lock-screen true > /dev/null 2>&1;

exit 0;

