<script lang="ts">
  import { onMount } from 'svelte';
  import Sortable from 'sortablejs';

  interface Line {
    code: boolean[][];
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
  let prevSelect: [number, number] | null = null;
  // The start and end of the range selected by the mouse
  let tentativeSelect: [number, number, number, number] = null;
  let mouseDown = false;

  function addLine() {
    lines.push({
      code: [],
      input: '',
      id: Math.round(Math.random() * 1000) + new Date().getTime(),
    });
    updateSelectedLine(lines.length - 1);
    lines = lines;
  }

  function calculateSelection() {
    console.log('calculateSelection()');
    let selectedContent = window.getSelection();
    console.log(
      selectedContent.anchorNode.parentElement.getAttribute('name') !== 'EC',
      selectedContent.focusNode.parentElement.getAttribute('name') !== 'EC',
    );
    if (selectedContent.anchorNode === null) {
      return;
    }
    if (
      selectedContent.anchorNode.parentElement.getAttribute('name') !== 'EC' ||
      selectedContent.focusNode.parentElement.getAttribute('name') !== 'EC'
    ) {
      return;
    }

    if (selectedContent.toString() === '') {
      return;
    }

    console.log("Y'all ready to get funky?");

    let start = selectedContent.anchorNode.parentElement as HTMLElement;
    let end = selectedContent.focusNode.parentElement.nextElementSibling as HTMLElement;

    if (start === null || end === null) {
      return;
    }

    do {
      select(parseInt(start.getAttribute('row')), parseInt(start.getAttribute('tabindex')));
      start = start.nextElementSibling as HTMLElement;
    } while (start !== end);
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

  function selectRange(
    code: boolean[][],
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
  ) {
    // The new value of all the chars is the same as that of the first selected char
    let setTo = Boolean(code[startRow]?.[startCol]);
    if (startRow > endRow || (startRow === endRow && startCol > endCol)) {
      // Swap the range start and end if necessary
      let temp = startRow;
      startRow = endRow;
      endRow = temp;
      temp = startCol;
      startCol = endCol;
      endCol = temp;
    }
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
  }

  function select(row: number, col: number, shift: boolean = false) {
    if (selectedLine === null) return;
    const code = lines[selectedLine].code;
    if (shift && prevSelect) {
      // Use Shift+Click to select or deselect multiple characters
      selectRange(code, prevSelect[0], prevSelect[1], row, col);
    } else {
      if (!code[row]) {
        code[row] = [];
      }
      code[row][col] = !code[row][col];
    }
    prevSelect = [row, col];
    lines = lines;
    resizeTextArea(explanationEl);
  }

  $: maxLen = Math.max(...textLines.map(r => r.length));
  $: explanation = [
    text,
    ...lines.flatMap(line => {
      const rows = textLines
        .map(
          (row, r) =>
            line.code[r]?.includes(true) &&
            [...row].map((x, i) => (line.code[r]?.[i] ? x : ' ')).join(''),
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
    textArea.style.height = explanationEl.scrollHeight + 30 + 'px';
  }

  function updateSelectedLine(selected) {
    if (selected !== selectedLine) {
      selectedLine = selected;
      prevSelect = null;
    }
  }

  // From https://stackoverflow.com/a/48970682
  function updateMouseState(e: MouseEvent) {
    mouseDown = (e.buttons & 1) === 1;
  }

  document.addEventListener('mousedown', updateMouseState);
  document.addEventListener('mousemove', updateMouseState);
  document.addEventListener('mouseup', updateMouseState);

  $: if (!mouseDown && tentativeSelect !== null && selectedLine !== null) {
    selectRange(lines[selectedLine]?.code, ...tentativeSelect);
    tentativeSelect = null;
  }
  // todo update mouseDown and tentativeSelect when mouse moves onto buttons
</script>

<div class="p-5">
  <h1 class="text-center text-4xl font-bold">Luminespire - The Explanation Assistant</h1>
  <div class="text-xl font-bold">Program</div>
  <textarea
    on:input={e => resizeTextArea(e.target)}
    class={textAreaClass + ' mt-2 h-24 min-h-[50px] w-full p-2'}
    bind:value={text} />
  <div class="my-4 flex-col" on:mouseup={() => calculateSelection()}>
    {#each textLines as row, r}
      <div class="flex flex-wrap">
        {#if row?.length}
          {#each row as char, c}
            <div
              class="cursor-pointer px-2 py-1 font-mono text-lg"
              class:bg-gray-200={selectedLine === null || !lines[selectedLine]?.code[r]?.[c]}
              class:bg-yellow-400={selectedLine !== null && lines[selectedLine]?.code[r]?.[c]}
              on:click={e => select(r, c, e.shiftKey)}
              on:keypress={() => select(r, c)}
              role="checkbox"
              aria-checked={lines[selectedLine]?.code[r]?.[c]}
              tabindex={c}
              name="EC"
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

  <div class="text-xl font-bold">Lines</div>
  <ul bind:this={linesEl}>
    {#each lines as line, idx (line.id)}
      <li class="flex cursor-grab grid-cols-4 items-center gap-3">
        <div
          class="h-5 w-5 cursor-pointer"
          class:bg-gray-300={idx !== selectedLine}
          class:bg-blue-500={idx === selectedLine}
          on:click={() => updateSelectedLine(idx)}
          on:keypress={() => updateSelectedLine(idx)}
          role="radio"
          aria-checked={idx === selectedLine}
          tabindex={idx} />
        <div class="w-1/8">Line {idx + 1}</div>
        <div class="w-1/4">
          <code class="font-mono"
            >{line.code
              .flatMap((row, r) => row?.map((col, c) => (col ? textLines[r][c] : '')) ?? [])
              .join('')}
          </code>
        </div>
        <div class="w-1/4">
          <textarea class={textAreaClass + ' w-full p-2'} bind:value={line.input} />
        </div>
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
