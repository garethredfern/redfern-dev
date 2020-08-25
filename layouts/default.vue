<template>
  <div>
    <header class="px-5 py-1 mb-5">
      <h1>
        <a href="/" class="text-3xl uppercase">
          <span class="font-thin">redfern</span>dev
        </a>
      </h1>
    </header>
    <main class="container mx-auto p-5">
      <Nuxt />
    </main>
    <footer>
      <div class="text-center p-5">
        <small>&copy; {{ new Date().getFullYear() }}</small>
      </div>
    </footer>
  </div>
</template>
