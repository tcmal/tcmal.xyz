---
title: No more XSS attacks.
tags:
  - react
  - security
  - xss
  - exploit
category: Web Development
date: 2020-04-06 12:00:00
---

In case you're not familiar, XSS (Cross-site scripting) happens when user input gets rendered as HTML without filtering out scripts, meaning a malicious user can embed some content that does stuff on others accounts when they look at it. The [Samy worm](https://www.vice.com/en_us/article/wnjwb4/the-myspace-worm-that-changed-the-internet-forever) used this technique to get the creator over 1,000,000 friends and a lot of angry emails.

This gets a lot more complicated when you decide you might want to have some HTML tags (`<h1>`, `<strong>`, `<hr>`, etc), but still no scripting. 
Most XSS vulnerabilities involve some sort of weird parsing trick, taking advantage of either an obscure part of the W3C spec or some bug in the browser engine.

For this reason, recreating a server-side parser and sanitising input when we get it is impractical. Luckily, there's a much easier solution:

# Client-Side Sanitisation

Rather than try to copy what the browser does, we just ask it to parse the html document for us, then walk through it and remove anything we don't like.

You can read more about this approach [here](https://developer.mozilla.org/en-US/docs/Web/API/Document_object_model/How_to_create_a_DOM_tree) but most of the hard work is done for us in [`dompurify`](https://github.com/cure53/DOMPurify).

Using DOMPurify is amazingly simple:

``` js
import { sanitize } from "DOMPurify";

// ...

elm.innerHTML = sanitize(evilStuff);
```

Or, in an actual React example:

```jsx
<p className="content" dangerouslySetInnerHTML={{__html: sanitize(post.content)}}></p>
```

Simple. Remember you probably also want to filter out CSS and possibly images, so you should still [read the docs](https://github.com/cure53/DOMPurify). 

This also doesn't protect you entirely from XSS - For example if you use server side rendering or link to URLs users give you (`javascript:` is a valid protocol by most regexes).

# Trust

The main problem with needing to rely on a sanitizer library is that this means the security of every user is in the hands of the small group of maintainers.

This isn't a problem with DOMPurify specifically, but you should keep this in mind and vet each new version before you push it out to your site.

Also keep an eye on the [trusted types](https://web.dev/trusted-types/) API, hopefully coming soon to a browser near you.