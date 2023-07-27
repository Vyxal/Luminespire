<script lang="ts">
  import { onMount } from 'svelte';
  import Sortable from 'sortablejs';
  import TextArea from './TextArea.svelte';
  import Sidebar from './Sidebar.svelte';

  interface Line {
    code: boolean[][];
    input: string;
    id: number;
    ignoreCode: boolean;
    noComment: boolean;
  }

  let text = '';
  $: textLines = text.split('\n');

  let commentChar = '#';
  let sidebarShown = false;

  let invisCharToMetaLookup = {
    '-': String.fromCharCode(0x00ad),
    '|': String.fromCharCode(0x200b),
    '/': String.fromCharCode(0x200c),
    '[': String.fromCharCode(0x200e),
    ']': String.fromCharCode(0x200f),
    '"': String.fromCharCode(0x206a),
    ',': String.fromCharCode(0x2060),
    '0': String.fromCharCode(0x2061),
    '1': String.fromCharCode(0x2062),
    '2': String.fromCharCode(0x2063),
    '3': String.fromCharCode(0x2064),
  };

  const textAreaClass =
    'resize-none rounded border border-gray-400 font-mono outline-none focus:ring';
  // Class used for identifying char buttons, not for Tailwind
  const charClass = 'char';

  let lines: Line[] = [];

  let selectedLine: null | number = null;
  let prevSelect: [number, number] | null = null;
  let touchStart: [number, number] = null;
  let touchEnd: [number, number] = null;

  function addLine() {
    lines.push({
      code: [],
      input: '',
      id: Math.round(Math.random() * 1000) + new Date().getTime(),
      ignoreCode: false,
      noComment: false,
    });
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

  function shouldUseDark() {
    return 'theme' in localStorage
      ? localStorage.theme !== 'light'
      : !window.matchMedia('(prefers-color-scheme: light)').matches;
  }
  let selectedTheme: string = localStorage.theme || 'os';
  let darkTheme = shouldUseDark();
  $: {
    if (selectedTheme === 'os') {
      localStorage.removeItem('theme');
    } else if (selectedTheme) {
      localStorage.theme = selectedTheme;
    }
    darkTheme = shouldUseDark();
  }
  $: if (darkTheme) {
    console.log('Using dark theme');
    document.documentElement.classList.add('dark');
  } else {
    console.log('Using light theme');
    document.documentElement.classList.remove('dark');
  }
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => {
    darkTheme = !e.matches;
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
      '```\n' + text + exportToMetadata() + (text.includes('\n') ? '\n' : ''),
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

  function decode(str) {
    if (str) {
      return JSON.parse(decodeURIComponent(escape(atob(str))));
    } else {
      return [];
    }
  }

  function importFromVPA(importValue: string) {
    const [flags, header, code, footer, inputs] = decode(new URL(importValue).hash.slice(1));
    text = code;
    sidebarShown = false;
    var sidebar = document.querySelector('.sidebar') as HTMLElement;
    sidebar.hidden = true;
  }

  function importFromText(importValue: string) {
    let explanationLines = importValue.split('\n');
    if (explanationLines.includes('')) {
      // Collect until first empty line
      text = explanationLines.slice(0, explanationLines.indexOf('')).join('\n');

      explanationLines = explanationLines.slice(explanationLines.indexOf('') + 1);
    } else {
      text = explanationLines[0];
      explanationLines = explanationLines.slice(1);
    }

    if (text.includes(invisCharToMetaLookup['-'])) {
      text = text.slice(0, text.indexOf(invisCharToMetaLookup['-']));
    }

    text = text;
    textLines = text.split('\n');

    if (importFromMetadata(importValue)) {
      return;
    }

    let maxLen = Math.max(...textLines.map(x => x.length));

    const range = n => Array.from({ length: n }, (value, key) => key);
    let groups: Array<Array<String>> = [];
    let group = [];
    for (let line of explanationLines) {
      group.push(line);
      if (line.length > maxLen) {
        groups.push(group);
        group = [];
      }
    }

    if (group.length) {
      groups.push(group);
    }

    lines = [];

    for (let group of groups) {
      const comment = group[group.length - 1].slice(maxLen + commentChar.length + 3);
      const codeBlock = group.slice(0, group.length - 1);
      codeBlock.push(group[group.length - 1].slice(0, maxLen));

      addLine();
      selectedLine = lines[lines.length - 1].id;
      // if all lines are blank, skip, marking the lines as "no padding"

      if (group[0].startsWith(commentChar) && !textLines.some(x => x.startsWith(commentChar))) {
        lines[lines.length - 1].ignoreCode = true;
        lines[lines.length - 1].input = group.join('\n').slice(commentChar.length + 1);
        lines = lines;
        explanation = explanation;
        continue;
      }

      lines[lines.length - 1].input = comment;

      for (let line of codeBlock) {
        let row = 0;
        for (let newline of textLines) {
          if (!range(line.length).every(x => textLines[row][x] === line[x] || line[x] === ' ')) {
            row++;
          } else {
            let col = 0;
            for (let char of line) {
              if (textLines[row][col] === char && char !== ' ') {
                if (!lines[lines.length - 1].code[row]) {
                  lines[lines.length - 1].code[row] = [];
                }
                lines[lines.length - 1].code[row][col] = true;
              }
              col++;
            }
          }
        }
      }
    }

    lines = lines;
    explanation = explanation;
  }

  function copyExplanation() {
    navigator.clipboard.writeText(explanation);
  }

  function parseMetadata(data: String, prog: String) {
    // -<line number>|[<code>]|<flags>/...-

    data = data.slice(1, data.length - 1);
    data
      .split('/')
      .filter(x => x)
      .map(subdata => {
        const components = subdata.split('|');
        const lineNumber = parseInt(components[0], 4);
        const [ignoreCode, noComment] = components[components.length - 1]
          .split(',')
          .map(x => x === '1');

        const positions = ignoreCode
          ? []
          : JSON.parse(components[1])
              .filter(x => x)
              .map(x => x.map(y => parseInt(y, 4)));

        while (lines.length <= lineNumber) {
          addLine();
        }

        const thisLine = lines[lineNumber];
        selectedLine = lineNumber;
        thisLine.ignoreCode = ignoreCode;
        thisLine.noComment = noComment;
        thisLine.code = [];
        let input = prog.matchAll(
          new RegExp(
            `${metadataToControl('[' + lineNumber.toString(4))}([^${metadataToControl(
              '01234',
            )}].*)\n?`,
            'g',
          ),
        );

        if (input !== null) {
          thisLine.input = [...input].map(x => x[1]).join('\n');
        }
        if (positions.length) {
          for (let pos of positions) {
            if (!thisLine.code[pos[0]]) {
              thisLine.code[pos[0]] = [];
            }
            thisLine.code[pos[0]][pos[1]] = true;
          }
        }

        lines = lines;
      });
  }

  function convertControlToMetadata(text: String) {
    function swapKeysAndValues(obj: Record<string, any>): Record<string, any> {
      const swappedObj: Record<string, any> = {};

      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          swappedObj[value] = key;
        }
      }

      return swappedObj;
    }
    const invertedLookup = swapKeysAndValues(invisCharToMetaLookup);
    let data = '';
    for (let char of text) {
      data += invertedLookup[char] || char;
    }

    return data;
  }

  function metadataToControl(text: String) {
    let data = '';
    for (let char of text) {
      data += invisCharToMetaLookup[char] || char;
    }

    return data;
  }

  function exportToMetadata() {
    let data = '-';
    lines.map((line, idx) => {
      if (line.code.length || line.ignoreCode) {
        data += `${idx.toString(4)}|${JSON.stringify(
          line.code
            .map((row, rowIdx) =>
              row.map((col, colIdx) =>
                col == true ? [rowIdx.toString(4), colIdx.toString(4)] : '',
              ),
            )
            .flat(),
        )}|${line.ignoreCode ? '1' : '0'},${line.noComment ? '1' : '0'}/`;
      }
    });
    data += '-';
    // console.log(data);
    return metadataToControl(data);
  }

  function importFromMetadata(text: String) {
    const metadata = text.match(
      new RegExp(`${invisCharToMetaLookup['-']}.*${invisCharToMetaLookup['-']}`),
    );
    if (metadata) {
      parseMetadata(convertControlToMetadata(metadata[0]), text);
      return true;
    }
    return false;
  }
</script>

<div class="p-5">
  <Sidebar bind:commentChar {importFromText} bind:sidebarShown bind:selectedTheme />
  <div class="w-full justify-center">
    <a
      href="https://github.com/Vyxal/Luminespire"
      class="text-center text-4xl font-bold">
      <h1>Luminespire</h1>
    </a>
  </div>
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
      class={textAreaClass + ' mt-2'}
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
