<template>
  <header class="bg-green-300 md:pb-56 md:mb-12 border-b border-green-400">
    <div
      class="flex justify-between items-center px-5 py-1 md:mb-5 bg-green-300"
    >
      <h1>
        <a href="/">
          <RedfernDev class="mx-auto" width="200" />
        </a>
      </h1>
      <div class="flex">
        <a href="/articles/rss.xml" target="_blank" class="mx-2">
          <RSS />
        </a>
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
        <button
          type="button"
          class="hover:text-pink-500 focus:outline-none mx-2 hidden sm:inline-block"
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
</template>

<script>
import RSS from "@/components/svg/RSS";
import Github from "@/components/svg/Github";
import Twitter from "@/components/svg/Twitter";
import RedfernDev from "@/components/svg/RedfernDev";

export default {
  name: "Header",
  components: { Twitter, Github, RedfernDev, RSS },
};
</script>
