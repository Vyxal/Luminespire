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
  <div
    bind:this={sidebar}
    class="visible fixed left-0 top-0 z-[100] h-screen w-screen bg-gray-50 p-5 dark:bg-zinc-900 sm:w-1/4"
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
    class="overlay visible absolute left-0 top-0 z-50 h-screen w-screen"
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
