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
    <footer class="bg-white border-t p-5">
      <h4 class="text-center mb-2 font-bold">Sign-up to the Newsletter</h4>
      <div class="container mx-auto max-w-5xl flex justify-center">
        <script
          async
          data-uid="78844601d4"
          src="https://garethredfern.ck.page/78844601d4/index.js"
        ></script>
      </div>
      <div
        class="container mx-auto max-w-5xl flex justify-between items-center"
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

export default {
  name: "DefaultLayout",
  components: { Twitter, Github },
};
</script>
