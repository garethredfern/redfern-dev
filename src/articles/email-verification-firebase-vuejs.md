---
title: "Email Verification Using Firebase & VueJS"
description: "This tutorial walks through adding email verification to the simple VueJS Firebase app we have been building."
tags: ["vue", "firebase"]
pubDate: "2020-09-08T09:00:00Z"
link: "email-verification-firebase-vuejs"
---

## Email Verification Using Firebase & VueJS

This tutorial walks through adding email verification to the simple VueJS Firebase app we have been building.

- Part One [Authenticate Users Using Firebase & VueJS](/articles/authenticate-users-using-firebase-and-vuejs)
- Part Two [How to Manage User State With Vuex and Firebase](/articles/manage-user-state-vuex-and-firebase)

The tutorial files are free to download on [Github](https://github.com/garethredfern/vue-auth-demo). This article will focus on code from the [email-verification branch](https://github.com/garethredfern/vue-auth-demo/tree/email-verification). Where possible, comments have been added to explain what the code is doing. To get the site up and running on your local machine follow the instructions in the [README](https://github.com/garethredfern/vue-auth-demo/blob/email-verification/README.md) file. The main directory we will be writing our code in is the `src` directory. If you have built VueJS apps in the past, the set-up should be familiar to you.

### Add sendEmailVerification Method on Sign-Up

Firebase makes it straightforward to add an [email verification](https://firebase.google.com/docs/auth/web/manage-users#send_a_user_a_verification_email) to your app. Using the `sendEmailVerification` method on the currently signed-in user will automatically send an email (so long as they have an email assigned to their profile). For our example app we will do this when a user signs up for an account.

Open the [SignUp](https://github.com/garethredfern/vue-auth-demo/blob/email-verification/src/components/SignUp.vue#L60) component and take a look at the `signUp` method that we have previously created. After using the `createUserWithEmailAndPassword` method (which returns a [Promise](/articles/javascript-promises)), lets chain a `then` with a callback function where we will have access to the user that has just signed up.

```js
signUp() {
  firebase
    .auth()
    .createUserWithEmailAndPassword(this.email, this.password)
    .then(() => {
	  // now we have access to the signed in user
      const user = firebase.auth().currentUser;
    })
    .catch(error => {
      // catch any errors
      console.log(error);
    });
},
```

Once we have the user we can then call the `sendEmailVerification` and Firebase will email that user.

```js
signUp() {
  firebase
    .auth()
    .createUserWithEmailAndPassword(this.email, this.password)
    .then(() => {
	  // now we have access to the signed in user
      const user = firebase.auth().currentUser;
      // send the signed in user a verification email
      user.sendEmailVerification();
    })
    .catch(error => {
      // catch any errors
      console.log(error);
    });
},

```

### Redirecting Back to Your App

With the above code in place, when a user signs up, the email will be sent using the email verification template in your Firebase console. That email has a link in it which you can modify to redirect back to a page on your app once the user clicks `verify`. To do this, you will need to pass in the URL into the `sendEmailVerification` method via the [actionCodeSettings](https://firebase.google.com/docs/auth/web/passing-state-in-email-actions).

```js
signUp() {
  firebase
    .auth()
    .createUserWithEmailAndPassword(this.email, this.password)
    .then(() => {
      const user = firebase.auth().currentUser;
      const actionCodeSettings = {
        url: `${process.env.VUE_APP_HOST_NAME}/sign-in/?email=${user.email}`,
      };
      user.sendEmailVerification(actionCodeSettings);
    })
    .catch(error => {
      // catch any errors, set a data property called error
      this.error = error.message;
    });
},
```

Here we create a `actionCodeSettings` object, setting the `url` property to the full path that we want to redirect back to after a user verifies their email. Notice that we use an environment variable `process.env.VUE_APP_HOST_NAME` to store the main URL. VueJS provides the option to store environment variables in a `.env` file that can then be used throughout the app. Read more about it in the [official docs](https://cli.vuejs.org/guide/mode-and-env.html#environment-variables). This project has a [`.env.example`](https://github.com/garethredfern/vue-auth-demo/blob/email-verification/.env.example) you can use, just remember to remove the `.example` from the end of the file name so that file will be called `.env` in your project. We ignore `.env` files in git which is why this file has `.example` on the end of it.

After completing the above code changes you should have a basic email verification process in place.
