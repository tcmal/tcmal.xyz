# Smart Braces

There's a lot of resources for learning `iptables`, [this one](https://www.howtogeek.com/177621/the-beginners-guide-to-iptables-the-linux-firewall/) covers a lot of the common things.

First, we clear out all the existing rules:

~~~
sudo iptables -F
~~~

Then we make sure we DROP everything by default for all chains:

~~~
sudo iptables -P FORWARD DROP
sudo iptables -P INPUT DROP
sudo iptables -P OUTPUT DROP
~~~

We need to accept input and output for connections we've already established, which saves us a few rules and gives most packets an early out. `-m state` includes the connection state module, then `--state` filters by connection state.

~~~
sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
sudo iptables -A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
~~~

Now we accept all incoming traffic from the specified IP and port. Since this is traffic coming in, the destination is the port we're recieving it on.

~~~
sudo iptables -A INPUT -p tcp -s 172.19.0.225 --dport 22 -m state --state NEW,ESTABLISHED -j ACCEPT
~~~

Now we allow incoming connections to ports 21 and 80.

~~~
sudo iptables -A INPUT -p tcp --dport 21 -m state --state NEW,ESTABLISHED -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -m state --state NEW,ESTABLISHED -j ACCEPT
~~~

Finally, we allow any packets that are going out to port 80.

~~~
sudo iptables -A OUTPUT -p tcp --dport 80 -m state --state NEW,ESTABLISHED -j ACCEPT
~~~

As a final note, we should also allow anything on the `lo` interface, so `localhost` still works.

~~~
sudo iptables -A INPUT -i lo -j ACCEPT
~~~
