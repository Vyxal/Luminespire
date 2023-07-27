<svelte:options accessors />

<script lang="ts">
  let classProp = '';
  export { classProp as class };
  export let value: string;
  export let readonly: boolean = false;
  export let rows: number = undefined;
  export let cols: number = undefined;
  export let style: string = undefined;
  export let resizable: boolean = false;

  let textArea: HTMLTextAreaElement;

  function resize() {
    if (resizable && textArea) {
      textArea.style.height = '0';
      textArea.style.height = ((textArea.scrollHeight + 30) as Number) + 'px';
    }
  }

  // Resize whenever the explanation text changes
  $: value, resize();
</script>

<!--
  @component A textarea that can automatically resize
 -->
<textarea
  bind:this={textArea}
  class={`resize-none rounded-lg border border-gray-400 px-2 font-mono text-black outline-none focus:ring dark:bg-[#7a7a7a] dark:text-white ${classProp}`}
  bind:value
  {readonly}
  {rows}
  {cols}
  {style} />
