<script lang="ts">
	import { onMount } from 'svelte';
	import Sortable from 'sortablejs';

	interface Line {
		code: number[];
		input: string;
		id: number;
	}

	let text = '';

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
	let programEl;

	onMount(() => {
		Sortable.create(linesEl, {
			group: {
				name: 'lines',
				put: true,
			},
			animation: 200,
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
		programEl.oninput = () => {
	// Resize the textarea to fit the content
	programEl.style.height = 0;
	programEl.style.height = programEl.scrollHeight + 'px';
  }
	});

	function select(idx: number) {
		if (selectedLine === null) return;
		const index = lines[selectedLine].code.indexOf(idx);
		if (index >= 0) {
			lines[selectedLine].code.splice(index, 1);
		} else {
			lines[selectedLine].code.push(idx);
		}
		lines[selectedLine].code = lines[selectedLine].code;
	}

  $: explanation = [text, ...lines.map(line => [...text].map((x, i) => line.code.includes(i) ? x : ' ').join('') + "  # " + line.input)].join("\n");

	$: console.log(lines);




</script>

<div class="p-5">
	<h1>Luminespire - The Explanation Assistant</h1>
	<div class="space-y-4">
			<strong>Program</strong>
			<br/>
			<textarea bind:this={programEl} id="program" class="resize-none hover:resize border border-gray-400 h-24 font-mono w-full h-fit" bind:value={text} />
	</div>
	<div class="flex flex-wrap gap-3 my-4">
		{#each text as char, idx }
			<div
				class="text-lg cursor-pointer py-1 px-3"
				class:bg-gray-200={selectedLine === null || !lines[selectedLine].code.includes(idx)}
				class:bg-yellow-400={selectedLine !== null && lines[selectedLine].code.includes(idx)}
				on:click={() => select(idx)}
        role="checkbox"
			>
				{char}
			</div>
		{/each}
	</div>

	<strong>Lines</strong>

	<ul bind:this={linesEl}>
		{#each lines as line, idx (line.id)}
			<li class="flex items-center gap-3">
				<div
					class="w-5 h-5 cursor-pointer"
					class:bg-gray-300={idx !== selectedLine}
					class:bg-blue-500={idx === selectedLine}
					on:click={() => (selectedLine = idx)}
					role="radio"
				/>
				<div>Line {idx + 1}</div>
				<div>{'{' + line.code.map((x) => text[x]).join('') + '}'}</div>
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
