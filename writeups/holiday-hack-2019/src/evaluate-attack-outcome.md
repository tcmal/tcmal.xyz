# Windows Log Analysis: Evaluate Attack Outcome

We can use [python-evtx](https://github.com/williballenthin/python-evtx) to dump everything to an XML file, which is much more readable:

```
$ ~/tools/python-evtx/scripts/evtx_dump.py Security.evtx > Security.evtx.xml
```

From here we're looking for 4625 (Logon failed) and 4624 (Logon success message). The regex `<EventID.*?>4625` works and is good enough for scrolling through it in sublime.

We see a pattern of failed logins with LogonType 3 (Network), all to different usernames and with an increasing IpPort number. This is a password spray attack.

We can look for event ids 4624 in a similar way and see a successful login to `supatree` with LogonType 3. This is the compromised account.