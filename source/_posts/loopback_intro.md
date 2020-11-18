---
title: An intro to Loopback
description: Rapid REST API development
tags: 
  - loopback
  - server
  - rest
  - api
category: Web Development
date: 2020-04-05 12:00:00
---

Loopback is a Typescript framework for REST APIs. Not for web apps, nor for websockets (though it can be adapted to both of those) - Specifically for REST APIs. Whilst this seems like a limitation, focusing on this one specific area means that many parts are streamlined for quick development, while also having all the flexibility (and layers of abstraction) of an enterprise application.

So here's a lightning fast tour of how to make an API.

# Models

To keep the actual code seperated from wherever we store our data, there's 2 layers of seperation between our Models and where we store them.

In brief, a `DataSource` (such as an SQL server), is used by a `Repository` to get our `Model`s.

Luckily, a lot of this is already done for us. All we need to do is use the `lb4` command line tool to generate it.

First, make a project:

```
 $ npm install -g @loopback/cli
 $ lb4 frogger-back
? Project description: frogger-back
? Project root directory: frogger-back
? Application class name: FroggerApplication
? Select features to enable in the project (Press <space> to select, <a> to toggle all, <i> to invert selection) Enable eslint, Enable loopbackB
uild, Enable docker, Enable repositories, Enable services
```

There's an easy TUI behind this so it's easy to make it do what you want.
Now we need to make our DataSource. For now, we'll just use the in-memory database. It'll also save our data to a JSON file (which you should remember to gitignore).

```
 $ lb4 datasource
? Datasource name: TestDB
? Select the connector for TestDB: In-memory db (supported by StrongLoop)
? window.localStorage key to use for persistence (browser only): 
? Full path to file for persistence (server only): ./data/db.json
   create src/datasources/test-db.datasource.config.json
```

Now let's scaffold out a model. We even get our properties added for us.

```
 $ lb4 model
? Model class name: User
? Please select the model base class Entity (A persisted model with an ID)
? Allow additional (free-form) properties? No
Model User will be created in src/models/user.model.ts

Let's add a property to User
Enter an empty property name when done

? Enter the property name: name
? Property type: string
? Is name the ID property? Yes
? Is name generated automatically? No
? Is it required?: Yes
? Default value [leave blank for none]: 

Let's add another property to User
Enter an empty property name when done

? Enter the property name: email
? Property type: string
? Is it required?: No
? Default value [leave blank for none]: 

 [...]
```

Now we make our repository that gets Users from the datastore.

```
 $ lb4 repository
? Please select the datasource: TestDbDatasource
? Select the model(s) you want to generate a repository: User
? Please select the repository base class: DefaultCrudRepository (Legacy juggler bridge)
```

While we're at it, we can define some extra validation. Not only does this add it to our model, it also adds it to the input validation on our routes AND to the API docs loopback generates.

```ts
export class User extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    required: true,
    jsonSchema: {
      maxLength: 24,
      minLength: 4,
      pattern: '^[A-z0-9\-_]+$',
      errorMessage: "Username should be between 4 and 24 alphanumeric characters",
    }
  })
  name: string;

  @property({
    type: 'string',
    required: true,
    generated: false
  })
  password: string;

  @property({
    type: 'string',
    required: false,
    jsonSchema: {
      type: 'email'
    }
  })
  email?: string;

  // ...
```

# Controllers

Now we need to actually handle some routes. For that, we use a controller. Like our models, we can generate this automatically, and even make standard CRUD routes.

```
 $ lb4 controller
? Controller class name: User
Controller User will be created in src/controllers/user.controller.ts

? What kind of controller would you like to generate? REST Controller with CRUD functions
? What is the name of the model to use with this CRUD repository? User
? What is the name of your CRUD repository? UserRepository
? What is the name of ID property? name
? What is the type of your ID? string
? Is the id omitted when creating a new instance? Yes
? What is the base HTTP path name of the CRUD operations? /users
```

For some variety, let's look at the automatic docs loopback generates. When we start the server, they're available at `localhost:3000/explorer`.

```
 $ npm start
```

