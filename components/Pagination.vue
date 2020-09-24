<template>
  <ul class="flex justify-center">
    <li class="mx-5">
      <nuxt-link
        :to="{ name: 'articles-page', params: { page: 1 } }"
        class="border rounded px-4 py-1 uppercase bg-white hover:bg-blue-500 hover:text-white transform duration-500 ease-in-out"
        :disabled="currentPage === 1"
      >
        First
      </nuxt-link>
    </li>
    <li class="mx-5">
      <nuxt-link
        :to="{ name: 'articles-page', params: { page: prevPage } }"
        class="border rounded px-4 py-1 uppercase bg-white hover:bg-blue-500 hover:text-white transform duration-500 ease-in-out"
        :disabled="currentPage === 1"
      >
        Prev
      </nuxt-link>
    </li>
    <li class="mx-5">
      <nuxt-link
        :to="{ name: 'articles-page', params: { page: nextPage } }"
        class="border rounded px-4 py-1 uppercase bg-white hover:bg-blue-500 hover:text-white transform duration-500 ease-in-out"
        :disabled="currentPage === totalPages"
      >
        Next
      </nuxt-link>
    </li>
    <li class="mx-5">
      <nuxt-link
        :to="{ name: 'articles-page', params: { page: totalPages } }"
        class="border rounded px-4 py-1 uppercase bg-white hover:bg-blue-500 hover:text-white transform duration-500 ease-in-out"
        :disabled="currentPage === totalPages"
      >
        Last
      </nuxt-link>
    </li>
  </ul>
</template>

<script>
export default {
  name: "Pagination",
  props: {
    total: {
      type: Number,
      default: 0,
    },
  },
  computed: {
    totalPages() {
      const perPage = 5;
      return Math.floor(this.total / perPage);
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
</script>

<style scoped>
a[disabled] {
  pointer-events: none;
  color: #eee;
}
</style>
