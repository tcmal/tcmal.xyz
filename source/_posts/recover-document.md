---
title: Recover Cleartext document
categories:
  - Holiday Hack 2019
date: 2020-01-19
---

We're given a `.exe` file, `.pdb` file, and an encrypted PDF file.

We can start by loading up the `.exe` file and reversing it. I did this using ghidra. It's important to import the `.pdb` file before you run auto-analysis, otherwise it'll mess stuff up. Luckily the `.pdb` files do a bunch of the work for us.

First, let's figure out what the encryption does. Ghidra's built-in decompiler does a great job of the `do_encrypt` function, here's it cleaned up a bit.

```c
void do_encrypt(int param_1,char *param_2,char *param_3) {
    /* [variable declarations] */
    /* [stack protections] */
    puVar1 = read_file(param_2,&local_8);
    puVar1 = (uchar *)realloc(puVar1,local_8 + 0x10);
    iVar2 = CryptAcquireContextA
                (&local_10,0,"Microsoft Enhanced Cryptographic Provider v1.0",1,0xf0000000);
    if (iVar2 == 0) {
    fatal_error("CryptAcquireContext failed");
    }
    generate_key((uchar *)&local_1c);
    print_hex("Generated an encryption key",(uchar *)&local_1c,8);
    local_30 = 8;
    local_2f = 2;
    local_2e = 0;
    local_2c = 0x6601;
    local_28 = 8;
    local_24 = local_1c;
    local_20 = local_18;
    iVar2 = CryptImportKey(local_10,&local_30,0x14,0,1,&local_c);
    if (iVar2 == 0) {
        fatal_error("CryptImportKey failed for DES-CBC key");
    }
    iVar2 = CryptEncrypt(local_c,0,1,0,puVar1,&local_8,local_8 + 8);
    if (iVar2 == 0) {
        fatal_error("CryptEncrypt failed");
        exit(1);
    }
    store_key(param_1,(uchar *)&local_1c);
    iVar2 = __iob_func("File successfully encrypted!\n");
    /* [print some ascii art] */
    write_file(param_3,puVar1,local_8);
    free(puVar1);

    /* [stack protections] */
    return;
}
```

So it's using Microsoft's built-in encryption with a key from `generate_key(&buffer)`. From the error message we also know it's using `DES-CBC`. DES is deprecated cos the key sizes are comparatively small, but it's still never been completely cracked. This means we need to figure out the key, presumably by figuring out the random seed used.

```c
void generate_key(uchar *param_1) {
    int iVar1;
    uint local_8;

    iVar1 = __iob_func("Our miniature elves are putting together random bits for your secretkey!\n\n");
    fprintf(iVar1 + 0x40);

    iVar1 = time(0);
    super_secure_srand(iVar1);
    
    local_8 = 0;
    while (local_8 < 8) {
        iVar1 = super_secure_random();
        param_1[local_8] = (uchar)iVar1;
        local_8 = local_8 + 1;
    }
    return;
}

void super_secure_srand(int param_1) {
    int iVar1;
    iVar1 = __iob_func("Seed = %d\n\n",param_1);
    fprintf(iVar1 + 0x40);

    RAND_SEED = param_1;
    return;
}

int super_secure_random(void) {
    RAND_SEED = RAND_SEED * 0x343fd + 0x269ec3;
    return RAND_SEED >> 0x10 & 0x7fff;
}
```

The initial seed is just the result of `time()` which is the unix timestamp, ie the number of seconds since 01/01/1970 00:00:00AM. The challenge text also tells us it was encrypted `06/12/2019 19:00 - 21:00 UTC`, converted to unix time:

```
Start = 1575658800
End = 1575666000
N = 7200
```

Now we need to be able to generate the key given any seed. I used python to re-create the logic of `generate_key()`:

```python
def getKey(seed):
    buf = [0,0,0,0,0,0,0,0]
    for i in range(8):
        seed = seed * 0x343fd
        seed += 0x269ec3
        seed = seed & 0xffffffff

        buf[i] = (seed >> 16) & 0xff
    return buf
```

We need a couple more `&`s since python won't limit our integer sizes like C does. Now we can brute-force the encrypted file. `pycryptodome` is the most common module for this, so we just use its inbuilt `DES-CBC`.

We're pretty sure it's a pdf file, which means the first 4 bytes are `25 50 44 46` or `%PDF`. We just need to try all the seeds in our range and find one where the first 4 bytes are `%PDF`.

```python
from Crypto.Cipher import DES

# Read the file
file = open("file.enc", "rb")
encrypted = file.read()

encsample = encrypted[:16] # Only do the first bit

# Bruteforce
for seed in range(1575658800, 1575666001):
    # Get the key
    key = bytes([x for x in getKey(seed)])

    # Try decrypting
    cipher = DES.new(key, DES.MODE_CBC, iv=b"\0\0\0\0\0\0\0\0")
    dec = cipher.decrypt(encsample)

    # Validity check
    if dec[:4] == b"%PDF":
        print(" --- FOUND")
        print(seed, dec)

        # Now decrypt the full file
        cipher = DES.new(key, DES.MODE_CBC, iv=b"\0\0\0\0\0\0\0\0")
        fulldec = cipher.decrypt(encrypted)
        with open("out.pdf", "wb") as out:
            out.write(fulldec)
```

```
$ python brute.py
 --- FOUND
1575663650 b'%PDF-1.3\n%\xc4\xe5\xf2\xe5\xeb\xa7'
```

Now we have the decrypted file and can read it. The cover subheading is `Machine Learning Sleigh Route Finder`.