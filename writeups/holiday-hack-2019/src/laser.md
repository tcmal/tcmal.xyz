# Xmas cheer laser

The first things we get told are that:
  - We should make an HTTP request to the root of the server
  - There's a message left behind by the attacker

Starting with the first one, this is the response we get:

```
----------------------------------------------------
Christmas Cheer Laser Project Web API
----------------------------------------------------
Turn the laser on/off:
GET http://localhost:1225/api/on
GET http://localhost:1225/api/off

Check the current Mega-Jollies of laser output
GET http://localhost:1225/api/output

Change the lense refraction value (1.0 - 2.0):
GET http://localhost:1225/api/refraction?val=1.0

Change laser temperature in degrees Celsius:
GET http://localhost:1225/api/temperature?val=-10

Change the mirror angle value (0 - 359):
GET http://localhost:1225/api/angle?val=45.1

Change gaseous elements mixture:
POST http://localhost:1225/api/gas
POST BODY EXAMPLE (gas mixture percentages):
O=5&H=5&He=5&N=5&Ne=20&Ar=10&Xe=10&F=20&Kr=10&Rn=10
----------------------------------------------------
```

So presumably we need the right refraction, temperature, angle and elements mixture to get the best power output, which is 5 Mega Jollies per litre.

Looking at our second clue, although we have a nix directory structure we're clearly in a powershell prompt, so we need to use mostly Windows/PS commands to actually do anything.

```
PS /home/elf> type ../callingcard.txt
What's become of your dear laser?
Fa la la la la, la la la la
Seems you can't now seem to raise her!
Fa la la la la, la la la la
Could commands hold riddles in hist'ry?
Fa la la la la, la la la la
Nay! You'll ever suffer myst'ry!
Fa la la la la, la la la la
```

We can look at the command history with the command `Get-History`. This truncates a couple commands though, so we select the important field then pipe it to `Format-List` to print it in full:

```
PS /home/elf> Get-History | select CommandLine | Format-List
CommandLine : Get-Help -Name Get-Process 
CommandLine : Get-Help -Name Get-* 
CommandLine : Set-ExecutionPolicy Unrestricted 
CommandLine : Get-Service | ConvertTo-HTML -Property Name, Status > C:\services.htm 
CommandLine : Get-Service | Export-CSV c:\service.csv 
CommandLine : Get-Service | Select-Object Name, Status | Export-CSV C:\service.csv 
CommandLine : (Invoke-WebRequest http://127.0.0.1:1225/api/angle?val=65.5).RawContent
CommandLine : Get-EventLog -Log "Application" 
CommandLine : I have many name=value variables that I share to applications system wide. 
              At a command I will reveal my secrets once you Get my Child Items.
CommandLine : (Invoke-WebRequest -Uri http://localhost:1225/).RawContent
CommandLine : type callingcard.txt
CommandLine : type ../callingcard.txt
CommandLine : Get-History
CommandLine : Get-History | Format-List
CommandLine : Get-History | select CommandLine
```

The first thing we see is a call to the api which sets the angle to `65.5 degrees`. It's possible this is meant to be the correct value of our angle parameter. We also see the services on the system being dumped to `C:\service.csv` and `C:\services.htm`. Neither of these files exist anymore, so we'll ignore this for now.

The actual clue in this history is:

```
I have many name=value variables that I share to applications system wide. 
              At a command I will reveal my secrets once you Get my Child Items.
```

This seems to be alluding to `$Env`, which stores global environment variables such as PATH, HOSTNAME, etc. Powershell lets us address it as a drive, so we can `cd` into it and `ls`, except the powershell versions of those.

