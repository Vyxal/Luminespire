<script lang="ts">
  import { slide } from 'svelte/transition';

  export let sidebarShown: boolean = false;

  let sidebar: HTMLDivElement;

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
    class="sidebar w-max bg-neutral-100 p-5 dark:bg-zinc-900 dark:text-white sm:w-1/4"
    transition:slide={{ duration: 300, axis: 'x' }}>
    <br />
    <slot />
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
    position: fixed;
    top: 0;
    left: 0;
    z-index: 100; /* Make sure it's at the top */
    width: 30px;
    height: 30px;
    margin: 20px;
    cursor: pointer;
  }
</style>
