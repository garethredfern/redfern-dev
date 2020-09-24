<template>
  <div>
    <div class="flex justify-center">
      <h2
        class="text-center text-3xl mb-4 uppercase bg-black text-white inline-block mx-auto px-2"
      >
        All Articles ({{ allArticles.length }})
      </h2>
    </div>
    <ArticleList :articles="paginatedArticles" :total="allArticles.length" />
  </div>
</template>

<script>
import ArticleList from "@/components/ArticleList";

export default {
  name: "ArticleListPage",
  components: {
    ArticleList,
  },
  async asyncData({ $content, app, params, error }) {
    const currentPage = parseInt(params.page);
    const allArticles = await $content("articles").only("slug").fetch();
    const paginatedArticles = await $content("articles")
      .only(["title", "description", "image", "slug", "published"])
      .sortBy("published", "desc")
      .limit(5)
      .skip(currentPage > 1 ? currentPage * 5 : 0)
      .fetch();

    if (currentPage === 0 || !paginatedArticles.length) {
      return error({ statusCode: 404, message: "No articles found!" });
    }

    return {
      allArticles,
      paginatedArticles,
    };
  },
};
</script>