```
PS /home/elf> Set-Location Env:
PS Env:/> Get-ChildItem

Name                           Value
----                           -----
_                              /bin/su
DOTNET_SYSTEM_GLOBALIZATION_I… false
HOME                           /home/elf
HOSTNAME                       6071085c6a89
LANG                           en_US.UTF-8
LC_ALL                         en_US.UTF-8
LOGNAME                        elf
MAIL                           /var/mail/elf
PATH                           /opt/microsoft/powershell/6:/usr/local/sbin:/usr/local/bi…
PSModuleAnalysisCachePath      /var/cache/microsoft/powershell/PSModuleAnalysisCache/Mod…
PSModulePath                   /home/elf/.local/share/powershell/Modules:/usr/local/shar…
PWD                            /home/elf
RESOURCE_ID                    f56c8ff0-128e-48f1-8b91-0c967f900f22
riddle                         Squeezed and compressed I am hidden away. Expand me from …
SHELL                          /home/elf/elf
SHLVL                          1
TERM                           xterm
USER                           elf
USERDOMAIN                     laserterminal
userdomain                     laserterminal
username                       elf
USERNAME                       elf
```

Again, we need to format as a list to see the `riddle` item in full.

```
PS Env:/> get-childitem riddle | format-list

Name  : riddle
Value : Squeezed and compressed I am hidden away. Expand me from my prison and I will 
        show you the way. Recurse through all /etc and Sort on my LastWriteTime to 
        reveal im the newest of all.
```

So first we need to find the newest file in `/etc`. We can recurse through all subdirectories using `Get-ChildItem -Recurse`, however this breaks up the output into one list for each folder. If we try to sort this we'll sort based on the newest in each folder. So we extract just the fields we want and, in doing so, flatten the output with `select`:

```
PS /> Get-ChildItem -Recurse etc | select FullName,LastWriteTime
[...]
```

Now we sort based on the LastWriteTime and pull out the first entry. Descending means newest first, since a higher timestamp value is further on.

```
PS /> Get-ChildItem -Recurse etc | select FullName,LastWriteTime | sort -Descending LastWriteTime | select -First 1 FullName
FullName
--------
/etc/apt/archive
```

So `/etc/apt/archive` is the archive we need to extract. A quick google shows that the powershell command is actually `Expand-Archive`, so let's go back home and extract it there.

```
PS /home/elf> Expand-Archive /etc/apt/archive
PS /home/elf> Expand-Archive /etc/apt/archive
PS /home/elf> dir                                                           
                                                                             
Mode                LastWriteTime         Length Name
----                -------------         ------ ----
d-----          12/26/19  1:46 PM                archive
d-r---          12/13/19  5:15 PM                depths
--r---          12/13/19  4:29 PM           2029 motd

PS /home/elf> dir archive


    Directory: /home/elf/archive

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
d-----          12/26/19  1:46 PM                refraction

PS /home/elf> dir ./archive/refraction/


    Directory: /home/elf/archive/refraction

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
------           11/7/19 11:57 AM            134 riddle
------           11/5/19  2:26 PM        5724384 runme.elf
```

Let's start by running `runme`

```
PS /home/elf/archive/refraction> chmod +x runme.elf
PS /home/elf/archive/refraction> ./runme.elf
refraction?val=1.867
```

So now we have the intended value for refraction. Let's look at the riddle:

```
Very shallow am I in the depths of your elf home. You can find my entity by using my md5 identity:

25520151A320B5B0D21561F92C8F6224
```

