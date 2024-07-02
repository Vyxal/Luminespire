<script lang="ts">
  import type { Line } from './Line';

  // Class used for identifying char buttons, not for Tailwind
  const charClass = 'char';

  let prevSelect: [number, number] | null = null;
  let touchStart: [number, number] = null;
  let touchEnd: [number, number] = null;

  export let lines: Line[];
  export let selectedLine: number | null;
  export let text: string;
  $: textLines = text.split('\n');

  export function clearSelection() {
    prevSelect = null;
    touchStart = null;
    touchEnd = null;
  }

  /** Swap a range if the start comes after the end */
  function swapRange([startRow, startCol], [endRow, endCol]) {
    if (startRow > endRow || (startRow === endRow && startCol > endCol)) {
      return [endRow, endCol, startRow, startCol];
    } else {
      return [startRow, startCol, endRow, endCol];
    }
  }

  function selectRange(
    code: boolean[][],
    start: [number, number],
    end: [number, number],
    opposite: boolean,
  ) {
    // The new value of all the chars is the same as that of the first selected char
    let setTo = Boolean(code[start[0]]?.[start[1]]);
    if (opposite) setTo = !setTo;
    const [startRow, startCol, endRow, endCol] = swapRange(start, end);
    for (let row = startRow; row <= endRow; row++) {
      if (!code[row]) {
        code[row] = [];
      }
      let start = row === startRow ? startCol : 0;
      let end = row === endRow ? endCol : textLines[row].length - 1;
      for (let col = start; col <= end; col++) {
        code[row][col] = setTo;
      }
    }
    lines = lines;
  }

  function select(row: number, col: number, shift: boolean = false) {
    if (selectedLine === null) return;
    const code = lines[selectedLine].code;
    if (shift && prevSelect) {
      // Use Shift+Click to select or deselect multiple characters
      selectRange(code, prevSelect, [row, col], false);
    } else {
      if (!code[row]) {
        code[row] = [];
      }
      code[row][col] = !code[row][col];
    }
    prevSelect = [row, col];
    lines = lines;
  }

  /** Check if a character is within an inclusive range */
  function inTouchRange(row: number, col: number) {
    if (touchStart === null || touchEnd === null) return false;
    const [startRow, startCol, endRow, endCol] = swapRange(touchStart, touchEnd);
    // todo kinda verbose
    if (row === startRow && col < startCol) {
      return false;
    } else if (row === endRow && col > endCol) {
      return false;
    } else {
      return startRow <= row && row <= endRow;
    }
  }

  function onTouchMove(e: TouchEvent) {
    const elem = document.elementFromPoint(
      e.changedTouches[0].clientX,
      e.changedTouches[0].clientY,
    );
    if (elem?.classList?.contains(charClass)) {
      const row = parseInt(elem.getAttribute('row'));
      const col = parseInt(elem.getAttribute('tabindex'));
      if (row !== touchStart[0] || col !== touchStart[1]) {
        // Ensure selecting multiple rather than tapping single character
        touchEnd = [row, col];
        lines = lines;
      }
    }
  }

  function onMouseMove(e: MouseEvent) {
    const elem = document.elementFromPoint(e.clientX, e.clientY);
    if (elem?.classList?.contains(charClass)) {
      const row = parseInt(elem.getAttribute('row'));
      const col = parseInt(elem.getAttribute('tabindex'));
      if (row !== touchStart[0] || col !== touchStart[1]) {
        // Ensure selecting multiple rather than tapping single character
        touchEnd = [row, col];
        lines = lines;
      }
    }
  }
</script>

<!--
  @component
  This component is for the buttons that are used to select characters for each line.
-->
<div class="my-4 flex-col text-black">
  {#each textLines as row, r}
    <div class="flex flex-wrap">
      {#if row?.length}
        {#each Array.from(row) as char, c}
          <div
            class={`cursor-pointer touch-none select-none px-2 py-1 font-mono text-lg ${charClass} ${
              selectedLine === null || lines[selectedLine] === undefined
                ? 'bg-gray-200'
                : inTouchRange(r, c)
                ? 'bg-yellow-400'
                : lines[selectedLine].code[r]?.[c]
                ? 'bg-[#af9ee6]'
                : 'bg-gray-200'
            }`}
            on:click={e => select(r, c, e.shiftKey)}
            on:keypress={() => select(r, c)}
            on:touchstart={() => {
              touchStart = [r, c];
              touchEnd = null;
            }}
            on:touchcancel={() => {
              touchStart = null;
              touchEnd = null;
            }}
            on:touchmove={onTouchMove}
            on:touchend={onTouchMove}
            on:mousemove={e => {
              if (e.buttons === 1) {
                onMouseMove(e);
              }
            }}
            on:mousedown={() => {
              touchStart = [r, c];
              touchEnd = null;
            }}
            role="checkbox"
            aria-checked={lines[selectedLine]?.code[r]?.[c]}
            tabindex={c}
            row={r}>
            <!-- Need nbsp since spaces are trimmed -->
            {char == ' ' ? '\xa0' : char}
          </div>
        {/each}
      {:else}
        <div class="select-none px-2 py-1 font-mono text-lg">&nbsp;</div>
      {/if}
    </div>
  {/each}
</div>

<button
  on:click={() => {
    if (touchStart !== null && touchEnd !== null && lines[selectedLine] !== undefined) {
      selectRange(lines[selectedLine].code, touchStart, touchEnd, true);
      touchStart = null;
      touchEnd = null;
      lines = lines;
    }
  }}
  class="btn">Toggle Selection</button>

<style>
  .selectedChar {
    background-color: #af9ee6;
  }
</style>
