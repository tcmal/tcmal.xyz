---
title: Rust Type Lists
tags: 
  - Rust
category: Software Development
date: 2021-08-14
---

Recently, I've been working on a more modular framework for game engines. Essentially, you need only implement a `DrawPass`, which takes in some context and renders to the given frame.

```rust
trait DrawPass {
    // Simplified. This would probably contain the game state, a command buffer, and the image view to draw to.
    fn render(&self);
}

// ...

struct MapDrawPass {
    camera_fov: f32,
}

impl DrawPass for MapDrawPass {
    fn render(&self) {
        todo!()
    }
}
```

This works great for simple scenes, but it's not very flexible. Most modern games have different parts to drawing that happen one after the other. For example, the level is drawn, then the viewmodels on top, and then the UI. In some cases, we also apply effects to the whole screen, such as 'night vision' or 'nausea'.

However, in the interest of simplifying the framework code, it would be easier to pretend there's only one draw pass as much as we can. After all, from its perspective it only needs to get an image to draw to, give it to the draw pass, then present it to the screen.

# Decided at runtime

Here's a somewhat naive approach where we simply throw it in a list:

```rust
struct ManyDrawPasses(Vec<Box<dyn DrawPass>>);
impl DrawPass for ManyDrawPasses {
    fn render(&self) {
        for p in self.0.iter() {
            p.render()
        }
    }
}

// ...
struct One;
impl DrawPass for One {
    fn render(&self) {
        println!("1");
    }
}

// ...

fn main() {
    let dp = ManyDrawPasses ( vec![One, Two, Three] )
    dp.render(); // 1 2 3
}
```

This is pretty simple, and easy to use, but has some downsides. Besides the overhead of a `Vec`, the line `p.render()` is actually deceptively complex. It needs to:

1. Dereference the borrow to a Box
2. Dereference the Box to get a vtable address
3. Look up this vtable address, plus a specific offset to get the function's address.
4. Call this function

On a modern system, this is almost certainly negligible. But, since this is being called every frame, there's no harm in seeing how we can make it faster.

Luckily, Rust lets us have zero-cost generics, meaning that as long as we can know the type of each `p` at compile time, it can be just like any other function call.
As long as we're ok with deciding our draw passes at compile time, we can make this work.

# Recursive definition

Although rust doesn't have native support for lists of types defined at compile time, we can use a recursive definition of a list to get the same effect.

Essentially, every list is either a single element (in which case we just pass it in directly), or it's one element, then another list (or single element for the end).

```rust
struct ConsDrawPass<A, B> {
    a: A,
    b: B,
}
impl<A: DrawPass, B: DrawPass> DrawPass for ConsDrawPass<A, B> {
    fn render(&self) {
        self.a.render();
        self.b.render();
    }
}
// ...

fn main() {
    let dp = ConsDrawPass { a: One, b: Two };
    dp.render(); // 1 2

    let dp2 = ConsDrawPass { a: One, b: ConsDrawPass { a: Two, b: Three } };
    dp.render(); // 1 2 3
}
```

So, we have our compile-time sized list, and once the compiler comes in to optimise it, we have it with zero cost.

# Positional awareness

It might happen that you need the first element called to do something special, or the end. For instance, in Vulkan the image we draw to starts in `Layout::Undefined`, should probably be passed from the first to the 2nd in `Layout::ColorAttachmentOptimal`, and needs to come out the end in `Layout::Present`.

Whilst we can easily add code between each element by putting it in `ConsDrawPass`, we can't really have stuff specifically at the beginning or end without modifying our framework.
Let's try letting our draw passes know roughly where they are with a type enum.

```rust
// In practice you would probably seal this trait.
pub trait PassPosition {}

pub struct Beginning;
impl PassPosition for Beginning {}

pub struct Middle;
impl PassPosition for Middle {}

pub struct End;
impl PassPosition for End {}

// Our renderer code expects to call DrawPass<Singular>, and ignores everything else.
pub struct Singular;
impl PassPosition for Singular {}

// ...

trait DrawPass<P: PassPosition> {
    fn render(&self);
}

// ...

struct One;
impl<P: PassPosition> DrawPass<P> for One { // Implemented for any position
    fn render(&self) {
        println!("1 {}", std::any::type_name::<P>());
    }
}

// ...

fn main() {
    let dp = One;
    DrawPass::<Singular>::render(&dp); // 1 Singular
}
```

This works well. We can even implement `DrawPass` for only one position, if we're sure something should only be at the start or the end.
But what about our `ConsDrawPass`? Well, we could just add some more generic arguments:

