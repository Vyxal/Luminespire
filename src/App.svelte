<script lang="ts">
  import { onMount } from 'svelte';
  import Sortable from 'sortablejs';

  interface Line {
    code: number[][];
    input: string;
    id: number;
  }

  let text = '';
  $: textLines = text.split('\n');

  let commentChar = '#';

  let textAreaClass =
    'resize-none rounded border border-gray-400 font-mono outline-none focus:ring';

  let lines: Line[] = [];

  let selectedLine: null | number = null;

  function addLine() {
    lines.push({
      code: [],
      input: '',
      id: Math.round(Math.random() * 1000) + new Date().getTime(),
    });
    lines = lines;
  }

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

  function select(row: number, col: number) {
    resizeTextArea(explanationEl);
    if (selectedLine === null) return;
    if (!lines[selectedLine].code[row]) {
      lines[selectedLine].code[row] = [];
    }
    const index = lines[selectedLine].code[row].indexOf(col);
    if (index >= 0) {
      lines[selectedLine].code[row].splice(index, 1);
    } else {
      lines[selectedLine].code[row].push(col);
      lines[selectedLine].code[row].sort((a, b) => a - b);
    }
    lines = lines;
  }

  $: maxLen = Math.max(...textLines.map(r => r.length));
  $: explanation = [
    text,
    ...lines.flatMap(line => {
      const rows = textLines
        .map(
          (row, r) =>
            line.code[r]?.length &&
            [...row].map((x, i) => (line.code[r]?.includes(i) ? x : ' ')).join(''),
        )
        .filter(x => x);
      if (rows.length == 0) {
        return [];
      } else {
        const inputLines = line.input.split('\n');
        if (inputLines.length > rows.length) {
          // Pad lines of code in case explanation has more lines
          rows.push(...Array(inputLines.length - rows.length).fill(' '));
        }
        return rows.map((row, i) => {
          if (i < inputLines.length) {
            return row.padEnd(maxLen, ' ') + `  ${commentChar} ` + inputLines[i];
          } else {
            return row;
          }
        });
      }
    }),
  ].join('\n');

  function resizeTextArea(textArea) {
    textArea.style.height = 0;
    textArea.style.height = explanationEl.scrollHeight + 10 + 'px';
  }
</script>

<div class="p-5">
  <h1 class="text-center text-4xl font-bold">Luminespire - The Explanation Assistant</h1>
  <div class="text-xl font-bold">Program</div>
  <textarea
    on:input={e => resizeTextArea(e.target)}
    class={textAreaClass + ' mt-2 h-24 min-h-[50px] w-full p-2'}
    bind:value={text} />
  <div class="flex-col gap-3">
    {#each textLines as row, r}
      <div class="my-4 flex flex-wrap gap-3">
        {#each row as char, c}
          <div
            class="cursor-pointer px-3 py-1 font-mono text-lg"
            class:bg-gray-200={selectedLine === null || !lines[selectedLine].code[r]?.includes(c)}
            class:bg-yellow-400={selectedLine !== null && lines[selectedLine].code[r]?.includes(c)}
            on:click={() => select(r, c)}
            on:keypress={() => select(r, c)}
            role="checkbox"
            aria-checked={lines[selectedLine]?.code[r]?.includes(c)}
            tabindex={c}>
            <!-- Need nbsp since spaces are trimmed -->
            {char == ' ' ? '\xa0' : char}
          </div>
        {/each}
      </div>
    {/each}
  </div>

  <div class="text-xl font-bold">Lines</div>
  <ul bind:this={linesEl}>
    {#each lines as line, idx (line.id)}
      <li class="flex cursor-grab grid-cols-4 items-center gap-3">
        <div
          class="h-5 w-5 cursor-pointer"
          class:bg-gray-300={idx !== selectedLine}
          class:bg-blue-500={idx === selectedLine}
          on:click={() => (selectedLine = idx)}
          on:keypress={() => (selectedLine = idx)}
          role="radio"
          aria-checked={idx === selectedLine}
          tabindex={idx} />
        <div class="w-1/8">Line {idx + 1}</div>
        <div class="w-1/4">
          <code
            >{line.code.flatMap((row, r) => row?.map(c => textLines[r][c]) ?? []).join('')}
          </code>
        </div>
        <div class="w-1/4">
          <textarea class={textAreaClass + ' w-full p-2'} bind:value={line.input} />
        </div>
        <div>
          <button on:click={() => (lines.splice(idx, 1), (lines = lines))} class="btn"
            ><i class="fa-solid fa-xmark" /></button>
          <button on:click={() => (line.code = [])} class="btn"
            ><i class="fa-solid fa-arrows-rotate" /></button>
        </div>
      </li>
    {/each}
  </ul>

  <br />

  <button class="btn" on:click={addLine}>Add Line</button>

  <br />
  <br />

  <div class="text-xl font-bold">Comment character</div>
  <input bind:value={commentChar} class="border" />

  <br />
  <br />

  <div class="grid grid-cols-1">
    <div class="text-xl font-bold">Explanation</div>
    <!-- make this text area expand upon input -->
    <textarea
      bind:this={explanationEl}
      readonly
      value={explanation}
      class={textAreaClass + ' mt-2'}
      cols="50"
      rows="10"
      style="resize: none; height: 20px;" />
  </div>
</div>
