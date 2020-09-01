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
    <footer class="bg-white border-t">
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
  name: "DefaultLayout",
  components: { Twitter, Github },
};
</script>