```rust
struct ConsDrawPass<A, B, AP, BP> {
    a: A,
    b: B,
    _d: PhantomData<(AP, BP)>,
}
impl<A, B, AP, BP, P> DrawPass<P> for ConsDrawPass<A, B, AP, BP>
where
    A: DrawPass<AP>,
    AP: PassPosition,
    B: DrawPass<BP>,
    BP: PassPosition,
    P: PassPosition,
{
    fn render(&self) {
        self.a.render();
        self.b.render();
    }
}

// ...

fn main() {
    let dp: ConsDrawPass<One, ConsDrawPass<Two, Three, Middle, End>, Beginning, Middle> =
        ConsDrawPass {
            a: One,
            b: ConsDrawPass {
                a: Two,
                b: Three,
                _d: PhantomData,
            },
            _d: PhantomData,
        };
    DrawPass::<Singular>::render(&dp); // 1 Beginning 2 Middle 3 End
}
```

And it works but... yikes. Not only is there nothing stopping us from putting our beginning middle and ends wherever we like, but we have to specify all the types ourselves. Let's start back at the beginning.

We know that the outermost `ConsDrawPass` is the one that's being asked to render. Since our renderer is always calling `DrawPass::<Singular>::render`, We know that whenever `DrawPass<Singular>` is used, `a` is at the beginning. Let's consider 2 items, the minimal case, for now, and just say the last one is at the end.

```rust
impl<A, B> DrawPass<Singular> for ConsDrawPass<A, B>
where
    A: DrawPass<Beginning>,
    B: DrawPass<End>,
{
    // ...
}
```

Now we also need this to work for larger lists. Assuming we're only ever going to use `ConsDrawPass` as the second element, we know it will be called with `DrawPass<End>`. For a 3 element list, we know `a` should be `Middle` and `b` should be `End`.

```rust

impl<A, B> DrawPass<End> for ConsDrawPass<A, B>
where
    A: DrawPass<Middle>,
    B: DrawPass<End>,
{
    // ...
}
```

Now, if we imagine `b` is another `ConsDrawPass`, we know it's going to be called with `End` again, and so will do the same thing. This means our positions should be inferred for any size list we like!

```rust
fn main() {
    let dp = ConsDrawPass {
        a: One,
        b: ConsDrawPass {
            a: Two,
            b: ConsDrawPass { a: Three, b: Four },
        },
    };
    DrawPass::<Singular>::render(&dp); // 1 Beginning 2 Middle 3 Middle 4 End

    let dp2 = ConsDrawPass { a: One, b: Two };
    DrawPass::<Singular>::render(&dp2); // 1 Beginning 2 End
}
```

Perfect! Rust's type system lets the requirements for each implementation 'bubble upwards', and we only need to specify that we're starting with a `Singular` for everything to fall into place.

# Benchmarking

It's not too hard to reimplement our runtime approach (although this could definitely be done better)

```rust
struct ManyDrawPasses (Box<dyn DrawPass<Beginning>>, Vec<Box<dyn DrawPass<Middle>>>, Box<dyn DrawPass<End>>);
impl DrawPass<Singular> for ManyDrawPasses {
    fn render(&self) {
        self.0.render();
        for dp in self.1.iter() {
            dp.render();
        }
        self.2.render();
    }
}
```

With this, we can run some quick benchmarks of this against our `ConsDrawPass` approach.

```
     Running unittests (target/release/deps/type_lists-f5135a770feae075)

running 2 tests
test compile::bench::compiled_bench ... bench:         292 ns/iter (+/- 7)
test naive::bench::naive_bench      ... bench:         350 ns/iter (+/- 4)

test result: ok. 0 passed; 0 failed; 0 ignored; 2 measured; 0 filtered out; finished in 1.40s

```

As we might expect, there's very little difference. Whether or not this is worth the more complicated code is definitely up for debate, but hopefully this was at least interesting. The full code is [here](https://github.com/tcmal/rust-type-lists).

# Bonus: A simple macro for `ConsDrawPass`

```rust
macro_rules! consdrawpass {
    ($x:expr) => { $x };
    ($x:expr, $($y:expr),+) => { ConsDrawPass { a: $x, b: consdrawpass!($($y),*)} };
}

consdrawpass!(One, Two, Three, Four);
// ConsDrawPass {a: One, b: ConsDrawPass {a: Two, b: ConsDrawPass {a: Three, b: Four}}};
```