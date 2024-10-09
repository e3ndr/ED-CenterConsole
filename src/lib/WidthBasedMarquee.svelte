<script lang="ts">
	import { onMount } from 'svelte';

	export let text: string;
	export let maxCharacters: number;

	let direction = -1;
	let offset = 0;

	onMount(() => {
		const id = setInterval(() => {
			const textLength = text.length;

			if (textLength <= maxCharacters) {
				offset = 0;
				return;
			}

			offset += direction;
			if (direction == -1) {
				if (textLength + offset == maxCharacters) {
					direction = 1;
				}
			} else {
				if (offset == 0) {
					direction = -1;
				}
			}
		}, 1_500);
		return () => clearInterval(id);
	});
</script>

<span
	class="inline-block text-nowrap"
	style="margin: 0; padding: 0; transform: translateX({offset}ch);"
>
	{@html text.replaceAll(
		/ /g,
		'<span style="opacity: 0; user-select: none;">0</span><span style="font-size: 0;"> </span>'
	)}
</span>
