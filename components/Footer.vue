<template>
  <footer class="bg-gradient-to-r from-teal-400 to-blue-500 border-t">
    <div class="bg-gradient-to-r from-teal-400 to-blue-500 p-5">
      <h4 class="text-center mb-4 font-bold uppercase text-green-100">
        Sign-up to the Newsletter
      </h4>
      <div class="container mx-auto max-w-5xl flex justify-center">
        <Subscribe />
      </div>
    </div>
    <div class="mt-1">
      <div
        class="container mx-auto max-w-5xl flex justify-between items-center p-5 text-green-100"
      >
        <small>&copy; {{ new Date().getFullYear() }} RedfernDev</small>
        <ul class="mb-2">
          <li>
            <a
              href="https://ko-fi.com/garethredfern"
              target="_blank"
              class="flex items-center"
            >
              <span class="mr-1">Buy Me</span>
              <Coffee />
            </a>
          </li>
        </ul>
      </div>
    </div>
  </footer>
</template>

<script>
import Coffee from "@/components/svg/Coffee";
import Subscribe from "@/components/Subscribe";

export default {
  name: "Footer",
  components: {
    Coffee,
    Subscribe,
  },
};
</script>
