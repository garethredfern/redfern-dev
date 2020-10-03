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
    <transition name="fade">
      <div
        v-if="error"
        class="p-2 bg-yellow-200 text-red-500 border rounded border-yellow-300 text-center mb-5"
      >
        <p>You are subscribed!</p>
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
    <button
      type="input"
      class="bg-yellow-200 px-4 py-1 hover:bg-yellow-300 transform duration-500 ease-in-out hover:-translate-y-1 hover:scale-110 border border-yellow-100 rounded"
    >
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
      fetch("/api/newsletter", {
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
