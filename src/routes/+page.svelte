<script lang="ts">
	import { STATIONS } from '$lib/radio/stations';
	import type { RadioStationSong } from '$lib/radio/stations';
	import WidthBasedMarquee from '$lib/WidthBasedMarquee.svelte';
	import { onDestroy, onMount } from 'svelte';
	import { writable, type Writable } from 'svelte/store';

	let currentStationIdx = -1;

	$: currentStation = STATIONS[currentStationIdx];
	let songInfo: Writable<RadioStationSong | null> = writable(null);
	let player: HTMLAudioElement | null = null;
	let desiredVolume = 80;

	$: player,
		(() => {
			if (typeof document != 'undefined') {
				document.title = player ? `EDCC - ${currentStation.name}` : 'EDCC';
			}
		})();

	function changeStation(delta: number) {
		currentStationIdx += delta;
		if (currentStationIdx == STATIONS.length) {
			currentStationIdx = 0;
		} else if (currentStationIdx < 0) {
			currentStationIdx = STATIONS.length - 1;
		}

		songInfo = STATIONS[currentStationIdx].songInfo;

		player?.pause();

		if (player) {
			// Replace the current player.
			player = new Audio(STATIONS[currentStationIdx].streamUrl);
			player.volume = desiredVolume / 100;
			player.play();
		}
	}

	onMount(() => {
		changeStation(1); // Initial change.
	});

	onDestroy(() => {
		player?.pause();
	});
</script>

<div class="bg-base-dim text-orange-bright absolute inset-0">
	<div class="border-b-orange-dim border-t-orange-dim mt-2 border-b-4 border-t-4 px-4 text-xl">
		Welcome back, CMDR Lcyx
	</div>

	<div class="relative mx-auto mt-20 h-60 w-[50rem] rounded-md bg-[#1b1b1b] p-6">
		<div
			class:bg-red-bright={player}
			class:bg-red-dim={!player}
			class="ring-red-dim ring-px absolute left-5 top-5 h-3 w-3 rounded-full"
		></div>

		<div class="flex h-full w-full justify-center">
			<div class="ml-10 mt-2">
				<button
					class="mt-6 h-20 w-20 rounded-full bg-[#2c2c2c] text-xs"
					title="Click to toggle, scroll to change volume."
					on:wheel={(e) => {
						if (e.deltaY < 1) {
							if (desiredVolume < 100) {
								desiredVolume += 5;
							}
						} else {
							if (desiredVolume > 0) {
								desiredVolume -= 5;
							}
						}

						if (player) {
							player.volume = desiredVolume / 100;
						}
					}}
					on:click={() => {
						if (player) {
							player.pause();
							player = null;
						} else {
							player = new Audio(STATIONS[currentStationIdx].streamUrl);
							player.volume = desiredVolume / 100;
							player.play();
						}
					}}
				>
					<div class="h-full w-full" style="transform: rotate({(desiredVolume / 100) * 360}deg);">
						^
					</div>
				</button>

				<div class="mx-auto mt-6 flex w-12 justify-between text-xl">
					<button title="Previous station" on:click={() => changeStation(-1)}>&lt;&lt;</button>
					<button title="Next station" on:click={() => changeStation(1)}>&gt;&gt;</button>
				</div>
			</div>

			<div class="ml-20 flex-1">
				<div
					class="font-segment relative h-28 space-y-4 rounded-md bg-[#0f0f0f] px-4 py-3 text-5xl"
				>
					<p class="text-blue-bright h-12 w-[14ch] overflow-hidden text-nowrap">
						{#if player}
							<WidthBasedMarquee
								text={(currentStation?.name || '').replaceAll(
									/ /g,
									'<span style="opacity: 0;">0</span>'
								)}
								maxCharacters={14}
							/>
						{/if}
					</p>
					<p class="text-blue-dim absolute bottom-3 h-7 w-[34ch] overflow-hidden text-xl">
						{#if player}
							<WidthBasedMarquee
								text={[$songInfo?.name, $songInfo?.author]
									.filter((p) => p)
									.join(' - ')
									.replaceAll(/ /g, '<span style="opacity: 0;">0</span>')}
								maxCharacters={34}
							/>
						{/if}
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
