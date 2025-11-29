---
title: Adding Pagination to a Nuxt Blog
description: "As your blog grows it will more than likely become necessary to paginate the listing page of articles. This post explains one way this can be achieved."
tags: ["vue", "nuxt"]
pubDate: "2020-09-28T09:00:00.000Z"
link: "adding-pagination-nuxt-content-blog"
---

## Adding Pagination With Nuxt Content

As your blog grows it will more than likely become necessary to paginate the listing page of articles. This post explains one way this can be achieved.

**TL;DR** If you want to refer to the full project code at any time, check out the [nuxt-basic-blog](https://github.com/garethredfern/nuxt-basic-blog) template on GitHub.

### Page Template Structure

To make the pagination work we need to set up the routes and page templates in a specific way. Currently, all articles are listed on the `/articles ` page. The new URI for the pagination will look like this `/articles/page/1`.

To achieve the correct route with a dynamic page number lets set up the following nested page template structure:

```js
pages; // folder
--articles; // folder
--page; // folder
--_page.vue; // template
```

You can read more about [nested pages](https://router.vuejs.org/guide/essentials/nested-routes.html) and [routing](https://router.vuejs.org/guide/essentials/dynamic-matching.html) in the official docs but this will allow us to create our pagination URI with a dynamic page number.

### Article Content Using Limit & Skip

The next thing to do is create the `_page` template code which fetches content using the `limit` and `skip` methods. Limiting the number of articles will only show **X** amount per page (`perPage`). We can then use route parameters to determine which page we are on (`currentPage`) and with some fairly simple maths calculate which articles to display on each page. Pass the math calculation to the `skip` method will show the next articles. The example below lists 5 per page, with each page visit displaying the next set of 5 articles.

To keep things tidy and make this code reusable lets create a `getContent` helper method in the [utils folder](https://github.com/garethredfern/nuxt-basic-blog/blob/master/utils/getContent.js). The code for the `getContent` method will look like this:

```js
export default async ($content, params, error) => {
  const currentPage = parseInt(params.page);

  // Set how many articles to show per page
  const perPage = 5;

  const allArticles = await $content("articles").fetch();

  const totalArticles = allArticles.length;

  // use Math.ceil to round up to the nearest whole number
  const lastPage = Math.ceil(totalArticles / perPage);

  // use the % (modulus) operator to get a whole remainder
  const lastPageCount =
    totalArticles % perPage === 0 ? perPage : totalArticles % perPage;

  const skipNumber = () => {
    if (currentPage === 1) {
      return 0;
    }
    if (currentPage === lastPage) {
      return totalArticles - lastPageCount;
    }
    return (currentPage - 1) * perPage;
  };

  const paginatedArticles = await $content("articles")
    .only(["title", "description", "image", "slug", "published"])
    .sortBy("published", "desc")
    .limit(perPage)
    .skip(skipNumber())
    .fetch();

  if (currentPage === 0 || !paginatedArticles.length) {
    return error({ statusCode: 404, message: "No articles found!" });
  }

  return {
    allArticles,
    paginatedArticles,
  };
};
```

Import the `getContent` method in the `_page` template and then call it in an `asyncData` method:

```js
import getContent from "@/utils/getContent";

export default {
  async asyncData({ $content, app, params, error }) {
    const content = await getContent($content, params, error);
    return {
      allArticles: content.allArticles,
      paginatedArticles: content.paginatedArticles,
    };
  },
};
```

With the above code added to the `_page` template you will be able to use the `paginatedArticles` and `allArticles` properties in the template code. Create an `ArticleList` component which handles looping through the articles and showing the pagination. Check out the full code in the [nuxt-basic-blog](https://github.com/garethredfern/nuxt-basic-blog/blob/master/components/ArticleList.vue) repo over on GitHub.

```js
<ArticleList
  :articles="paginatedArticles"
  :total="allArticles.length"
/>
```

Visiting `/articles/page/1` and changing the page number at the end should now display articles in blocks of 5. **Note** you will need more than 5 articles in the `content/articles` folder for this to work.

### The Pagination Navigation Component

To navigate between the paginated articles create a `Pagination` component. This uses the `<nuxt-link>` to dynamically display links which will navigate backwards and forwards between pages.

```js
<template>
  <div>
    <nuxt-link
      :to="{
		name: 'articles-page-page',
		params: { page: 1 }
	  }">
      First
    </nuxt-link>

    <nuxt-link
      :to="{
		name: 'articles-page-page'
		params: { page: prevPage }
	  }">
      Prev
    </nuxt-link>

    <nuxt-link
      :to="{
		name: 'articles-page-page',
		params: { page: nextPage }
	  }">
      Next
    </nuxt-link>

    <nuxt-link
      :to="{
		name: 'articles-page-page',
		params: { page: totalPages }
	  }">
      Last
    </nuxt-link>
  </div>
</template>
```

The pagination component excepts props for the total number of articles (`total`) and how many articles to display per page (`perPage`). It uses the props to calculate the total, current, previous and next page numbers as computed properties. These properties are passed in as the `page` parameter for each of the respective `nuxt-link` components.

```js
export default {
  props: {
    total: {
      type: Number,
      default: 0,
    },
    perPage: {
      type: Number,
      default: 5,
    },
  },
  computed: {
    totalPages() {
      return Math.ceil(this.total / this.perPage);
    },
    currentPage() {
      return parseInt(this.$route.params.page) || 1;
    },
    prevPage() {
      return this.currentPage > 1 ? this.currentPage - 1 : 1;
    },
    nextPage() {
      return this.currentPage < this.totalPages
        ? this.currentPage + 1
        : this.totalPages;
    },
  },
};
```

With the above code in place the pagination should now navigate through each of the pages, listing 5 articles per page.

### Conditionally Showing the Links

If there are no more pages to display because the reader is on the last page of articles, we should not show a forward link. Rather than not show the link lets display the forward link as plain text and style it as if it’s disabled. Change each `nuxt-link` to conditionally load text like this:

```js
<span v-if="currentPage === 1" :class="disabledStyle">
  First
</span>

<nuxt-link
  v-else
  :to="{ name: 'articles-page-page', params: { page: 1 } }"
  :class="buttonStyles"
>
  First
</nuxt-link>

<span v-if="currentPage === 1" :class="disabledStyle">
  Prev
</span>

<nuxt-link
  v-else
  :to="{ name: 'articles-page-page', params: { page: prevPage } }"
  :class="buttonStyles"
>
  Prev
</nuxt-link>

<span v-if="currentPage === totalPages" :class="disabledStyle">
  Next
</span>

<nuxt-link
  v-else
  :to="{ name: 'articles-page-page', params: { page: nextPage } }"
  :class="buttonStyles"
>
  Next
</nuxt-link>

<span v-if="currentPage === totalPages" :class="disabledStyle">
  Last
</span>

<nuxt-link
  v-else
  :to="{ name: 'articles-page-page', params: { page: totalPages } }"
  :class="buttonStyles"
>
  Last
</nuxt-link>
```

The `:class` styles are stored as computed properties, only because I am using Tailwind CSS and it keeps the `nuxt-link` component clean. You can easily just use template styles or create a [utility class](https://tailwindcss.com/docs/adding-new-utilities) in Tailwind if you prefer.

### Redirecting the Articles Page

If a user visits`/articles`, they should see the first page of 5 articles with the pagination navigation. Rather than duplicate the pagination code, and to stop any duplicate pages displaying in search engines. Lets add page specific middleware into the `articles/index.vue` template in the `pages` folder. This will add a permanent 301 redirect from `/articles` to `/articles/page/1` solving any duplicate page issue.

```js
<script>
export default {
  middleware({ redirect }) {
    return redirect("301", "/articles/page/1");
  }
};
</script>
```

### Final Code

Find the full project code [nuxt-basic-blog](https://github.com/garethredfern/nuxt-basic-blog) on GitHub.
