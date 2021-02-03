---
title: Asymmetric Encryption in Theory and Practice
tags: 
  - Cryptography
  - Programming
date: 2021-02-01
---

This is some theory and guidance on implementing RSA cryptography and random prime generation. It was originally written for a school project about a year ago. In practice though, [You probably shouldn't roll your own cryptography](https://resources.infosecinstitute.com/topic/the-dangers-of-rolling-your-own-encryption/). If you'd like to see the full source code and writeup this was made with, it's [here](https://github.com/tcmal/ah-project)

Asymmetric cryptography lets you encrypt a message using a key that is
shared publicly, and then allows the encrypted message to be decrypted
using a private key which can be kept secret. The private key can’t be
derived from the public key or from the message, meaning this is often
used to accept messages from anyone who has your key without letting
others read them.

The inverse also works, meaning you can encrypt a message with your
private key and anyone with your public key can decrypt it. Whilst this
isn’t useful on its own, if you know what a message, or part of a
message, should be, and you decrypt it to get that, you can know the
sender does hold the private key. This is known as message signing.

# Theory

The following is not meant as complete proof of the
security/functionality of RSA, rather as a general overview of why it is
difficult to break and why it can be reliably reversed.

RSA relies on the fact that numbers are much easier to multiply than to
factorise. This difference gets more pronounced the bigger the numbers
are, meaning big enough numbers are almost impossible to factorise, but
can still be multiplied relatively quickly<sup>[1]</sup>.

![Factorisation vs Multiplication Time Complexity](/images/asymmetric-factoring-complexity.png)

It can be shown that every non-prime (composite) number can eventually
be factorised down to prime numbers, for example:

{% katex '{"displayMode": "true"}' %}
2 * 2 * 5 * 5 * 5 = 2^2 * 5^3 = 500
{% endkatex %}

Each combination of primes is unique to one composite number, and every
composite number, by definition, has a prime factorisation. This means
if we take 2 primes and multiply them together, we know our original
primes are the only prime factors of that number.

{% katex '{"displayMode": "true"}' %}
n = p * q
{% endkatex %}

This also makes it easy to calculate {% katex %}\phi(n){% endkatex %}. Since p and q are prime,
from Euler’s Totient Theory<sup>[2]</sup>:

{% katex '{"displayMode": "true"}' %}
\phi(pq) = (p - 1)(q - 1)
{% endkatex %}

We now choose {% katex %}e{% endkatex %} (not the constant), which is coprime to {% katex %}\phi(n){% endkatex %}. Then
we find {% katex %}d{% endkatex %} such that {% katex %}de \equiv 1 (\mod \phi(n)){% endkatex %}, which we can do using the
extended Euclidean algorithm.

This gives us the public key: {% katex %}(e, n){% endkatex %} and the private key: {% katex %}(d,n){% endkatex %}.

If we have a number {% katex %}M{% endkatex %} to encrypt ({% katex %}M < n{% endkatex %}), we simply use these
functions:

{% katex '{"displayMode": "true"}' %}
E(M) = M^e (\mod n)
D(C) = C^d (\mod n)
{% endkatex %}

For our uses, signing a number {% katex %}M{% endkatex %} looks like this:

{% katex '{"displayMode": "true"}' %}
S(M) = M^d (\mod n)
{% endkatex %}

And if the following is true, {% katex %}C{% endkatex %} was encrypted using the private key:

{% katex '{"displayMode": "true"}' %}
C^e (\mod n) = M
{% endkatex %}

# Finding p and q

Proving a large number to be prime is far too costly to generate keys,
so instead tests that give a high probability of a given number being
prime will be used, and random numbers generated till we get 2 that have
a high enough probability.

Since every prime takes the form {% katex %}6n + 1{% endkatex %} or {% katex %}6n – 1{% endkatex %} (except 2 and 3),
we can generate {% katex %}n{% endkatex %} randomly and put it in the above equations until we
generate our 2 primes.

Fermat’s Theorem dictates that if {% katex %}x{% endkatex %} is prime, {% katex %}a^x - 1 \equiv 1 (\mod x){% endkatex %} for any values of {% katex %}a{% endkatex %} less than {% katex %}x{% endkatex %}<sup>[3]</sup> However, it’s possible for a number to pass this test even if it
isn’t prime, so another test is needed.

It can be shown that {% katex %}x{% endkatex %} is prime if and only if {% katex %}n^2 = 1 (\mod x){% endkatex %} only when {% katex %}n = \pm 1{% endkatex %}<sup>[4]</sup>. So if we can find {% katex %}n{% endkatex %} such that {% katex %}n^2 (\mod x) \neq \pm 1, n < x{% endkatex %} , we know that {% katex %}n{% endkatex %} is not prime. If we take {% katex %}n^2 = a^x - 1{% endkatex %}, where {% katex %}a{% endkatex %} is from our previous Fermat Test, we know that if {% katex %}x{% endkatex %} is prime it’s also odd, and thus {% katex %}x-1{% endkatex %} is even. This means we can also write {% katex %}a^x - 1 = a^{2^sd}{% endkatex %} (d is odd). This means that for the sequence:

{% katex '{"displayMode": "true"}' %}
a^{2^sd} \mod x, a^{2^{s-1}d} \mod x,  a^{2^{s-2}d} \mod x, ...,  a^{d} \mod x
{% endkatex %}

Each number is a square root of the previous number. If {% katex %}x{% endkatex %} is prime then
for this sequence, either every number is 1, or the first number that
isn’t 1 is {% katex %}x - 1{% endkatex %}.

These 2 techniques can be combined to generate numbers that are likely
to be prime at a relatively low computational cost. Since this will only
be used for key generation, it’s not *as* important that this function
is fast.

# Finding e

e being (relatively) small makes encryption more efficient without affecting security.

Most commonly, e is taken as 65,537 and if this isn’t coprime to {% katex %}\phi(n){% endkatex %}, we choose a different p and q. This is because it’s a relatively large known prime which can fit well within 32 bits.

An alternative way to do this would be to loop from {% katex %}t{% endkatex %} up to {% katex %}\phi(n){% endkatex %} and
find the first integer where {% katex %}gcd(e, \phi(n)) = 1{% endkatex %}.

# Finding d

d can be calculated using the extended Euclidean algorithm<sup>[5]</sup>, which we can use to solve {% katex %}ae + bn = gcd(e, n){% endkatex %}. Since the two are coprime, {% katex %}gcd(x,y) = 1{% endkatex %}. If we apply {% katex %}(\mod n){% endkatex %} to the whole equation, the {% katex %}bn{% endkatex %} disappears so we’re left with {% katex %}ae = 1 (\mod n){% endkatex %}. This means {% katex %}a = d{% endkatex %}.

# Data Padding

For RSA to work, Its required that the message {% katex %}M < n{% endkatex %}. An easy way
to ensure this would be to make sure the number of bits for {% katex %}M{% endkatex %} is less
than {% katex %}n{% endkatex %}. If the message is longer than that length, we can split it into
many smaller parts and encrypt these parts individually. For
convenience, A padding function will be used to make sure every message
is the same length of bits.

OAEP is the standard padding scheme specified by PKCS\#1 and used by
most implementations. This requires a function for generating random
bytes as well as a hashing function. If the final {% katex %}M{% endkatex %} passed
to the RSA signing function is {% katex %}k{% endkatex %} bits long, half of {% katex %}k{% endkatex %} will be
allocated to the actual message and the other half to the random seed.
This means {% katex %}k{% endkatex %} is twice the length of the output from the hash function
used.

If a message spans over more than one padded ‘block’, then the same seed
number should be used by each block. This will prevent being able to
‘swap’ blocks from other encrypted messages into different ones, as the
seed number will likely be different from the rest of the ‘blocks’.

# Size of numbers

The generally accepted size for the modulus {% katex %}n{% endkatex %} is 2048 bits. Since
we’re using a constant for {% katex %}e{% endkatex %} we know that its only 32 bits. {% katex %}d{% endkatex %} is likely
to be closer to the size of the modulus, so we’ll assume its max is the
same as {% katex %}n{% endkatex %}

> Max {% katex %}n{% endkatex %} and {% katex %}d{% endkatex %}: {% katex %}2^{2048} − 1 \approx 3.23 * 10^{616}{% endkatex %}
> Max e: {% katex %}2^32 − 1 = 4,294,967,296{% endkatex %}

(They are all unsigned integers)

# References

[1]: Time Complexity (Exploration), Brit Cruise, Khan Academy,
<https://www.khanacademy.org/computer-programming/time-complexity-exploration/1466763719>

[2]: Euler’s Totient Function, Brit Cruise, Khan Academy,
<https://www.khanacademy.org/computing/computer-science/cryptography/modern-crypt/v/euler-s-totient-function-phi-function>

[3]: Primality Tests, Ben Lynn, Stanford University,
<https://crypto.stanford.edu/pbc/notes/numbertheory/millerrabin.html>

[4]: Roots of Polynomials, Ben Lynn, Stanford University,
<https://crypto.stanford.edu/pbc/notes/numbertheory/poly.html>

[5]: Extended Euclidean Algorithm, Thaddeus Abiy, Brilliant,
<https://brilliant.org/wiki/extended-euclidean-algorithm/>