<script lang="ts">
  import { onMount } from 'svelte';
  import Sortable from 'sortablejs';
  import TextArea from './TextArea.svelte';
  import Header from './Header.svelte';
  import { importFromText, exportToMetadata, metadataToControl } from './importExport';
  import { newLine, type Line } from './Line';

  let text = '';
  $: textLines = text.split('\n');

  let commentChar = '#';

  // Class used for identifying char buttons, not for Tailwind
  const charClass = 'char';

  let lines: Line[] = [];

  let selectedLine: null | number = null;
  let prevSelect: [number, number] | null = null;
  let touchStart: [number, number] = null;
  let touchEnd: [number, number] = null;

  function addLine() {
    lines.push(newLine());
    updateSelectedLine(lines.length - 1);
    lines = lines;
  }

  // Users will make at least one line anyway, so begin with one
  addLine();

  let linesEl;
  let explanationEl;
  onMount(() => {
    Sortable.create(linesEl, {
      group: {
        name: 'lines',
        put: true,
      },
      animation: 200,
      chosenClass: 'cursor-grabbing',
      handle: '.line-move',
      onEnd: ev => {
        if (lines.length <= 1) return;
        [lines[ev.oldIndex], lines[ev.newIndex]] = [lines[ev.newIndex], lines[ev.oldIndex]];
        if (selectedLine === ev.oldIndex) {
          selectedLine = ev.newIndex;
        } else if (selectedLine === ev.newIndex) {
          selectedLine = ev.oldIndex;
        }
        lines = lines;
      },
    });
  });

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

  let languageMode = '';

  $: maxLen = Math.max(...textLines.map(r => r.length));
  $: explanation =
    [
      '```\n' + text + exportToMetadata(lines) + (text.includes('\n') ? '\n' : ''),
      ...lines.flatMap((line, idx) => {
        const rows = textLines
          .map(
            (row, r) =>
              line.code[r]?.includes(true) &&
              !line.ignoreCode &&
              [...row].map((x, i) => (line.code[r]?.[i] ? x : ' ')).join(''),
          )
          .filter(x => x);
        if (rows.length == 0 && !line.ignoreCode) {
          return [];
        } else {
          const inputLines = line.input.split('\n');
          if (inputLines.length > rows.length) {
            // Pad lines of code in case explanation has more lines
            rows.push(...Array(inputLines.length - rows.length).fill(' '));
          }
          return rows.map((row, i) => {
            if (i < inputLines.length) {
              if (lines[idx].ignoreCode) {
                return `${lines[idx].noComment ? '' : commentChar + ' '}${metadataToControl(
                  '[' + idx.toString(4),
                )}${inputLines[i]}`;
              }
              return (
                row.padEnd(maxLen, ' ') +
                `  ${lines[idx].noComment ? '' : commentChar + ' '}${metadataToControl(
                  '[' + idx.toString(4),
                )}` +
                inputLines[i]
              );
            } else {
              return row;
            }
          });
        }
      }),
    ].join('\n') +
    '\n💎\n```\nCreated with the help of [Luminespire](https://vyxal.github.io/Luminespire).';

  function updateSelectedLine(selected) {
    if (selected !== selectedLine) {
      selectedLine = selected;
      prevSelect = null;
    }
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

  function copyExplanation() {
    navigator.clipboard.writeText(explanation);
  }

  function doImportFromText(text: string) {
    const res = importFromText(text, commentChar);
    text = res.prog;
    lines = res.lines;
    selectedLine = res.selectedLine ?? selectedLine;
  }
</script>

<div class="p-5">
  <Header importFromText={doImportFromText} bind:commentChar bind:selectedTheme />
  <div class="text-xl font-bold">Program</div>
  <TextArea class="mt-2 h-24 min-h-[50px] w-full p-2" bind:value={text} />
  <div class="my-4 flex-col text-black">
    {#each textLines as row, r}
      <div class="flex flex-wrap">
        {#if row?.length}
          {#each row as char, c}
            <div
              class={`cursor-pointer touch-none select-none px-2 py-1 font-mono text-lg ${charClass}`}
              class:bg-gray-200={selectedLine === null ||
                lines[selectedLine] === undefined ||
                (!lines[selectedLine].code[r]?.[c] && !inTouchRange(r, c))}
              class:selectedChar={selectedLine !== null &&
                lines[selectedLine]?.code?.[r]?.[c] &&
                !inTouchRange(r, c)}
              class:bg-yellow-400={selectedLine !== null &&
                lines[selectedLine] !== undefined &&
                inTouchRange(r, c)}
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

  <br /><br />

  <div class="text-xl font-bold">Lines</div>
  <div class="flex w-full">
    <p class="mr-8 w-6">Line</p>
    <p class="w-2/5">Code</p>
    <p class="mr-4 w-2/5">Explanation</p>
  </div>
  <br />
  <ul bind:this={linesEl}>
    {#each lines as line, idx (line.id)}
      <li class="line">
        <div
          class="flex w-full"
          on:click={() => updateSelectedLine(idx)}
          on:keypress={() => updateSelectedLine(idx)}>
          <div><i class="fa-solid fa-grip line-move mr-4 cursor-grab" /></div>
          <div
            class="line-checkbox mr-4 h-6 w-6 cursor-pointer"
            class:bg-gray-300={idx !== selectedLine}
            class:checkbox={idx === selectedLine}
            role="radio"
            aria-checked={idx === selectedLine}
            tabindex={idx} />
          <div class="line-text w-2/5 overflow-auto break-words font-mono">
            {line.code
              .flatMap((row, r) => row?.map((col, c) => (col ? textLines[r][c] : '')) ?? [])
              .join('')}
          </div>
          <div class="mr-4 w-2/5">
            <TextArea class="line-textarea w-full" bind:value={line.input} />
          </div>
          <div class="w-1/5 sm:grid sm:grid-cols-2">
            <div class="grid grid-rows-2">
              <div>
                <label><input type="checkbox" bind:checked={line.ignoreCode} />No code</label>
              </div>
              <div>
                <label><input type="checkbox" bind:checked={line.noComment} />No character</label>
              </div>
            </div>
            <div class="">
              <div>
                <button
                  on:click={() => {
                    lines.splice(idx, 1);
                    if (selectedLine === idx) {
                      selectedLine = null;
                    }
                    lines = lines;
                  }}
                  class="btn"><i class="fa-solid fa-xmark" /></button>
              </div>
              <div>
                <button on:click={() => (line.code = [])} class="btn"
                  ><i class="fa-solid fa-arrows-rotate" /></button>
              </div>
            </div>
          </div>
        </div>
      </li>
    {/each}
  </ul>

  <br />

  <button class="btn" on:click={addLine}>Add Line</button>

  <div class="mt-8 grid grid-cols-1">
    <div class="text-xl font-bold">Explanation</div>
    <!-- make this text area expand upon input -->
    <TextArea
      bind:this={explanationEl}
      readonly
      value={explanation}
      class="mt-2"
      cols={50}
      rows={10}
      style="resize: none; height: 50px"
      resizable={true} />

    <button class="btn mt-4" on:click={copyExplanation}>Click to copy to clipboard</button>
  </div>
  <!--
  <button on:click={exportToMetadata}>Export (debug)</button>-->
</div>

<style>
  .checkbox {
    background-color: #5432c3;
  }

  .selectedChar {
    background-color: #af9ee6;
  }
</style>
