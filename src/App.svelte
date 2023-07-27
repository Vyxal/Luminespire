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

<div class="p-5">
  <Header importFromText={doImportFromText} bind:commentChar />
  <!-- TODO mt-14 is a bandaid fix to avoid the Luminespire header covering up the Program -->
  <div class="mt-14 text-xl font-bold">Program</div>
  <TextArea class="mt-2 h-24 min-h-[50px] w-full p-2" bind:value={text} />
  <CharButtons {text} bind:lines bind:selectedLine bind:clearSelection />

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
</style>
