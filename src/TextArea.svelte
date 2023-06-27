<script>
  export let value = '';
  export let classProp = '';

  export function resizeTextarea(e) {
    e.target.style.height = 0;
    e.target.style.height = e.target.scrollHeight + 10 + 'px';
  }

  export { classProp as class };
</script>

<textarea
  on:input={resizeTextarea}
  class={`resize-none border border-gray-400 font-mono outline-none focus:ring rounded ${classProp}`}
  bind:value
/>
