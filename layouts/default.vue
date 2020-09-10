<template>
  <div class="bg-gray-100">
    <header
      class="flex justify-between items-center px-5 py-1 mb-5 bg-white border-b"
    >
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
    <footer class="bg-blue-100 border-t">
      <div
        class="container mx-auto max-w-5xl flex justify-between items-center p-5"
      >
        <small>&copy; {{ new Date().getFullYear() }} RedfernDev</small>
        <ul class="mb-2">
          <li>
            <a href="https://ko-fi.com/garethredfern" target="_blank"
              >Buy Me ☕️</a
            >
          </li>
        </ul>
      </div>
    </footer>
  </div>
</template>

<script>
import Twitter from "@/components/svg/Twitter";
import Github from "@/components/svg/Github";
import Subscribe from "@/components/Subscribe";

export default {
  name: "DefaultLayout",
  components: { Twitter, Github, Subscribe },
};
</script>
