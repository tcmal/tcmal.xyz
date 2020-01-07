# Frosty Keypad

Just by looking at the keypad we can tell the numbers that are used regularly are 1, 3 and 7. And no, `1337` doesn't work.

We're also told:
  - One digit is repeated once
  - The code is a prime number

From the first clue, our code is some combination of `{1,3,7,3}, {1,3,7,1}, {1,3,7,7}`. This means our keyspace is all permutations of these 3 sets unioned (concatenated). We'll also filter out the duplicates:

```python
from itertools import permutations

# Union
keyspace = []
keyspace += list(permutations([1, 3, 7, 1]))
keyspace += list(permutations([1, 3, 7, 3]))
keyspace += list(permutations([1, 3, 7, 7]))

# Filter unique and make them numbers while we're at it
keyspace = [int("".join(str(a) for a in x)) for i,x in enumerate(keyspace) if keyspace.index(x) == i]

print(len(keyspace)) # 36
print(keyspace[0]) # 1371 (int)
```

36 is reasonable, but still a bit much to brute-force. Luckily, we can still filter out some using the second clue:

```python
def is_prime(x):
	for i in range(2, x):
		if x % i == 0:
			return False
	return True

keyspace = [x for x in keyspace if is_prime(x)]

print(keyspace) # [1373, 1733, 3137, 3371, 7331]
```

Since they're all pretty small numbers, we don't care about the terrible performance of our is_prime implementation, especially since I was doing this mostly from the REPL. Now we know there's only 5 combinations our code could possibly be, which is very easy to just manually check each one. 

The answer is 7331.