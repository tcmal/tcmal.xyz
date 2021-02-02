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

$$
2 * 2 * 5 * 5 * 5 = 2^2 * 5^3 = 500
$$

Each combination of primes is unique to one composite number, and every
composite number, by definition, has a prime factorisation. This means
if we take 2 primes and multiply them together, we know our original
primes are the only prime factors of that number.

$$
n = p * q
$$

This also makes it easy to calculate $\phi(n)$. Since p and q are prime,
from Euler’s Totient Theory<sup>[2]</sup>:

$$
\phi(pq) = (p - 1)(q - 1)
$$
We now choose $e$ (not the constant), which is coprime to $\phi(n)$. Then
we find $d$ such that $de \equiv 1 (\mod \phi(n))$, which we can do using the
extended Euclidean algorithm.

This gives us the public key: $(e, n)$ and the private key: $(d,n)$.

If we have a number $M$ to encrypt ($M < n$), we simply use these
functions:

$$
E(M) = M^e (\mod n)
D(C) = C^d (\mod n)
$$

For our uses, signing a number $M$ looks like this:

$$
S(M) = M^d (\mod n)
$$

And if the following is true, $C$ was encrypted using the private key:

$$
C^e (\mod n) = M
$$


# Finding p and q

Proving a large number to be prime is far too costly to generate keys,
so instead tests that give a high probability of a given number being
prime will be used, and random numbers generated till we get 2 that have
a high enough probability.

Since every prime takes the form $6n + 1$ or $6n – 1$ (except 2 and 3),
we can generate $n$ randomly and put it in the above equations until we
generate our 2 primes.

Fermat’s Theorem dictates that if $x$ is prime,
$a^x - 1 \equiv 1 (\mod x)$ for any values of $a$ less than
$x$<sup>[3]</sup> However, it’s possible for a number to pass this test even if it
isn’t prime, so another test is needed.

It can be shown that $x$ is prime if and only if
$n^2 = 1 (\mod x)$ only when $n = \pm 1$<sup>[4]</sup>. So if we can find
$n$ such that $n^2 (\mod x) \neq \pm 1$,  $n < x$ , we know
that $n$ is not prime. If we take $n^2 = a^x - 1$,
where $a$ is from our previous Fermat Test, we know that if $x$ is prime
it’s also odd, and thus $x-1$ is even. This means we can also write
$a^x - 1 = a^{2^sd}$ (d is odd).
This means that for the sequence:

$$
a^{2^sd} \mod x, a^{2^{s-1}d} \mod x,  a^{2^{s-2}d} \mod x, ...,  a^{d} \mod x
$$

Each number is a square root of the previous number. If $x$ is prime then
for this sequence, either every number is 1, or the first number that
isn’t 1 is $x - 1$.

These 2 techniques can be combined to generate numbers that are likely
to be prime at a relatively low computational cost. Since this will only
be used for key generation, it’s not *as* important that this function
is fast.

# Finding e

$e$ being (relatively) small makes encryption more efficient without
affecting security.

Most commonly, e is taken as 65,537 and if this isn’t coprime to
$\phi(n)$, we choose a different p and q. This is because it’s a
relatively large known prime which can fit well within 32 bits.

An alternative way to do this would be to loop from $t$ up to $\phi(n)$ and
find the first integer where $gcd(e, \phi(n)) = 1$.

The first method will be used in order to reduce the complexity of the
code and to put the generation algorithm more in line with accepted
standards.

# Finding d

$d$ can be calculated using the extended Euclidean algorithm<sup>[5]</sup>, which
we can use to solve $ae + bn = gcd(e, n)$. Since the two are coprime,
$gcd(x,y) = 1$. If we apply $(\mod n)$ to the whole equation, the $bn$
disappears so we’re left with $ae = 1 (\mod n)$. This means $a = d$.

# Data Padding

For RSA to work, Its required that the message $M < n$. An easy way
to ensure this would be to make sure the number of bits for $M$ is less
than $n$. If the message is longer than that length, we can split it into
many smaller parts and encrypt these parts individually. For
convenience, A padding function will be used to make sure every message
is the same length of bits.

OAEP is the standard padding scheme specified by PKCS\#1 and used by
most implementations. This requires a function for generating random
bytes as well as a hashing function. If the final $M$ passed
to the RSA signing function is $k$ bits long, half of $k$ will be
allocated to the actual message and the other half to the random seed.
This means $k$ is twice the length of the output from the hash function
used.

If a message spans over more than one padded ‘block’, then the same seed
number should be used by each block. This will prevent being able to
‘swap’ blocks from other encrypted messages into different ones, as the
seed number will likely be different from the rest of the ‘blocks’.

# Size of numbers

The generally accepted size for the modulus $n$ is 2048 bits. Since
we’re using a constant for $e$ we know that its only 32 bits. $d$ is likely
to be closer to the size of the modulus, so we’ll assume its max is the
same as $n$

> Max $n$ and $d$: $2^{2048} − 1 \approx 3.23 * 10^{616}$
> Max e: $2^32 − 1 = 4,294,967,296$

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