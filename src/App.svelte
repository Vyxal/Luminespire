<script lang="ts">
	import { onMount } from 'svelte';
	import Sortable from 'sortablejs';

	interface Line {
		code: number[][];
		input: string;
		id: number;
	}

	let text = '';
	$: textLines = text.split("\n");

	let lines: Line[] = [];

	let selectedLine: null | number = null;

	function addLine() {
		lines.push({
			code: [],
			input: '',
			id: Math.round(Math.random() * 1000) + new Date().getTime()
		});
		lines = lines;
	}

	let linesEl;

	onMount(() => {
		Sortable.create(linesEl, {
			group: {
				name: 'lines',
				put: true,
			},
			animation: 200,
			chosenClass: "cursor-grabbing",
			onEnd: ev => {
				if (lines.length <= 1) return;
				[lines[ev.oldIndex], lines[ev.newIndex]] = [lines[ev.newIndex], lines[ev.oldIndex]];
				if (selectedLine === ev.oldIndex) {
					selectedLine = ev.newIndex;
				} else if (selectedLine === ev.newIndex) {
					selectedLine = ev.oldIndex;
				}
				lines = lines;
			}
		});
	});

	function select(row: number, col: number) {
		if (selectedLine === null) return;
		if (!lines[selectedLine].code[row]) {
			lines[selectedLine].code[row] = [];
		}
		const index = lines[selectedLine].code[row].indexOf(col);
		if (index >= 0) {
			lines[selectedLine].code.splice(index, 1);
		} else {
			lines[selectedLine].code[row].push(col);
			lines[selectedLine].code[row].sort((a, b) => a - b);
		}
		lines[selectedLine].code = lines[selectedLine].code;
	}

  $: explanation = [
			text,
			...lines.flatMap(line => {
			  let rows = textLines
					.filter((_, r) => line.code[r] !== undefined)
					.map((row, r) => [...row].map((x, i) => line.code[r]?.includes(i) ? x : ' ').join(''));
				if (rows.length == 0) {
					return [];
				} else {
					return [rows[0] + "  # " + line.input, ...rows.slice(1)]
				}
			})
		].join("\n");

	function programOnInput(e) {
		e.target.style.height = 0;
		e.target.style.height = e.target.scrollHeight + 10 + 'px';
	}
</script>

<div class="p-5">
	<h1 class="text-4xl font-bold text-center">Luminespire - The Explanation Assistant</h1>
	<div class="font-bold">Program</div>
	<textarea on:input={programOnInput} id="program" class="resize-none min-h-[50px] border border-gray-400 h-24 font-mono w-full max-w-md mt-4" bind:value={text} />
	<div class="flex-col gap-3">
		{#each textLines as row, r}
		  <div class="flex flex-wrap gap-3 my-4">
				{#each row as char, c}
					<div
						class="text-lg cursor-pointer py-1 px-3"
						class:bg-gray-200={selectedLine === null || !lines[selectedLine].code[r]?.includes(c)}
						class:bg-yellow-400={selectedLine !== null && lines[selectedLine].code[r]?.includes(c)}
						on:click={() => select(r, c)}
						role="checkbox"
					>
						{char}
					</div>
				{/each}
			</div>
		{/each}
	</div>

	<strong>Lines</strong>

	<ul bind:this={linesEl}>
		{#each lines as line, idx (line.id)}
			<li class="flex items-center gap-3 cursor-grab">
				<div
					class="w-5 h-5 cursor-pointer"
					class:bg-gray-300={idx !== selectedLine}
					class:bg-blue-500={idx === selectedLine}
					on:click={() => (selectedLine = idx)}
					role="radio"
				/>
				<div>Line {idx + 1}</div>
				<div>{'{' + line.code.flatMap((row, r) => row?.map(c => textLines[r][c]) ?? []).join('') + '}'}</div>
				<textarea bind:value={line.input} class="border border-gray-400" />
				<button on:click={() => (lines.splice(idx, 1), (lines = lines))} class="btn">Remove</button>
				<button on:click={() => (line.code = [])} class="btn">Clear</button>
			</li>
		{/each}
	</ul>

	<br />

	<button class="btn" on:click={addLine}>Add Line</button>

	<br />
	<br />

	<strong>Explanation</strong>
	<br />

	<textarea readonly value={explanation} class="border border-gray-400 font-mono" cols="50" rows="10" />
</div>
