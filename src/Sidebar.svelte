<script lang="ts">
  import { fly, slide } from 'svelte/transition';
  import TextArea from './TextArea.svelte';

  export let sidebarShown: boolean = false;
  export let selectedTheme: string = localStorage.theme || 'os';
  export let commentChar = '#';
  export let importFromText: (text: string) => void;

  let sidebar: HTMLDivElement;
  let importValue = '';

  const slideDuration = 300;
  const transitionDelay = 200;

  function toggleSidebar() {
    sidebarShown = !sidebarShown;
  }

  function shouldUseDark() {
    return 'theme' in localStorage
      ? localStorage.theme !== 'light'
      : !window.matchMedia('(prefers-color-scheme: light)').matches;
  }
  let darkTheme = shouldUseDark();
  $: {
    if (selectedTheme === 'os') {
      localStorage.removeItem('theme');
    } else if (selectedTheme) {
      localStorage.theme = selectedTheme;
    }
    darkTheme = shouldUseDark();
  }
  $: if (darkTheme) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => {
    darkTheme = shouldUseDark();
  });

  $: icon = sidebarShown ? 'fa-xmark text-red-700' : 'fa-bars text-black dark:text-white';
</script>

<i
  class={`burger-menu ${icon} fa-solid cursor-pointer text-2xl`}
  on:click={toggleSidebar}
  on:keypress={toggleSidebar} />

{#if sidebarShown}
  <div
    bind:this={sidebar}
    class="visible fixed left-0 top-0 z-[100] h-screen w-screen bg-gray-50 p-5 dark:bg-zinc-900 sm:w-1/4"
    in:slide={{ duration: slideDuration, axis: 'x' }}
    out:slide={{ delay: transitionDelay, duration: slideDuration, axis: 'x' }}>
    <br />
    <br />
    <div
      class="text-black dark:text-white"
      in:fly={{ delay: transitionDelay, duration: slideDuration }}
      out:fly={{ duration: slideDuration }}>
      <div>
        <div class="flex items-stretch">
          <strong class="text-2xl">Options</strong>
        </div>
        <br />
        <div class="flex items-stretch">
          <p class="pr-5 text-xl font-bold sm:pr-10">Comment character</p>
          <TextArea bind:value={commentChar} class="w-12 border sm:w-16" rows={1} />
        </div>
      </div>
      <br />
      <div>
        <p class="text-xl font-bold">Import Options</p>
        <br />
        <TextArea class="mt-5" bind:value={importValue} />
        <br />
        <button
          class="btn mt-3 sm:mt-5"
          on:click={() => importFromText(importValue)}
          on:keypress={() => importFromText(importValue)}>Import from Explanation</button>
      </div>
      <br />
      <div>
        <label for="theme" class="text-xl font-bold">Theme:</label>
        <select bind:value={selectedTheme} class="bg-gray-100 dark:bg-[#333333]">
          <option value="os" selected={!('theme' in localStorage)}>Sync with OS</option>
          <option value="dark" selected={localStorage.theme === 'dark'}>Dark</option>
          <option value="light" selected={localStorage.theme === 'light'}>Light</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Overlay to shadow everything else. When clicked, sidebar closes -->
  <div
    class="overlay visible fixed left-0 top-0 z-50 h-screen w-screen"
    on:click={toggleSidebar}
    on:keypress={toggleSidebar}
    transition:fly={{ duration: slideDuration }} />
{/if}

<style>
  .burger-menu {
    position: fixed;
    top: 0;
    left: 0;
    width: 30px;
    height: 30px;
    margin: 20px;
    z-index: 1000;
  }

  .overlay {
    box-shadow: inset 0px 0px 0 2000px rgba(0, 0, 0, 0.3);
  }
</style>
