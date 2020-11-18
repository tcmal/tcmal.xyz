---
title: Planning projects with UML and ERDs
date: 2020-04-03 12:00:00
tags:
  - development
  - uml
  - db
category: Software Development
---

Before we start a project we want to know what it is we're actually going to develop. That's what UML (Universal Modelling Language) is for -

![Usecase Diagram](https://dev-to-uploads.s3.amazonaws.com/i/m96lxz1oazt3vyj9tq4i.png)

In case you're not used to UML, the little stick figure represents a type of user, for example, someone who hasn't yet registered, and the ellipses things that users want to do.
Arrows between people mean inheritance, so a registered user should be able to do everything an unregistered user can do and more.

The example above is a simple reddit clone. Since it's pretty simple to understand, let's run with it.

# Database

Let's start by throwing the main entities we can think of easily into an ERD (Entity Relationship Diagram). This is used to show the relationships between what will eventually become our tables but doesn't yet focus on what's actually in our entities or how we link them.

![Initial ERD](https://dev-to-uploads.s3.amazonaws.com/i/ahxemuyh6qizu7fmy3hq.png)

In case you're not used to it, or you happen to use a different convention a line means the relationship is singular on that side, whereas 3 lines (crow's feet) means it's many/plural on that side.

As well as these, we also have circles to mean optional on that side, and a second line to mean mnandatory. So, for example, User is One Mandatory to Many Optional Posts. This means a user can have 0 or a million posts, but each post must have exactly one user.

Also, Comment has a recursive relationship: Each comment optionally has many replies and is also, optionally, a reply to another comment. This lets us nest comments as deep as we like.

Now let's model our user subscriptions. We also add in captions to our relationships to explain them a bit more.

![Subscribed relationship](https://dev-to-uploads.s3.amazonaws.com/i/lvgexn4am6nj0htgt3my.png)

But there's a problem with this: were we to model this in SQL we'd need to have a field with multiple values: Either the User table has a list of subscriptions in it or our Subreddit table as a list of subscribers in it. We need to extract this out to some other entity to make it work.

![Subscription Entity](https://dev-to-uploads.s3.amazonaws.com/i/chbxrxpkrd3454rogr3r.png)

Our subscription entity links one user to one subreddit, but since each user can have many of them, and each subreddit can have many of them, we can use this to resolve our Many-to-Many relationship.

Now let's plan out our attributes, along with optionality and keys. We'll also add in upvote functionality.

![Completed ERD](https://dev-to-uploads.s3.amazonaws.com/i/qvot4gyal8qbll6k9019.png)

At this stage, we're not planning data-types because our design is still *implementation-agnostic*. We could implement this on any SQL platform, or any relational database. 

As boring as making diagrams is, it's still a great way to plan out any piece of software. Consider trying it in your own projects, partly so you don't have to rewrite large parts because you forgot something, but also so you have a clear end goal.