---
title: Determine Compromised System
tags: 
  - Infosec
  - RITA
  - Network
  - Forensics
categories:
  - Holiday Hack 2019
date: 2020-01-19
---


[RITA](https://github.com/activecm/rita) is a great tool for analysing logs like these. All we need to do is import the logs, then we can generate an html report for them which gives us a bunch of cool metrics:

```bash
rita import elfu-zeeklogs hh19-elfu-zeeklogs
rita html-report hh19-elfu-zeeklogs
```

Now we can open the report in a browser and start looking at it.

If we head over to the 'Beacons' tab we can look at what rita thinks may be connections back to a malware master server. Our first entry has a score of `0.998`, So it really does scream suspicious. One computer connected to the same address 7660 times, on average 10 seconds apart. 

The answer is `192.168.134.130`.