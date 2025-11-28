---
title: "Using Getters & Setters Vuex"
description: "A short article on using the getter and setter pattern to update data held in a Vuex store."
image: "https://res.cloudinary.com/redfern-web/image/upload/v1599905729/redfern-dev/png/vue.png"
tags: ["vuejs"]
published: "2021-01-06"
permalink: "using-getters-and-setters-vuex"
---

## Using Getters & Setters Vuex

When you are working with data in your Vuex store, you will often need to update it using a form. Vuex holds everything in state so that you can display it in multiple areas of your application while keeping things in sync. Let’s look at an example of updating a user's name.

To update the user's name, the standard approach is to dispatch an action. The action will commit a mutation to update the state. You can’t update state directly, it needs to be handled via a mutation.

To access the state, we can use a getter to fetch the current user’s name. To have that name update in the Vuex store we then need to use a setter which will dispatch an action.

Here we have a basic auth Vuex state:

```js
export const namespaced = true;

export const state = {
  user: null,
};

export const mutations = {
  SET_USER_NAME(state, name) {
    state.user.name = name;
  },
};

export const actions = {
  setName({ commit }, newValue) {
    commit("SET_USER_NAME", newValue);
  },
};

export const getters = {
  authUser: (state) => {
    return state.user;
  },
};
```

To update the authenticated user’s name we add the following computed property in our Vue template.

```js
computed: {
  name: {
    get() {
      return this.$store.getters["auth/authUser"].name;
    },
    set(newValue) {
      return this.$store.dispatch("auth/setName", newValue);
    },
  },
}
```

This works by binding to the input field using `v-model` for the `name` property.

```js
<input type="text v-model="name" />
```

With this in place we now have two-way data binding with the Vuex store. At first, it feels like quite a lot of code just to update one input field, but you soon get used to the pattern. Update the name in that one form, and it will update everywhere in your application using the `auth/authUser` getter.
