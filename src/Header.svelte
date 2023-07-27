<script lang="ts">
  import Sidebar from './Sidebar.svelte';
  import TextArea from './TextArea.svelte';

  export let selectedTheme: string = localStorage.theme || 'os';
  export let commentChar = '#';

  export let importFromText: (text: string) => void;

  let importValue = '';

  let sidebarShown = false;

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
</script>

<Sidebar bind:sidebarShown>
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
    <select bind:value={selectedTheme} class="bg-neutral-50 dark:bg-[#333333]">
      <option value="os" selected={!('theme' in localStorage)}>Sync with OS</option>
      <option value="dark" selected={localStorage.theme === 'dark'}>Dark</option>
      <option value="light" selected={localStorage.theme === 'light'}>Light</option>
    </select>
  </div>
</Sidebar>
<div class="header bg-gray-100 dark:bg-black">
  <div class="flex">
    <a href="https://github.com/Vyxal/Luminespire" class="m-auto text-center text-4xl font-bold">
      <h1>Luminespire</h1>
    </a>
  </div>
</div>

<style>
  .header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    padding-top: 10px;
    padding-bottom: 15px;
  }
</style>
