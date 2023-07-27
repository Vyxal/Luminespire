<script lang="ts">
  import Sidebar from './Sidebar.svelte';

  export let commentChar = '#';

  export let importFromText: (text: string) => void;
</script>

<Sidebar bind:commentChar bind:importFromText />
<div class="header fixed left-0 top-0 z-10 w-screen bg-gray-100 pb-[15px] pt-[10px] dark:bg-black">
  <div class="flex">
    <a href="https://github.com/Vyxal/Luminespire" class="m-auto text-center text-4xl font-bold">
      <h1>Luminespire</h1>
    </a>
  </div>
</div>

<style>
</style>
