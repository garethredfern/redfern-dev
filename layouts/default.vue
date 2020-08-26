<template>
  <div>
    <header class="flex justify-between items-center px-5 py-1 mb-5">
      <h1>
        <a href="/" class="text-3xl uppercase">
          <span class="font-thin">redfern</span>dev
        </a>
      </h1>
      <div class="flex">
        <a
          href="https://twitter.com/garethredfern"
          target="_blank"
          class="mx-2"
        >
          <Twitter />
        </a>
        <a href="https://github.com/garethredfern" target="_blank" class="mx-2">
          <Github />
        </a>
      </div>
    </header>
    <main class="container mx-auto p-5">
      <Nuxt />
    </main>
    <footer>
      <div class="text-center p-5">
        <small>&copy; {{ new Date().getFullYear() }} Redfern</small>
      </div>
    </footer>
  </div>
</template>

<script>
import Twitter from "@/components/svg/Twitter";
import Github from "@/components/svg/Github";

export default {
  components: [Twitter, Github],
};
</script>
