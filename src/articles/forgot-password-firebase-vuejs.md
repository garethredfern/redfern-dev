---
title: "Forgot Password Using Firebase & VueJS"
description: "This tutorial walks through adding a forgot password page to the simple VueJS Firebase app we have been building."
image: "https://res.cloudinary.com/redfern-web/image/upload/v1599158299/redfern-dev/png/firebase-vue.png"
tags: ["vue", "firebase"]
published: "2020-09-11"
permalink: "forgot-password-firebase-vuejs"
---

## Forgot Password Using Firebase & VueJS

This tutorial walks through adding a forgot password page to the simple VueJS Firebase app we have been building.

- Part One [Authenticate Users Using Firebase & VueJS](/articles/authenticate-users-using-firebase-and-vuejs)
- Part Two [How to Manage User State With Vuex and Firebase](/articles/manage-user-state-vuex-and-firebase)
- Part Three [Email Verification Using Firebase & VueJS](/articles/email-verification-firebase-vuejs)

The tutorial files are free to download on [Github](https://github.com/garethredfern/vue-auth-demo). This article will focus on code from the [forgot-password branch](https://github.com/garethredfern/vue-auth-demo/tree/forgot-password). Where possible, comments have been added to explain what the code is doing. To get the site up and running on your local machine follow the instructions in the [README](https://github.com/garethredfern/vue-auth-demo/blob/email-verification/README.md) file. The main directory we will be writing our code in is the `src` directory. If you have built VueJS apps in the past, the set-up should be familiar to you.

### Add Forgot Password Page & Route

Start by adding a `ForgotPassword` component in your [components directory](https://github.com/garethredfern/vue-auth-demo/blob/forgot-password/src/components/ForgotPassword.vue). This will display the form that a user can fill in to send a forgot password email. You will also need to add a route for `/forgot-password`, open up your [routes file](https://github.com/garethredfern/vue-auth-demo/blob/forgot-password/src/router/routes.js) and import the `ForgotPassword` component:

```js
import ForgotPassword from "@/components/ForgotPassword";
```

Next add the following code to the [routes array](https://github.com/garethredfern/vue-auth-demo/blob/forgot-password/src/router/routes.js#L14):

```js
{
  path: "/forgot-password",
  name: "forgotPassword",
  component: ForgotPassword,
  beforeEnter(to, from, next) {
    const user = firebase.auth().currentUser;
    if (user) {
      next({ name: "dashboard" });
    } else {
      next();
    }
  },
}
```

Here we set the path up and add a `beforeEnter` method that will only allow the forgot password page to display if the user is not logged in.

### Add the Forgot Password Method

The forgot password form will have a single field where a user fills in their email address. This form will hook into the VueJS data model:

```js
data() {
  return {
    email: "",
    error: null,
    emailSending: false,
  };
},
```

On submit all we need to do is pass the email address to a Firebase function `sendPasswordResetEmail` which will check if the email address exists and then send the user an email with a link to reset their password.

```js
firebase.auth().sendPasswordResetEmail(this.email);
```

The full method `sendEmail` will first check that the email field is not blank, you could expand this to also validate the email but let’s keep it simple for now. Next we clear any previous error messages and set the `emailSending` data variable `true` so that the UI can display a “Sending…” message. Finally, we call the Firebase `sendPasswordResetEmail` which will return a Promise, if it’s successful, then `emailSending` is set back to false. If there are any errors we catch them and update the error data variable.

```js
sendEmail() {
  if (!this.email) {
    this.error = "Please type in a valid email address.";
    return;
  }
  this.error = null;
  this.emailSending = true;
  firebase
    .auth()
    .sendPasswordResetEmail(this.email)
    .then(() => {
      this.emailSending = false;
    })
    .catch(error => {
      this.emailSending = false;
      this.error = error.message;
    });
}
```

With the forgot password page and the previous tutorials complete we have a robust authentication system powered by Firebase and VueJS.