![API Docs](https://dev-to-uploads.s3.amazonaws.com/i/6cv3wz3xlzziwc9mc9v8.png)

So we get count, get all, get detail, 2 versions of update 1, update many and delete. Here's a quick reference of what a route looks like, specifically the create route:

```ts
@post('/users', {
  responses: {
    '200': {
      description: 'User model instance',
      content: {'application/json': {schema: getModelSchemaRef(User)}},
    },
  },
})
async create(
  @requestBody({
    content: {
      'application/json': {
        schema: getModelSchemaRef(User, {
          title: 'NewUser',
          exclude: ['createdAt'],
        }),
      },
    },
  })
  user: Omit<User, 'created_at'>,
): Promise<User> {
  return this.userRepository.create(user);
}
```

All we have is a function with a decorator - our first part (`@post`), defines the types of responses our route will give. Right now our only one is a successful one, which returns an `application/json` response. Loopback lets us generate a schema from our model, so if we're successful we'll just return a User.

The next important part is `@requestBody`, which tells loopback our argument comes from the request body. It's also used to generate documentation. Again, we use `getModelSchemaRef` to give us our User schema, but this time we give it a custom title and exclude a field.

All this work does have a payoff - This defines all the validation for our request body (or, more accurately, inherits it from User), as well as adding it to our docs. Loopback exposes these docs as an [OpenAPI](https://swagger.io/docs/specification/about/) file or as an online playground (which we'll probably want to disable in production).

We're not limited to standard CRUD routes though - Here's a custom route with a body to give you an idea of how the schema objects work.

```ts
@requestBody({
  content: {
    'application/json': {
      schema: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: {
            type: 'string',
          },
          password: {
            type: 'string',
          }
        }
      }
    }
  }
})
```

# Authentication

Authentication seems like a lot of code to set up, this is mostly because of the layers of abstraction we'll use in it. We implement interfaces defined in `@loopback/authentication` and `@loopback/security`.

Specifically, we'll implement a `TokenService` that converts a token to/from a UserProfile. Then, we'll implement a `UserService` that can convert a UserProfile to a User and vice versa, as well as being able to verify credentials and return a User.

So, when we login a user we need to:
  - Verify their credentials, returning a User (UserService)
  - Convert that User to a UserProfile (UserService)
  - Generate a token for that UserProfile (TokenService)

Then, to see the logged in user of a request:
  - Convert their token to a UserProfile (TokenService)
  - Convert that profile to a User (UserService)

I chose to implement JWT and use the `UserRepository`. Here's my [TokenService](https://github.com/tcmal/frogger-back/blob/master/src/services/jwt.service.ts) and [UserService](https://github.com/tcmal/frogger-back/blob/master/src/services/user.service.ts). Hopefully they're pretty self-explanatory.

Now we need to make sure we use the same service everywhere. But what's the point of all our abstraction if we hard-wire one class. So we'll use a 'binding' to tell anywhere we need it what we're using for each service.

```ts
export const TOKEN_SERVICE = BindingKey.create<TokenService>(
  'services.authentication.jwt.tokenservice',
);
```

then we bind a class to it in `application.ts`

```ts
this.bind(TokenServiceBindings.TOKEN_SERVICE).toClass(JWTService);
```

Now our controllers can just ask for whatever's in that binding to be injected. So we'll get the same token service every time.

```ts
constructor(
  @inject(TokenServiceBindings.TOKEN_SERVICE)
  public tokenService: TokenService,
```

Finally, here's the actual code we need for issuing a token:

```ts

const user = await this.userService.verifyCredentials(creds);

const profile = this.userService.convertToUserProfile(user);

const token = await this.tokenService.generateToken(profile);

return {
  token,
  user
}
```

Now to verify it we need to plug in an `AuthenticationStrategy`, which just gets our Authentication from a request.

```ts
export class JWTAuthenticationStrategy implements AuthenticationStrategy {
  name = 'jwt';

  constructor(
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public tokenService: TokenService,
  ) {}

  async authenticate(request: Request): Promise<UserProfile | undefined> {
    const token: string = this.extractCredentials(request);
    const userProfile: UserProfile = await this.tokenService.verifyToken(token);
    return userProfile;
  }

  extractCredentials(request: Request): string {
    if (!request.headers.authorization) {
      throw new HttpErrors.Unauthorized(`Authorization header not found.`);
    }

    const authHeaderValue = request.headers.authorization;

    // ...
  } 
}
```

Note that if someone's authentication fails we throw an `HttpError`, which is automatically converted to an actual HTTP response. This is the general pattern for user errors, meaning most of our code is focused on the success case.

Anyway, we register our authentication strategy in `application.ts`:

```ts
this.component(AuthenticationComponent);
registerAuthenticationStrategy(this, JWTAuthenticationStrategy);
```

Now, FINALLY, when we want to protect a route we just set our authentication strategy and ask for our profile to be injected.

```ts
@authenticate('jwt')
async create(
  @inject(SecurityBindings.USER)
  profile: UserProfile,
```

Now it's in our docs and we get nice error messages for bad tokens, without polluting our actual controller functions.

This was a really brief description of the setup that skimmed over a lot of parts. If you're confused, you can read the [official tutorial](https://loopback.io/doc/en/lb4/Authentication-Tutorial.html) or check out [my code](https://github.com/tcmal/frogger-back)

There's a similar Service/Binding setup for password hashing when we register (or you could hardwire it if you want). Rather than repeating myself, [I'll just link to the code](https://github.com/tcmal/frogger-back/blob/master/src/services/passhash.service.ts).

# Conclusion

Once you get past the learning curve and mediocre docs, loopback does make it really fast to develop APIs. And, thanks to the time we spent on abstraction, It'll be much easier to switch out parts if your application needs to grow, for example using a different session store than JWT or caching things by overriding parts of the repository.

[Here's my code](https://github.com/tcmal/frogger-back/) if you want some clarification, or head to [loopback.io](https://loopback.io/) if you want to learn more.