---
title: "Authentication in a Vue SPA with Laravel Sanctum & Fortify"
description: "How to set up full authentication using Laravel Sanctum & Fortify in a Vue SPA. Vue SPA Article"
image: "https://res.cloudinary.com/redfern-web/image/upload/v1609319409/redfern-dev/png/laravel-vue.png"
tags: ["Laravel", "VueJS"]
published: "2020-12-30"
---

## Authentication in a Vue SPA with Laravel Sanctum & Fortify

Following on from building the authentication element of a Laravel API with Sanctum & Fortify, this article will take you through building the Vue SPA. The objective is to have a completely separate API and SPA which can leverage all of Laravel’s authentication using sessions and cookies.

**It’s important to highlight that this requires the SPA and API to share the same top-level domain. However, they may be placed on different subdomains.**

The project files for this article can be found on Github:

- [Larvel API](https://github.com/garethredfern/laravel-api)
- [VueJS SPA](https://github.com/garethredfern/laravel-vue)

Make sure to check out the [demo app](https://www.laravelvuespa.app) and [full documentation](https://www.laravelvuespa.com) for this project. It covers additional features such as uploading files and pagination.

### Setting Up Vue

This article assumes you have some experience working with VueJS, its router and state management package Vuex.

Using the Vue CLI to scaffold things install the following packages:

- [Vue Router](https://router.vuejs.org/)
- [Vuex](https://vuex.vuejs.org/)
- [Axios](https://github.com/axios/axios)
- [Tailwind CSS](https://tailwindcss.com/)

### Auth Endpoints & CORS

First set up the [Auth Services File](https://github.com/garethredfern/laravel-vue/blob/main/src/services/AuthService.js) to keep all the API Auth endpoints in one place. The methods in this file interact with the Fortify endpoints we have [previously set up](/articles/authentication-laravel-sanctum-fortify-for-an-spa#setting-up-fortify). At the top of the file Axios is imported to handle the data fetching from our API.

An important note is that you must set the following in the axios create method:

```js
withCredentials: true;
```

A XMLHttpRequest from a different domain cannot set cookie values for its domain unless `withCredentials` is set to `true` before making the request.

### Sessions, Cookies & CSRF

To authenticate your SPA, the login page should first make a request to the `/sanctum/csrf-cookie` endpoint to initialise CSRF protection for the application:

```js
await authClient.get("/sanctum/csrf-cookie");
```

This also applies to any other Fortify actions which require CSRF protection. Note the other routes in the services/AuthService.js file that also include a get request for the CSRF cookie; forgotPassword, resetPassword etc.

If a login request is successful, the user is authenticated and subsequent requests to the SPA will automatically be authenticated via the session cookie that the Laravel application issues. In addition, since we already made a request to the /sanctum/csrf-cookie route, subsequent requests should automatically receive CSRF protection because Axios automatically sends the XSRF-TOKEN cookie in the X-XSRF-TOKEN header.

### Protecting Routes & Maintaining State

The method for protecting your application routes is fairly simple. In the [router](https://github.com/garethredfern/laravel-vue/blob/main/src/router/index.js) file there is a meta field `requiresAuth` it's a boolean held against every route you want to protect. Using the Vue router `beforeEach` method check if a route has a `requiresAuth` boolean of `true` and there is an authenticated user held in [Auth Vuex Store](https://github.com/garethredfern/laravel-vue/blob/main/src/store/modules/auth.js):

```js
router.beforeEach((to, from, next) => {
  const authUser = store.getters["auth/authUser"];
  const reqAuth = to.matched.some((record) => record.meta.requiresAuth);
  const loginQuery = { path: "/login", query: { redirect: to.fullPath } };

  if (reqAuth && !authUser) {
    store.dispatch("auth/getAuthUser").then(() => {
      if (!store.getters["auth/authUser"]) {
        next(loginQuery);
      } else {
        next();
      }
    });
  } else {
    next(); // make sure to always call next()!
  }
});
```

A few scenarios need to be handled here:

1. If there is an authenticated user in the Vuex state, the route allows the page to load.
2. If there is no authenticated user in state then make a call to the Laravel API to check if there is an authenticated user which ties in with the session. Assuming there is, the Vuex store will be populated with the user details. The router allows the page to load.
3. Finally, if there is no valid session then redirect to the login page.

Refreshing the browser will send a GET request to the API for the authenticated user, store the details in Vuex state. Navigating around the application will use the auth Vuex state to minimise API requests, keeping things snappy. This also helps with security. Any time data is fetched from the API, Laravel checks the session. If the session becomes invalid a 401 or 419 response is sent to the SPA. Handled via an Axios interceptor, logging the user out.

```js
authClient.interceptors.response.use(
  (response) => {
    return response;
  },
  function (error) {
    if (error.response.status === 401 || error.response.status === 419) {
      store.dispatch("auth/logout");
    }
    return Promise.reject(error.response);
  }
);
```

### Page Templates (Views) & Component Overview

Here is a breakdown of each of the Vue components and views that are used for handling user authentication, password resets and email verification.

#### Registration Component

[View file on Github](https://github.com/garethredfern/laravel-vue/blob/main/src/components/RegisterForm.vue)

The registration component allows users to sign up for an account if they don’t have one. It works with the Fortify /register endpoint. It only works when a user is not logged in, you can’t use it for adding users if you are logged in. To add users through an admin screen we would need to create another API endpoint and alter this component to post to that too. For now, it’s kept simply to register new users. Once a user is registered successfully they are automatically logged in and redirected to the dashboard.

#### Login Component

[View file on Github](https://github.com/garethredfern/laravel-vue/blob/main/src/components/LoginForm.vue)

The login form works with the Fortify /login endpoint. Notice that all the endpoints are kept in the AuthService file which is imported into each view/component. Once a user logs in successfully, they are redirected to the dashboard.

#### Logout Component

[View file on Github](https://github.com/garethredfern/laravel-vue/blob/main/src/components/Logout.vue)

A simple component which works with the Fortify /logout endpoint. When a user is logged out, the `auth/logout` action is dispatched clearing the user from the Vuex state and redirects to the login view.

#### Dashboard View (Protected Route)

[View file on Github](https://github.com/garethredfern/laravel-vue/blob/main/src/views/Dashboard.vue)

This view has the `requiresAuth` Boolean set true in the router file `meta: { requiresAuth: true }`, it displays the auth user details and a password update component. A dashboard could display much more but the takeaway here is that it is protected. A user must be logged in to see it.

#### Forgot Password View

[View file on Github](https://github.com/garethredfern/laravel-vue/blob/main/src/views/ForgotPassword.vue)

The forgot password view can be accessed if a user is not logged in and needs to reset their password. It works with the Fortify /forgot-password endpoint. Once the form is submitted Laravel will check the email is valid and send out a reset password email. The link in this email will have a token and the URL will point to the reset password view in the SPA.

#### Reset Password View

[View file on Github](https://github.com/garethredfern/laravel-vue/blob/main/src/views/ResetPassword.vue)

The reset password view displays a form where a user can change their password. Importantly it will also have access to the token provided by Laravel. It works with the Fortify /reset-password endpoint. When the form is submitted the users email and token are checked by Laravel. If everything was successful, a message is displayed and the user can log in.

#### Update Password Component

[View file on Github](https://github.com/garethredfern/laravel-vue/blob/main/src/components/UpdatePassword.vue)

This form allows a logged-in user to update their password. It works with the Fortify /user/password endpoint.

#### Email Verification

[View file on Github](https://github.com/garethredfern/laravel-vue/blob/main/src/components/VerifyEmail.vue)

Laravel provides the ability for a user to verify their email as an added layer of security. This component works with the /email/verification-notification endpoint. To get the email notification working, there is some set-up required within the Laravel API. More detail in these [instructions](/articles/authentication-laravel-sanctum-fortify-for-an-spa#email-verification).

With this in place, the SPA will check a user is verified using the details in the auth Vuex store. If they are not, a button is displayed, when clicked the verification email will be sent by Laravel. The email will have a link to verify and return the user back to the SPA dashboard.

#### Flash Message Component

[View file on Github](https://github.com/garethredfern/laravel-vue/blob/main/src/components/FlashMessage.vue)

While the user is interacting with the API via the SPA we need to give them success and error messages. The Laravel API will be handling a lot of these messages, but we can also use catch try/catch blocks to display messages within the SPA. To keep things all in one place there is a `FlashMessage` component which takes a message and error prop.

## Conclusion

With this Vue set-up in place you will have a robust authentication system in place which should be repeatable in your applications. Personally, I really like having an SPA run completely separate to the API and on larger projects it enables teams to work on two separate repos each focused on the front and back end of your application. I hope this article together with the [Laravel API authentication](https://redfern.dev/articles/authentication-laravel-sanctum-fortify-for-an-spa) article will help anyone who wants to work this way.

The project files for this article can be found on Github:

- [Larvel API](https://github.com/garethredfern/laravel-api)
- [VueJS SPA](https://github.com/garethredfern/laravel-vue)
- [Full Documentation](https://www.laravelvuespa.com/)
