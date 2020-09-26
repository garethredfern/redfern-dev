export default async ($content, params, error) => {
  const currentPage = parseInt(params.page);

  const perPage = 5;

  const allArticles = await $content("articles").fetch();

  const paginatedArticles = await $content("articles")
    .only(["title", "description", "image", "slug", "published"])
    .sortBy("published", "desc")
    .limit(perPage)
    .skip(currentPage > 1 ? currentPage * perPage : 0)
    .fetch();

  if (currentPage === 0 || !paginatedArticles.length) {
    return error({ statusCode: 404, message: "No articles found!" });
  }

  return {
    allArticles,
    paginatedArticles,
  };
};
