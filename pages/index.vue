<template>
  <div>
    <ArticleList :articles="articles" />
  </div>
</template>

<script>
import ArticleList from "@/components/ArticleList";

export default {
  name: "HomePage",
  components: {
    ArticleList,
  },
  async asyncData({ $content }) {
    const articles = await $content("articles")
      .only(["title", "description", "image", "slug", "published"])
      .sortBy("published", "desc")
      .fetch();

    return {
      articles,
    };
  },
};
</script>
