---
title: "VueJS Auth Using Laravel Sanctum"
description: "How to set up basic authentication using Laravel Sanctum in a VueJs SPA."
image: "https://res.cloudinary.com/redfern-web/image/upload/v1598516539/redfern-dev/png/laravel-sanctum.png"
tags: ["Laravel", "VueJS"]
published: "2020-01-12"
permalink: "vuejs-auth-using-laravel-sanctum"
---

## VueJS Auth Using Laravel Sanctum

> Please note, this article will help you get set up with very basic authentication using a token stored in local storage. For a more production ready set up I recommend checking out [my new site](https://www.laravelvuespa.com) which covers all you need in much more detail.

[Laravel Sanctum](https://github.com/laravel/sanctum) is a new package built by Taylor offering a simple authentication system for SPA's. Having just completed my first large SPA using VueJS and Laravel as the API I thought it would be good to dive into Sanctum and see how it works.

You can find the source code to the demos I set up here:

- [Laravel API](https://github.com/garethredfern/sanctum-api)
- [VueJS SPA](https://github.com/garethredfern/sanctum-vue)

The first thing to do is set up your Laravel project as you normally would, install [Sanctum](https://github.com/laravel/sanctum). Run the migrations and seed the database with the user seed so that you have a user to test auth against.

With Laravel set up there were two controllers needed to give us basic login and logout for the SPA:

- [Login Controller](https://github.com/garethredfern/sanctum-api/blob/master/app/Http/Controllers/API/Auth/LoginController.php)
- [Logout Controller](https://github.com/garethredfern/sanctum-api/blob/master/app/Http/Controllers/API/Auth/LogoutController.php)

The code in these two controllers basically follows the instructions provided in the Sanctum [instructions](https://laravel.com/docs/8.x/sanctum#issuing-mobile-api-tokens) and should be fairly self explanatory. The login controller checks the users credentials and on success creates a token in the `personal_access_tokens` table. The logout controller then clears out this token.

### VueJS SPA

The VueJs SPA is a little more involved but I have tried to keep things simple for this example. I used the Vue CLI to scaffold things installing the following packages:

- [Vue Router](https://router.vuejs.org/)
- [Vuex](https://vuex.vuejs.org/)
- [Axios](https://github.com/axios/axios)
- [Tailwind CSS](https://tailwindcss.com/)

I will assume you have some experience working with the above technologies to keep this post as short as possible but if you have any questions on this setup please feel free to create an issue on the repo.

### Setting Up Axios

First set up the [services](https://github.com/garethredfern/sanctum-vue/tree/master/src/services) folder to keep all the API related files. While this is not necessary I found it really useful when building out large-scale apps. Any endpoints you need to access are held in a `service.js` file, organized by each Laravel controller. So for example all auth methods are held in a single [auth service](https://github.com/garethredfern/sanctum-vue/blob/master/src/services/AuthService.js) file. Each service file imports the main [API service](https://github.com/garethredfern/sanctum-vue/blob/master/src/services/API.js) which is where the SPA does all the handling of tokens and logs the user out if Laravel sends a 401 (unauthorized) response.

### Protecting Routes in a Vue SPA

The method for protecting your application routes is fairly simple. In the [router](https://github.com/garethredfern/sanctum-vue/blob/master/src/router.js) file there is a meta field `requiresAuth` it's a boolean held against every route you want to protect. Using the Vue router [beforeEach method](https://github.com/garethredfern/sanctum-vue/blob/master/src/router.js#L39) check for a valid token which is held in local storage if it exists then the user is allowed to view the page. I wrote about this in more detail [in another article](/articles/authenticate-users-using-firebase-and-vuejs) if you are interested to learn more on this approach.

### Notes on CORS

As the SPA is usually running on a separate domain name to the API, you have to work with CORS. Julia Evans has posted some great sketches that explain this tricky subject:

- [why the same origin policy matters](https://twitter.com/b0rk/status/1163460967067541504)
- [CORS](https://twitter.com/b0rk/status/1162392625057583104)

From 7.0 Laravel comes with [CORS](https://laravel.com/docs/7.x/routing#cors) support built in. Once you go live change the `allow_origins` parameter to the SPA URL to keep things secure.

If you use the VueJs CLI (which I recommend) you can set it to [proxy your API URL](https://cli.vuejs.org/config/#devserver-proxy) so that it respects localhost. This took a bit of figuring out but if you have your local version of Laravel running at `sanctum-api.test` then you add this in your `vue.config.js` file:

```js
module.exports = {
  devServer: {
    proxy: "sanctum-api.test",
  },
};
```

With this in place, you then call your API endpoints using `http://localhost:8080/` or whatever your SPA is running at via the Vue CLI and you will not get all the frustrating CORS errors that I initially encountered during SPA development.

### Summary

I hope this short post and example projects will help explain my approach to building auth into a VueJS SPA with a Laravel API. For most projects Sanctum definitely feels like it has achieved what it set out to provide "a featherweight authentication system for SPAs and simple APIs".

Further Reading: [Authentication Using Laravel Sanctum & Fortify for an SPA](/articles/authentication-laravel-sanctum-fortify-for-an-spa/).
