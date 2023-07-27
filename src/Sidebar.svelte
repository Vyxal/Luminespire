<script lang="ts">
  import { fly, slide } from 'svelte/transition';

  export let sidebarShown: boolean = false;
  /** class/classes for the stuff inside the sidebar */
  export let contentClass: string = '';

  let sidebar: HTMLDivElement;

  const slideDuration = 300;
  const transitionDelay = 200;

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
  <!-- This outer div covers the entire viewport and has a fixed position. This
    allows the overlay to have a fixed position while still being positioned
    relative to the sidebar (since both are children of this outer div)-->
  <div class="invisible fixed inset-0 z-50 h-screen w-screen p-0">
    <div
      bind:this={sidebar}
      class="visible relative left-0 top-0 h-screen w-screen bg-gray-50 p-5 dark:bg-zinc-900 sm:w-1/4"
      in:slide={{ duration: slideDuration, axis: 'x' }}
      out:slide={{ delay: transitionDelay, duration: slideDuration, axis: 'x' }}>
      <br />
      <br />
      <div
        class={contentClass}
        in:fly={{ delay: transitionDelay, duration: slideDuration }}
        out:fly={{ duration: slideDuration }}>
        <slot />
      </div>
    </div>

    <div
      class="overlay visible relative left-0 top-0 h-screen w-screen bg-gray-200 dark:bg-black"
      on:click={toggleSidebar}
      on:keypress={toggleSidebar}>
      foo
    </div>
  </div>
{/if}

<style>
  .burger-menu {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 100; /* Make sure it's at the top */
    width: 30px;
    height: 30px;
    margin: 20px;
  }
</style>
