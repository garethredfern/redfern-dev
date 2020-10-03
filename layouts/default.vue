<template>
  <div class="bg-gray-100">
    <Header />
    <main class="container mx-auto p-5">
      <Nuxt />
    </main>
    <Footer />
  </div>
</template>

<script>
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default {
  name: "DefaultLayout",
  components: { Header, Footer },
};
</script>