So it looks like we need to search `~/depths` recursively for a file with the given MD5 Hash. For this we hash every *file* in it recursively (up to a certain depth since we're just testing right now):

```
PS /home/elf/depths> Get-ChildItem -File -Recurse -Depth 1 | Get-FileHash -Algorithm MD5

[...]
```

Now we just need to filter for the given hash and read the file it finds:

```
PS /home/elf/depths> Get-ChildItem -File -Recurse | Get-FileHash -Algorithm MD5 | where Hash -eq "25520151A320B5B0D21561F92C8F6224" | select Path

Path
----
/home/elf/depths/produce/thhy5hll.txt

PS /home/elf/depths> type produce/thhy5hll.txt
temperature?val=-33.5

I am one of many thousand similar txt's contained within the deepest of /home/elf/depths. Finding me will give you the most strength but doing so will require Piping all the FullName's to Sort Length.
```

So now we have every parameter except the elements mix. Now we need to find the longest file path of all the files in depths. For this, we can use `sort` (actually `Sort-Object`) with an extra script block:

```
PS /home/elf/depths> Get-ChildItem -File -Recurse | sort -Descending {$_.FullName.length} | select -First 1 FullName | Format-List

FullName : /home/elf/depths/larger/cloud/behavior/beauty/enemy/produce/age/chair/unknown/escape/vote/long/writer/behind/ahead/thin/occasionally/explore/tape/wherever/practical/therefore/cool/plate/ice/play/truth/potatoes/beauty/fourth/careful/dawn/adult/either/burn/end/accurate/rubbed/cake/main/she/threw/eager/trip/to/soon/think/fall/is/greatest/become/accident/labor/sail/dropped/fox/0jhj5xz6.txt
```

Our script block just gets the FullName property of our input (`$_`), then returns the length property of that, which is interpreted as the number to sort. Again we use descending to put the biggest at the top. We also need to `Format-List` because it's long enough to get truncated.

Our next clue is:

```
Get process information to include Username identification. Stop Process to show me you're skilled and in this order they must be killed:

bushy
alabaster
minty
holly

Do this for me and then you /shall/see.
```

We can get all the processes with `Get-Process`, but we need to add `-IncludeUserName`, since this needs admin privilleges.

```
PS /home/elf/depths> Get-Process -IncludeUserName

     WS(M)   CPU(s)      Id UserName                       ProcessName
     -----   ------      -- --------                       -----------
     27.01     0.52       6 root                           CheerLaserServi
    182.66     4.44      31 elf                            elf
      3.50     0.03       1 root                           init
      0.78     0.00      23 bushy                          sleep
      0.72     0.00      25 alabaster                      sleep
      0.72     0.00      27 minty                          sleep
      0.77     0.00      29 holly                          sleep
      3.28     0.00      30 root                           su
```

Now we just kill them in the right order.

```
PS /home/elf/depths> kill 23 25 27 29
```

`/shall/see` looks like a file path, and sure enough if we read from it we find our next hint:

```
PS /home/elf/depths> type /shall/see
Get the .xml children of /etc - an event log to be found. Group all .Id's and the last thing will be in the Properties of the lonely unique event Id.
```

First let's find our file and copy it to our home for convenience:

```
PS /> Get-ChildItem -Recurse -File etc | where Name -match ".*\.xml"

    Directory: /etc/systemd/system/timers.target.wants

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
--r---          11/18/19  7:53 PM       10006962 EventLog.xml
```

Now we need to parse it as an XML document. Luckily, Powershell lets us do this just by casting it:

```
PS /home/elf> [xml]$doc = type EventLog.xml
```

Now we can address our nodes using dotnotation, but first let's take a quick look at our actual document:

```
PS /home/elf> type EventLog.xml | select -first 10
<Objs Version="1.1.0.1" xmlns="http://schemas.microsoft.com/powershell/2004/04">
  <Obj RefId="0">
    <TN RefId="0">
      <T>System.Diagnostics.Eventing.Reader.EventLogRecord</T>
      <T>System.Diagnostics.Eventing.Reader.EventRecord</T>
      <T>System.Object</T>
    </TN>
    <ToString>System.Diagnostics.Eventing.Reader.EventLogRecord</ToString>
    <Props>
      <I32 N="Id">3</I32>
```

It's kind of a weird structure but we see that our top level element is an `Objs` element with a (dead) link to a schema and a bunch of `Obj` elements inside. The `.Id` attribute the clue is talking about is presumably at `<Obj>.Props.I32` where N="Id".

```
PS /home/elf> $doc.Objs.Obj | % {$_.Props.I32.where({$_.N -eq "Id"})} | Group-Object '#text'

Count Name                      Group
----- ----                      -----
    1 1                         {I32}
   39 2                         {I32, I32, I32, I32…}
  179 3                         {I32, I32, I32, I32…}
    2 4                         {I32, I32}
  905 5                         {I32, I32, I32, I32…}
   98 6                         {I32, I32, I32, I32…}
```

We take in every object, then map each one to its child I32s that have N="Id". At this point we technically have a 2D array, but the pipe then flattens it out so `Group-Object` just gets an array of `I32` objects. We then tell it to group by the actual inner text value (the id) and we see we're looking for the only event with ID 1.

It seems like we could try to read the `Group` property, but remember that's just our I32 rather than the full context. 

It's possible to filter the parsed XML structure we already have, but since we know we're looking for `<I32 N="Id">1</I32>`, we can just search through the file and read the XML ourselves. After some experimentation with the `-Context` param,

```
PS /home/elf> type ./EventLog.xml | select-string '<I32 N="Id">1</I32>' -Context 8,140

PS /home/elf> type ./EventLog.xml | select-string '<I32 N="Id">1</I32>' -Context 8,140
    <Obj RefId="1800">
      <TN RefId="1800">
        <T>System.Diagnostics.Eventing.Reader.EventLogRecord</T>
        <T>System.Diagnostics.Eventing.Reader.EventRecord</T>
        <T>System.Object</T>
      </TN>
      <ToString>System.Diagnostics.Eventing.Reader.EventLogRecord</ToString>
      <Props>
>       <I32 N="Id">1</I32>
        <By N="Version">5</By>
        
        [...]

            <Obj RefId="18016">
              <TNRef RefId="1806" />
              <ToString>System.Diagnostics.Eventing.Reader.EventProperty</ToString>
              <Props>
                <S N="Value">C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe 
-c "`$correct_gases_postbody = @{`n    O=6`n    H=7`n    He=3`n    N=4`n    Ne=22`n
Ar=11`n    Xe=10`n    F=20`n    Kr=8`n    Rn=9`n}`n"</S>
              </Props>
```

So we now know our final parameters are:

```
temperature = -33.5
refraction = 1.867
angle = 65.5
correct_gases = O=6 H=7 He=3 N=4 Ne=22 Ar=11 Xe=10 F=20 Kr=8 Rn=9
```

So now let's set our properties like the API docs told us to:

```
PS /home/elf> (Invoke-WebRequest -Uri 'http://localhost:1225/api/refraction?val=1.867').RawContent
HTTP/1.0 200 OK                                                                           
Server: Werkzeug/0.16.0                                                                   
Server: Python/3.6.9                                                                      
Date: Thu, 26 Dec 2019 15:00:33 GMT                                                       
Content-Type: text/html; charset=utf-8
Content-Length: 87

Updated Lense Refraction Level - Check /api/output if 5 Mega-Jollies per liter reached.
PS /home/elf> (Invoke-WebRequest -Uri 'http://localhost:1225/api/temperature?val=-33.5').RawContent

[...]

PS /home/elf> (Invoke-WebRequest -Uri 'http://localhost:1225/api/angle?val=65.5').RawContent
[...]
PS /home/elf> (Invoke-WebRequest -Uri 'http://localhost:1225/api/gas' -Method POST -Body @{O=6; H=7; He=3; N=4; Ne=22; Ar=11; Xe=10; F=20; Kr=8; Rn=9}).RawContent
[...]

PS /home/elf> (Invoke-WebRequest -Uri 'http://localhost:1225/api/on').RawContent
[...]

PS /home/elf> (Invoke-WebRequest -Uri 'http://localhost:1225/api/output').RawContent
HTTP/1.0 200OK                                                                           
Server: Werkzeug/0.16.0                                                                   
Server: Python/3.6.9                                                                      
Date: Thu, 26 Dec 2019 15:09:31 GMT               
Content-Type: text/html; charset=utf-8
Content-Length: 200

Success! - 6.70 Mega-Jollies of Laser Output Reached!

```