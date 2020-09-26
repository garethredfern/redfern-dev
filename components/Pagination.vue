<template>
  <div class="grid gap-4 grid-cols-4">
    <nuxt-link
      :to="{ name: 'articles-page-page', params: { page: 1 } }"
      :class="buttonStyles"
      :disabled="currentPage === 1"
    >
      <DoubleBack />
      <span class="hidden sm:inline">First</span>
    </nuxt-link>

    <nuxt-link
      :to="{ name: 'articles-page-page', params: { page: prevPage } }"
      :class="buttonStyles"
      :disabled="currentPage === 1"
    >
      <SingleBack />
      <span class="hidden sm:inline">Prev</span>
    </nuxt-link>

    <nuxt-link
      :to="{ name: 'articles-page-page', params: { page: nextPage } }"
      :class="buttonStyles"
      :disabled="currentPage === totalPages"
    >
      <span class="hidden sm:inline">Next</span>
      <SingleFwd />
    </nuxt-link>

    <nuxt-link
      :to="{ name: 'articles-page-page', params: { page: totalPages } }"
      :class="buttonStyles"
      :disabled="currentPage === totalPages"
    >
      <span class="hidden sm:inline">Last</span>
      <DoubleFwd />
    </nuxt-link>
  </div>
</template>

<script>
import DoubleFwd from "@/components/svg/DoubleFwd";
import DoubleBack from "@/components/svg/DoubleBack";
import SingleFwd from "@/components/svg/SingleFwd";
import SingleBack from "@/components/svg/SingleBack";

export default {
  name: "Pagination",
  components: {
    DoubleFwd,
    DoubleBack,
    SingleFwd,
    SingleBack,
  },
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
    buttonStyles() {
      return "border rounded px-4 py-1 text-sm bg-white hover:bg-blue-500 hover:text-white transform duration-500 ease-in-out flex justify-center items-center sm:uppercase";
    },
    totalPages() {
      return Math.floor(this.total / this.perPage);
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
