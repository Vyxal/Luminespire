<script lang="ts">
  import { onMount } from 'svelte';
  import Sortable from 'sortablejs';
  import { importFromText, exportToMetadata, metadataToControl } from './lib/importExport';
  import { newLine, type Line } from './lib/Line';
  import TextArea from './lib/TextArea.svelte';
  import Header from './lib/Header.svelte';
  import CharButtons from './lib/CharButtons.svelte';

  let text = '';
  $: textLines = text.split('\n');

  let commentChar = '#';

  let lines: Line[] = [];

  let clearSelection: () => void;

  let selectedLine: null | number = null;

  function addLine() {
    lines.push(newLine());
    updateSelectedLine(lines.length - 1);
    lines = lines;
  }

  // Users will make at least one line anyway, so begin with one
  addLine();

  let linesEl;
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

  $: maxLen = Math.max(...textLines.map(r => [...r].length));
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
      clearSelection && clearSelection();
    }
  }

  function copyExplanation() {
    navigator.clipboard.writeText(explanation);
  }

  function doImportFromText(importValue: string) {
    const res = importFromText(importValue, commentChar);
    text = res.prog;
    lines = res.lines;
    if (res.selectedLine) {
      updateSelectedLine(res.selectedLine);
    }
  }
</script>

<div class="container mx-auto p-6">
  <Header importFromText={doImportFromText} bind:commentChar />
  <div class="mt-16 space-y-8">
    <section>
      <h2 class="mb-4 text-2xl font-bold text-gray-800">Program</h2>
      <TextArea
        class="h-32 w-full rounded-md border border-gray-300 p-2 font-mono text-sm"
        bind:value={text} />
      <CharButtons {text} bind:lines bind:selectedLine bind:clearSelection />
    </section>

    <section>
      <h2 class="mb-4 text-2xl font-bold text-gray-800">Lines</h2>
      <div class="mb-4 grid grid-cols-12 gap-4 font-semibold text-gray-600">
        <div class="col-span-1">Line</div>
        <div class="col-span-5">Code</div>
        <div class="col-span-5">Explanation</div>
        <div class="col-span-1">Actions</div>
      </div>
      <ul bind:this={linesEl} class="space-y-4">
        {#each lines as line, idx (line.id)}
          <li class="line rounded-lg bg-white p-4 shadow-md transition-shadow hover:shadow-lg">
            <div
              class="grid grid-cols-12 gap-4 items-center"
              on:click={() => updateSelectedLine(idx)}
              on:keypress={() => updateSelectedLine(idx)}>
              <div class="col-span-1 flex items-center">
                <i class="fa-solid fa-grip line-move mr-2 cursor-grab text-gray-400" />
                <div
                  class="h-6 w-6 rounded-full border-2 border-[#5432c3] cursor-pointer"
                  class:bg-[#5432c3]={idx === selectedLine}
                  role="radio"
                  aria-checked={idx === selectedLine}
                  tabindex={idx} />
              </div>
              <div class="col-span-5 overflow-auto break-words font-mono text-sm">
                {line.code
                  .flatMap(
                    (row, r) => row?.map((col, c) => (col ? [...textLines[r]][c] : '')) ?? [],
                  )
                  .join('')}
              </div>
              <div class="col-span-5">
                <TextArea
                  class="w-full rounded-md border border-gray-300 p-2 text-sm"
                  bind:value={line.input} />
              </div>
              <div class="col-span-1 flex flex-col space-y-2">
                <label class="flex items-center">
                  <input type="checkbox" class="mr-2" bind:checked={line.ignoreCode} />
                  <span class="text-sm">No code</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" class="mr-2" bind:checked={line.noComment} />
                  <span class="text-sm">No character</span>
                </label>
                <button
                  on:click={() => {
                    lines.splice(idx, 1);
                    if (selectedLine === idx) {
                      selectedLine = null;
                    }
                    lines = lines;
                  }}
                  class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition-colors hover:bg-gray-300">
                  <i class="fa-solid fa-xmark" />
                </button>
                <button
                  on:click={() => (line.code = [])}
                  class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition-colors hover:bg-gray-300">
                  <i class="fa-solid fa-arrows-rotate" />
                </button>
              </div>
            </div>
          </li>
        {/each}
      </ul>
      <button
        class="mt-4 rounded-md bg-[#5432c3] px-4 py-2 text-white transition-colors hover:bg-[#4a2ca8]"
        on:click={addLine}>Add Line</button>
    </section>

    <section>
      <h2 class="mb-4 text-2xl font-bold text-gray-800">Explanation</h2>
      <TextArea
        readonly
        value={explanation}
        class="h-64 w-full rounded-md border border-gray-300 p-2 font-mono text-sm"
        style="resize: vertical;" />
      <button
        class="mt-4 rounded-md bg-[#5432c3] px-4 py-2 text-white transition-colors hover:bg-[#4a2ca8]"
        on:click={copyExplanation}>Copy to Clipboard</button>
    </section>
  </div>
</div>
