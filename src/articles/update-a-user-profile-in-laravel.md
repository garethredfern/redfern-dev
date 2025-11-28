---
title: "Update A User Profile In Laravel"
description: "If you need to update other fields along with a unique field then you need to tell the unique rule to ignore the user's ID."
tags: ["laravel"]
published: "2016-04-25"
permalink: "update-a-user-profile-in-laravel"
---

## Update A User Profile In Laravel

I ran into a problem the other day when I was trying to create a page where an admin could update user details in a dashboard area of an app. I needed the user to be able to update an email address and name field. The issue was that the email address would update no problem but the name wouldn't. Here is the code:

### The Edit Form

```html
<form method="POST" action="{{ route('users.update', $user->id) }}">
  <input type="hidden" name="_token" value="{{ csrf_token() }}" />
  <input type="hidden" name="_method" value="PUT" />
  <div class="form-group">
    <label for="name">Name</label>
    <input
      type="text"
      name="name"
      value="{{ $user->name }}"
      class="form-control"
    />
  </div>
  <div class="form-group">
    <label for="email">Email</label>
    <input
      type="email"
      name="email"
      value="{{ $user->email }}"
      class="form-control"
    />
  </div>
  <button type="submit" class="btn btn-primary">
    <i class="fa fa-btn fa-sign-in"></i>Update
  </button>
</form>
```

### The Update Method In The Users Controller

```php
public function update($id, UserFormRequest $request)
{
    $user = User::findOrFail($id);

    $user->name = $request->get('name');

    $user->email = $request->get('email');

    $user->save();

    return \Redirect::route('users.edit', [$user->id])->with('message', 'User has been updated!');
}
```

### The User Form Request

```php
public function rules()
{
    return [
      'name' => 'required',
      'email' => 'unique:users|email|required',
    ];
}
```

It was Jason Varga who pointed out that there is this additional requirement in the [Laravel docs](https://laravel.com/docs/5.2/validation#rule-unique). Basically if you need to update other fields along with a unique field then you need to tell the unique rule to ignore the user's ID, you may pass the ID as the third parameter. You will see in the example below that I grab the user ID using `Route::current()->getParameter('users')` then pass that into the email rule as the `$user_id` variable.

### Updated User Form Request

```php
public function rules()
{
    // Grab the user id from the URL
    $user_id = \Route::current()->getParameter('users');

    return [
      'name' => 'required',
      'email' => 'unique:users,email,'.$user_id.'|email|required',
    ];
}
```
