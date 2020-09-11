<template>
  <div class="bg-gray-100">
    <header class="bg-yellow-200 md:pb-56 md:mb-12 border-b">
      <div
        class="flex justify-between items-center px-5 py-1 md:mb-5 bg-yellow-200"
      >
        <h1>
          <a href="/">
            <RedfernDev class="mx-auto" width="200" />
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
          <a
            href="https://github.com/garethredfern"
            target="_blank"
            class="mx-2"
          >
            <Github />
          </a>
          <button
            type="button"
            class="hover:text-pink-500 focus:outline-none mx-2"
            @click="$refs.roar.play()"
          >
            RAW
          </button>
          <audio ref="roar" src="@/assets/mp3/roar.mp3"></audio>
        </div>
      </div>
      <div class="mt-24 hidden md:block">
        <RedfernDev class="mx-auto" />
      </div>
    </header>
    <main class="container mx-auto p-5">
      <Nuxt />
    </main>
    <footer class="bg-pink-400 border-t">
      <div class="bg-pink-400 p-5">
        <h4 class="text-center mb-4 font-bold uppercase text-pink-100">
          Sign-up to the Newsletter
        </h4>
        <div class="container mx-auto max-w-5xl flex justify-center">
          <Subscribe />
        </div>
      </div>
      <div class="border-t border-dotted border-pink-200 mt-2">
        <div
          class="container mx-auto max-w-5xl flex justify-between items-center p-5 text-pink-200"
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
      </div>
    </footer>
  </div>
</template>

<script>
import Github from "@/components/svg/Github";
import Twitter from "@/components/svg/Twitter";
import Subscribe from "@/components/Subscribe";
import RedfernDev from "@/components/svg/RedfernDev";

export default {
  name: "DefaultLayout",
  components: { Twitter, Github, RedfernDev, Subscribe },
};
</script>
