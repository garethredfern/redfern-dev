<template>
  <form class="w-full md:w-1/3" @submit.prevent="sendForm">
    <transition name="fade">
      <div
        v-if="success"
        class="p-2 bg-yellow-200 text-gray-900 border rounded border-yellow-300 text-center mb-5"
      >
        <p>You are subscribed!</p>
        <p>Please check your inbox.</p>
      </div>
    </transition>
    <div class="mb-4">
      <label for="name" class="text-xs block uppercase">First Name</label>
      <input
        id="name"
        v-model="firstName"
        type="text"
        class="p-1 border rounded w-full"
        required
      />
    </div>
    <div class="mb-4">
      <label for="email" class="text-xs block uppercase">Email</label>
      <input
        id="email"
        v-model="email"
        type="email"
        class="p-1 border rounded w-full"
        required
      />
    </div>
    <button type="input" class="border rounded bg-yellow-200 px-4 py-1">
      <transition name="fade" mode="out-in">
        <span v-if="!sending">Join</span>
        <span v-else>sending...</span>
      </transition>
    </button>
  </form>
</template>

<script>
export default {
  name: "Subscribe",
  data() {
    return {
      firstName: null,
      email: null,
      sending: false,
      success: false,
    };
  },
  methods: {
    sendForm() {
      this.sending = true;
      fetch("/api/subscribe", {
        method: "POST",
        body: JSON.stringify({
          firstName: this.firstName,
          email: this.email,
        }),
      }).then((res) => {
        this.sending = false;
        if (res.status === 200) {
          this.success = true;
          this.firstName = null;
          this.email = null;
        }
      });
    },
  },
};
</script>
