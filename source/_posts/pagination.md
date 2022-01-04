---
title: Pagination for Dummies
date: 2020-04-04 12:00:00
tags:
  - react
  - mobx
  - prototyping
  - npm
category: Web Development
---

Pagination is a really simple feature that a lot of prototypes seem to miss out. You have a lot of data and you want to split it up. Because we're React developers, our first instinct tells us to pull in a package and get on with other stuff. But for a prototype, we really just need a minimal implementation. So instead, let's do it ourselves.

The first 'gotcha' with pagination is that you need to be careful with how you split it. Take a user's homepage with a bunch of posts ordered newest first. Since we're sorting by newest first, someone might make a post in the time it takes us to scroll through a page and hit 'next'. If we just use tell the server to give us the homepage, but skip the first 20, we'll end up with a post from our first page pushed onto the top of our second. This gets worse the more prone our data is to updating.

![Alt Text](https://dev-to-uploads.s3.amazonaws.com/i/292mbeqrq8cy0rqetf04.png)

For this reason it's important that you paginate based on whatever you're sorting by and pass the last element's key as an `after` parameter. This way, we anchor ourselves to the last element we've seen, no matter what's happening with the rest of the data.

# Example implementation

Here's an easy implementation of using `after` to paginate some fake posts. I'm using MobX and React but it should be easy enough to change it to whatever you want. We use created_at as an index and assume when we get more items they're always sorted by that.

```jsx
export default class HomePageModel {
    @observable
    posts = [];

    @observable
    after = undefined;

    @observable
    pageSize = 20;

    // Returns only what should be viewable on the page
    @computed get currentPage() {
        // If we have after, Find where it points at
        // Otherwise, 0
        let start = this.after !== undefined ? this.posts.findIndex(x => x.created_at > this.after) : 0;

        return this.posts.slice(start, start + this.pageSize);
    }

    @computed get hasPrev() {
        return this.after !== undefined;
    }

    @action
    loadNextPage = () => {
        // If this is our initial load we don't need to set after
        // Otherwise, it's created_at of the last thing on our page
        if (this.posts.length > 0)
            this.after = this.posts[this.posts.length - 1].created_at;

        // TODO: Make actual requests to server
        for (let i = 0; i < this.pageSize; i++) {
            this.posts.push(generatePost());
        }
    }

    @action
    loadPrevPage = () => {
        if (!this.hasPrev)
            return;
    
        // The current start of our page
        const startCur = this.posts.findIndex(x => x.created_at > this.after);
        const startPrev = startCur - this.pageSize; // Go back pageSize

        if (startPrev <= 0) {
            // undefined if we're at the start
            this.after = undefined;
        } else {
            // created_at of last thing on our page
            this.after = posts[startPrev - 1].created_at;
        }
    }
}
```

However, right now we're just generating data - when we use a server we'll need to do things async and show that we're loading. We might also get errors from the server. So let's add some properties to show this.

```jsx
export default class HomePageModel {
    
    ...

    @observable
    requestInProgress = false;

    @observable
    error = "";

    ...

    @computed get currentPage() {
        if (this.requestInProgress || this.error)
            return [];
        ...
    }

    ...

    @action
    loadNextPage = () => {
        ...
        // TODO: Make actual requests to server
        this.requestInProgress = true;
        this.error = "";

        setTimeout(action(() => {
            // Error at some point for testing
            if (this.posts.length > 40) {
                this.error = "Ran out of posts!";
            } else {
                for (let i = 0; i < this.pageSize; i++) {
                    this.posts.push(generatePost());
                }
            }

            this.requestInProgress = false;
        }), 1000);
    }
    ...
}
```

We're using `setTimeout()` to simulate an async request. Note that we wrap our inner function in `action()`, since MobX doesn't know about anything we schedule by default. We need to do this for any callbacks that modify state, or our application won't update properly.

If we think about this generally then this code is pretty close to what you need to write for any pagination - As long as you have some sort of field you're sorting by, all that changes is the code to get your items.

# Making a Mixin

A Mixin just adds additional functionality to code we already have.

We're going to define a mixin that, given a function that pulls from a sorted list after a certain point, gives us all our pagination behaviour above. This means less repetition and less code when we eventually need other stuff paginated.

```jsx
export default class PaginationMixin {
    
    @observable
    items = []

    ...

    sorted_by = "";

    // Returns only what should be viewable on the page
    @computed get currentPage() {
        ...
        let start = this.after !== undefined ? this.items.findIndex(x => x[this.sorted_by] > this.after) : 0;
        ...
    }

    @action
    ensureNotEmpty = () => {
        if (this.items.length == 0 && !this.requestInProgress && !this.error) {
            this.loadNextPage();
        }
    }

    @action
    loadNextPage = () => {
        this.requestInProgress = true;
        this.error = "";
        this.doLoadAfter(this.after)
            .then(action('PaginationMixin.LoadDone', (result) => {
                this.items.push(...result)
                this.requestInProgress = false;
            }))
            .catch(action('PaginationMixin.LoadError', (error) => {
                console.log(error);
                this.error = error;
                this.requestInProgress = false;
            }));

    }

    ...
    
    doLoadAfter = (after) => {
        // This should be implemented by the mixin target
        // It should return a promise
        throw new Error("PaginationMixin.doLoadAfter should be overriden by the target class");
    }
}

```

We rename `posts` to `items` and start using `this.sorted_by` to get our position in the list. While we're changing things, we also add an `ensureNotEmpty` action that we can use when our page first loads and add names to our actions so they show up nicer in the debugger.

Now our actual `HomePageModel` is much smaller:

```jsx
export default class HomePageModel extends PaginationMixin {
    // The field we sort by
    sorted_by = "created_at";
    
    doLoadAfter = () => new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simulate an error
            if (this.items.length > 40) {
                reject("No more posts!");
            } else {
                let posts = [];
                for (let i = 0; i < 20; i++) {
                    posts.push(generatePost());
                }

                resolve(posts);
            }
        }, 1000);
    })
}
```

Note that nothing here uses MobX - Everything that changes our actual MobX state is in our mixin. If we want, we can add in extra actions/observables and they'll work just as we expect.

There are some drawbacks to our approach however:

  - If an object has a more complex sort key we won't be able to tell our paginator to address it
  - We're still never culling the items, so our array could end up super big
  - There's no way to forcefully reload a page
  - If doLoadAfter gets less than pageSize elements then going forward will fail
  - Current page, total items, etc.

All of these are easy to add, so I'll leave them for you to do.

After this I also extracted the logic for loading/error states out to another mixin:

```jsx
export default class LoadableMixin {
    @observable
    requestInProgress = true;

    @observable
    error = "";
}

export default class PaginationMixin extends LoadableMixin {
    ...
```

Whilst this doesn't do much right now, it helps us define a convention for our application and can be easily extended in future, giving us free stuff for everything that implements it.

# Actually paginating views

All our hard work has been done already - we can get the items we want to display right now with `.currentPage` and just need to call the appropriate actions to go back/forward.

```jsx
export default observer(() => {

        ...

    content.ensureNotEmpty();

    return (
        <div className="homePage">
            {content.requestInProgress ? <p className="loading">Loading...</p>
                : ''}
            {content.error ? <p className="error"></p>
                : ''}

            <PostList contents={content.currentPage}
                hasPrev={content.hasPrev}
                onNextPage={content.loadNextPage}
                onPrevPage={content.loadPrevPage} />
        </div>
    )
});
```

PostList:

```jsx
export default observer(({ onNextPage, onPrevPage, contents, hasPrev }) => (
    <section className="postList">
        {contents.map(x => 
            <PostListItem key={x.id} item={x} />
        )}

        {hasPrev ? <button onClick={onPrevPage} className="btn prev">Previous</button> : ''}
        <button onClick={onNextPage} className="btn next">Next</button>
    </section>
));
```

Easy! In fact, if we want to make it even easier we can extract out the pagination and loading parts and, thanks to our mixins, we know exactly what classes our components can work with.

```jsx
export const LoadableWrapper = observer(({ loadable, children }) => {
    if (loadable.requestInProgress) {
        return <p className="loading">Loading...</p>;
    } else if (loadable.error) {
        return <p className="error">{loadable.error}</p>
    } else {
        return <div>{children}</div>;
    }
});

export const PaginationWrapper = observer(({ pagable, children }) => (
    <section className="paginationWrapper">
        
        <LoadableWrapper loadable={pagable}>
            {children}
        </LoadableWrapper>

        {pagable.hasPrev ? <button onClick={pagable.loadPrevPage} className="btn prev">Previous</button> : ''}
        <button onClick={pagable.loadNextPage} className="btn next">Next</button>
    </section>
));
```

Were we using TypeScript for this project we'd be able to actually enforce types and check we're not misusing things at *compile time*.

# Conclusion

Pulling in a whole module for pagination isn't necessary most of the time. And even if you do decide you need to, it's good to have the practice of doing it yourself.

If there are any parts of your application that you've only ever used a module for - try figuring out how they work. You might find there's some trick for your use-case that works much better, or at the very worst you'll just learn something.

Thanks for reading, I hope this was useful for you. If you need clarification on anything then my full code is [here](https://github.com/tcmal/frogger).