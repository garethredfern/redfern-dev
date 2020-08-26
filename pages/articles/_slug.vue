<template>
  <article>
    <header class="text-gray-500 mx-auto">
      <p>Published: {{ article.published }}</p>
      <div class="flex">
        <span class="mr-1">Filed under:</span>
        <ul class="flex">
          <li v-for="tag in article.tags" :key="tag" class="mr-2">{{ tag }}</li>
        </ul>
      </div>
    </header>
    <nuxt-content
      :document="article"
      class="prose prose-lg text-gray-500 mx-auto"
    />
    <footer class="py-5 mt-5">
      <prev-next :prev="prev" :next="next" />
    </footer>
  </article>
</template>

<script>
export default {
  async asyncData({ $content, params }) {
    const article = await $content("articles", params.slug).fetch();

    const [prev, next] = await $content("articles")
      .only(["title", "slug", "published"])
      .sortBy("published", "desc")
      .surround(params.slug)
      .fetch();

    return {
      article,
      prev,
      next,
    };
  },
  head() {
    return {
      title: this.article.title,
      meta: [
        {
          hid: "description",
          name: "description",
          content: this.article.description,
        },
        {
          hid: "og:title",
          name: "og:title",
          content: this.article.title,
        },
        {
          hid: "og:description",
          name: "og:description",
          content: this.article.description,
        },
        {
          hid: "og:type",
          property: "og:type",
          content: "article",
        },
        {
          hid: "og:url",
          property: "og:url",
          content: `https://www.redfern.dev/${this.$route.params.slug}`,
        },
        {
          hid: "og:image",
          property: "og:image",
          content: this.article.image,
        },
        {
          property: "article:published_time",
          content: this.article.createdAt,
        },
        {
          property: "article:modified_time",
          content: this.article.updatedAt,
        },
        {
          property: "article:tag",
          content: this.article.tags[0], // todo loop through tags (multiple article tags)
        },
        {
          hid: "twitter:url",
          name: "twitter:url",
          content: `https://www.redfern.dev/${this.$route.params.slug}`,
        },
        {
          hid: "twitter:title",
          name: "twitter:title",
          content: this.article.title,
        },
        {
          hid: "twitter:description",
          name: "twitter:description",
          content: this.article.description,
        },
        {
          hid: "twitter:image",
          name: "twitter:image",
          content: this.article.image,
        },
        { name: "twitter:label1", content: "Written by" },
        { name: "twitter:data1", content: "Gareth Redfern" },
        { name: "twitter:label2", content: "Filed under" },
        { name: "twitter:data2", content: this.article.tags[0] }, // todo loop through tags (content="JavaScript, VueJS")
      ],
      link: [
        {
          hid: "canonical",
          rel: "canonical",
          href: `https://www.redfern.dev/${this.$route.params.slug}`,
        },
      ],
    };
  },
};
</script>
