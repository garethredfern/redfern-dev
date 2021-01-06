<template>
  <footer class="border-t bg-gradient-to-r from-teal-400 to-blue-500">
    <div
      class="container flex items-center justify-between max-w-5xl p-5 mx-auto text-green-100"
    >
      <small>&copy; {{ new Date().getFullYear() }} RedfernDev</small>
      <ul class="mb-2">
        <li>
          <iframe
            src="https://github.com/sponsors/garethredfern/button"
            title="Sponsor garethredfern"
            height="35"
            width="116"
            style="border: 0"
          ></iframe>
        </li>
      </ul>
    </div>
  </footer>
</template>

<script>
import Coffee from "@/components/svg/Coffee";

export default {
  name: "Footer",
  components: {
    Coffee,
  },
};
</script>
