#!/bin/bash
#
# git-pull-reboot.sh
#
# Pull the latest from dosenet-web
# Then reboot the computer

WEBPATH=/home/pi/dosenet-web

cd $WEBPATH

sudo -u pi git pull --ff-only

sudo shutdown -r now
