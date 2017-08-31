#!/bin/sh

if [ -f /sbin/ifconfig ]; then
  ifconfig_bin=/sbin/ifconfig
else
  ifconfig_bin=`which ifconfig`
fi

n=`$ifconfig_bin  | grep -n status | grep active | cut -f1 -d:`;

if [ $n ]; then
  echo One;
  l=`expr $n - 2`;
  iface=`$ifconfig_bin | sed -n $l'p'| sed -e 's/^.*ether //g'`;
fi

if [ ! $iface ]; then
  iface=`$ifconfig_bin -a | grep  ether | sed -e's:^.*ether ::g' -e's: .*$::g'`;
  iface=`echo $iface | cut -f1 -d' '`;
fi

if [ ! $iface ]; then
  iface=`$ifconfig_bin -a | grep  HWaddr | sed -e's:^.*HWaddr\s::g'`
  iface=`echo $iface | cut -f1 -d' '`;
fi

echo $iface;

