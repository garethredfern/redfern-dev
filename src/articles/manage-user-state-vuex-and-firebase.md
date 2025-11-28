---
title: "How to Manage User State With Vuex and Firebase"
description: "This tutorial walks through adding Vuex to a simple VueJS Firebase app. We use Vuex to manage the logged in user state and display protected content."
tags: ["vue", "firebase"]
published: "2020-09-03"
permalink: "manage-user-state-vuex-and-firebase"
---

## How to Manage User State With Vuex and Firebase

This tutorial walks through adding Vuex to a simple VueJS Firebase app. We use Vuex to manage the logged in user state and display protected content.

The tutorial files are free to download on [Github](https://github.com/garethredfern/vue-auth-demo). This article will focus on code from the [basic-auth branch](https://github.com/garethredfern/vue-auth-demo/tree/basic-auth). Where possible, comments have been added to explain what the code is doing. To get the site up and running on your local machine follow the instructions in the [README](https://github.com/garethredfern/vue-auth-demo/blob/email-verification/README.md) file. The main directory we will be writing our code in is the `src` directory. If you have built VueJS apps in the past, the set-up should be familiar to you.

Building on top of the [previous tutorial](/articles/authenticate-users-using-firebase-and-vuejs), we will now look at how we can handle storing logged in users. When a user logs in we need a way to be able to store their details and check them from our routes and components.

The data store will need to be in one place so that all routes and components can have the data flow down to them. When a user logs out we will need to pass that information back up from a component to the store.

Vuex allows us to do what we need. It provides a store where all the shared data can live. Each component can then use and update that single data store. Let’s start by adding a store folder to our site and create a [store.js](https://github.com/garethredfern/vue-auth-demo/blob/basic-auth/src/store/store.js) file. We will need to pull in the [Vuex library](https://vuex.vuejs.org/) from NPM to use in our app (the [project files](https://github.com/garethredfern/vue-auth-demo) already do this).

With Vuex installed we then include it in our [store.js](https://github.com/garethredfern/vue-auth-demo/blob/basic-auth/src/store/store.js#L2) file and tell Vue that we want to use it. Now we will create the store using `export const = new Vue.Store()`. Pass in the state property as an object where we add all the properties our app requires at the store level. With the store exported we can import it in our `main.js` file and then add it to the [Vue instance](https://github.com/garethredfern/vue-auth-demo/blob/basic-auth/src/main.js#L57). The store data will now be available for us to use in our app using:

```js
this.$store.state.propertyName;
```

### Using Getters to Get the State

Accessing the store directly using this.`$store.state.propertyName` is not very DRY. It would be much better if you could call a method which gets our properties for us. You could also use this method to perform extra calculations if required. This is where `getters` come to our rescue.

Vuex allows us to define `getters` in the store. You can think of them as computed properties for stores. Like computed properties, a getter’s result is cached based on its dependencies, and will only re-evaluate when some of its dependencies have changed.

We add getters to our `store.js` file in the store instance. They are set as methods on the [getters object](https://github.com/garethredfern/vue-auth-demo/blob/basic-auth/src/store/store.js#L11). Here we have access to our state using the state argument:

```js
getUser: (state) => state.user; // ES6 function
```

This simple getter returns our user property from the state. We can now use it in any of our components by calling:

```js
this.$store.getters.getUser;
```

While the example here is basic, it shows how you can now reuse this code throughout our app. If you need to change how that method works, you only change it in one place.

### Using Mutations to Change the State

It is also a good idea to have a single place to change the state of our store. That way components can manipulate the state and update all instances.

Mutations are what Vuex uses to perform these tasks. We add mutations to our store.js file in the store instance. Components run these methods to update the state across the app. They can then listen for these changes through the `getters` we have set.

In our app, we create a mutation that reaches out to Firebase and sets the current logged-in user. If there isn’t anybody logged in, the Firebase auth method returns `null`.

```js
SET_USER: (state) => {
  state.user = firebase.auth().currentUser;
};
```

Our app can now have one single place to check for logged-in users. All components can use this to access user details and load the relevant UI.

### Using Actions to Commit Mutations

The final part of this Vuex journey is to understand how actions work. Mutations can only run synchronously, we actually want this behaviour from them. By running a synchronous method you can reliably know that it will change the state when you need it.

Suppose we want to make an asynchronous call to a 3rd party API though, how would we do that? We add an action to commit a mutation only when the asynchronous method is complete. That way we can run asynchronous code and only commit to state once the data is returned. Let’s have a look how we do this in our app.

We trigger actions with the `store.dispatch` method. In our App.js component, when the Vue instance is first created, we fire the `setUsermethod`. This then executes `this.$store.dispatch(‘setUser’);` an action in our [store.js](https://github.com/garethredfern/vue-auth-demo/blob/basic-auth/src/store/store.js#L22) file. Let’s now look at the `setUser` action which is set as a method.

```js
setUser: (context) => {
  context.commit("SET_USER");
};
```

Here we pass in the `context` that is available from Vuex and gives us access to the `commit` method. The `commit` method takes the mutation you would like to run as a string argument (`'SET_USER’`).

### Putting it all Together

![Vuex Diagram](https://res.cloudinary.com/redfern-web/image/upload/v1599156012/redfern-dev/png/vuex.png)

The diagram above (taken from the Vuex docs) summarises how the 3 key parts of Vuex work together to serve data to our components. For this tutorial, Vuex may well be overkill, but it demonstrates how we can keep our data in sync with all the components in our app.

Vuex solved the problem of knowing when a user is signed-in so that we can display links in the navigation. Take a look at the [Header.vue](https://github.com/garethredfern/vue-auth-demo/blob/basic-auth/src/components/Header.vue) component.

In the header we are displaying links depending on whether a user is signed-in. All we need to do is add `v-if=”!user”` to each of our router-link components. The user variable is a computed property, it returns the user object or `null` if someone is signed-in or not. We are also displaying the users email from Firebase and if this is updated our app would automatically display the new email address.

### Additional Reading

- [Understanding Vue Lifecycle Hooks](https://vuejs.org/v2/guide/instance.html#Lifecycle-Diagram)
- [Application Structure](https://vuex.vuejs.org/guide/structure.html#application-structure)
- [Authenticate Users Using Firebase & VueJS](/articles/authenticate-users-using-firebase-and-vuejs)
