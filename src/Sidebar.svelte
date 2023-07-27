<script lang="ts">
  import TextArea from './TextArea.svelte';

  export let commentChar: string = '#';
  export let sidebarShown: boolean = false;

  export let selectedTheme: string;
  export let importFromText: (importValue: string) => void;

  let sidebar: HTMLDivElement;

  let importValue: string;

  function toggleSidebar() {
    sidebarShown = !sidebarShown;
  }

  $: icon = sidebarShown ? 'fa-xmark text-red-700' : 'fa-bars text-black dark:text-white';
</script>

<i
  class={`burger-menu ${icon} fa-solid cursor-pointer text-2xl`}
  on:click={toggleSidebar}
  on:keypress={toggleSidebar} />

{#if sidebarShown}
  <div
    bind:this={sidebar}
    class="sidebar w-max bg-neutral-100 p-5 dark:bg-zinc-900 dark:text-white sm:w-1/4">
    <div>
      <div class="flex items-stretch">
        <i
          class="fa-solid fa-xmark w-8 text-2xl text-red-700"
          on:click={() => (sidebarShown = false)}
          on:keypress={() => (sidebarShown = false)} />
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
      <select bind:value={selectedTheme} class="bg-neutral-50 dark:bg-[#333333]">
        <option value="os" selected={!('theme' in localStorage)}>Sync with OS</option>
        <option value="dark" selected={localStorage.theme === 'dark'}>Dark</option>
        <option value="light" selected={localStorage.theme === 'light'}>Light</option>
      </select>
    </div>
  </div>
{/if}

<style>
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 25%;
    height: 100vh;
    transition: 0.3s;
  }

  .burger-menu {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 100; /* Make sure it's at the top */
    width: 30px;
    height: 30px;
    margin: 20px;
    cursor: pointer;
  }
</style>
