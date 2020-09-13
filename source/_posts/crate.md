---
title: Crate
tags: 
  - Javascript
  - Infosec
categories:
  - Holiday Hack 2019
date: 2020-01-19
---

This challenge is 10 locks where you use the devtools to find the 8-digit code for each lock. Every code changes each time.

## Lock 1

Scroll up in the console and you'll see the code in a green square

## Lock 2

Hit print and look at the print preview. If you look closer at the code, there's a stylesheet `print.css` that just makes `.libra strong` visible with a print media query. So we can get the code for this lock with:

```js
document.querySelector('.libra strong').innerText
```

## Lock 3

Fetch is a clue that the `fetch` API was used, which is a nicer way to do AJAX that isn't really ugly. If you scroll through the network tab (and filter by XHR), you'll see an image that's just the white code on a black background.

## Lock 4

If you look in the local storage for the site you can see an entry with no key. The value is the code for this lock.

## Lock 5

If you look in the `<title>` block you see the normal title, `&emsp;` a bunch of times, then the code for this lock.

You can do this with JS as well:

```js
// Last 8 characters of <title> block
document.querySelector('title').innerText.slice(-8)
```

## Lock 6

If you look on the `.hologram` element you can disable the `perspective` style to see the letters in the correct order.

## Lock 7

If you look at the `<head>` element you can see a `style` element with only one rule, which specifies:

```css
font-family: 'AAAAAAAA', 'Beth Ellen', cursive;
```

The first font mentioned is the code.

## Lock 8

If you look at the event listeners for the `span.egg` you see a `spoil` event. If you follow this to the JS and prettify it, it sets `window['CODE'] = 'sad'`.

## Lock 9

In the instructions for this lock, there's a bunch of invisible divs with the class `chakra`. You can use your browser's devtools to set `:active` for each of those elements, which reveals the code.

## Lock 10

If you set the `.cover` to `display:none` then you'll see the code printed on the lower left of the circuit board. If you try to submit however, you'll get an error in your console saying 'Missing macaroni!'.

This is thrown from a try catch block wrapping this:

```js
const _0x2cb37a = document[_0x5a05('0x33')]('\x2e\x6c\x6f\x63\x6b\x73\x20\x3e\x20\x6c\x69\x20\x3e\x20\x2e\x6c\x6f\x63\x6b\x2e\x63\x31\x30\x20\x3e\x20\x2e\x63\x6f\x6d\x70\x6f\x6e\x65\x6e\x74\x2e\x6d\x61\x63\x61\x72\x6f\x6e\x69');
if (!_0x2cb37a)
    throw Error('\x4d\x69\x73\x73\x69\x6e\x67\x20\x6d\x61\x63\x61\x72\x6f\x6e\x69\x21');
_0x2cb37a['\x61\x74\x74\x72\x69\x62\x75\x74\x65\x73']['\x64\x61\x74\x61\x2d\x63\x6f\x64\x65'][_0x5a05('0x30')];
const _0x23999f = document[_0x5a05('0x33')](_0x5a05('0x5d'));
if (!_0x23999f)
    throw Error(_0x5a05('0x5e'));
_0x23999f[_0x5a05('0x2e')][_0x5a05('0x5f')][_0x5a05('0x30')];
const _0x2bbe7a = document[_0x5a05('0x33')](_0x5a05('0x60'));
if (!_0x2bbe7a)
    throw Error(_0x5a05('0x61'));
_0x2bbe7a[_0x5a05('0x2e')][_0x5a05('0x5f')][_0x5a05('0x30')];
_0x19a27e(_0x385f00, {
    '\x69\x64': _0x385f00,
    '\x63\x6f\x64\x65': _0x281576[_0x5a05('0x30')]
});
```

You can use your browser's debugger to break at the top line of this and evaluate the obfuscated parts of this code in the console. Here's the code cleaned up a bit:

```js
const a = document.querySelector(".locks > li > .lock.c10 > .component.macaroni");
if (!a)
    throw Error('Missing macaroni!');
a.attributes['data-code']['value'];
const b = document.querySelector(".locks > li > .lock.c10 > .component.swab");
if (!b)
    throw Error("Missing cotton swab!");
b.attributes['data-code']['value'];
const c = document.querySelector(".locks > li > .lock.c10 > .component.gnome");
if (!c)
    throw Error(_0x5a05('0x61'));
c.attributes['data-code']['value'];

_0x19a27e(_0x385f00, {
    '\x69\x64': _0x385f00,
    '\x63\x6f\x64\x65': _0x281576[_0x5a05('0x30')]
});
```

So directly under `.lock.c10`, we need to have 3 components: `macaroni`, `swab` and `gnome`, and they all need to have a `data-code` attribute. We can add those into the html and submit to unlock the vault.

The villain is the tooth fairy.