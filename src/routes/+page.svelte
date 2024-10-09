<script lang="ts">
	import WidthBasedMarquee from '$lib/WidthBasedMarquee.svelte';

	import { EDLA_INSTANCE, EDLAState } from '$lib/EDLA';
	import { STATIONS, type RadioStationSong } from '$lib/radio/stations';
	import { onDestroy, onMount } from 'svelte';
	import { writable, type Writable } from 'svelte/store';

	const edlaState = EDLA_INSTANCE.state;
	const edlaStatus = EDLA_INSTANCE.status;
	const edlaLocation = EDLA_INSTANCE.location;
	const edlaCommander = EDLA_INSTANCE.commander;
	const edlaEmergencyOxygen = EDLA_INSTANCE.emergencyOxygen;

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

	onMount(() =>
		edlaEmergencyOxygen.subscribe(() => {
			updatePlayer(player ? true : false);
		})
	);

	function updatePlayer(create: boolean) {
		player?.pause();
		player = null;

		if (!create) return;

		// Replace the current player.
		player = new Audio(STATIONS[currentStationIdx].streamUrl);
		player.crossOrigin = 'anonymous';
		player.volume = desiredVolume / 100;

		if ($edlaEmergencyOxygen) {
			const audioContext = new AudioContext();
			const source = audioContext.createMediaElementSource(player);

			const gainNode = audioContext.createGain();
			gainNode.gain.value = 0.9;

			// Lowpass filter to muddle the band.
			const filterNode = audioContext.createBiquadFilter();
			filterNode.type = 'lowpass';
			filterNode.frequency.value = 400;

			// Delay for additional effect.
			const delayNode = audioContext.createDelay();
			delayNode.delayTime.value = 0.2;

			source.connect(gainNode);
			gainNode.connect(filterNode);
			filterNode.connect(delayNode);
			delayNode.connect(audioContext.destination);
		}

		player.play();
	}

	function changeStation(delta: number) {
		currentStationIdx += delta;
		if (currentStationIdx == STATIONS.length) {
			currentStationIdx = 0;
		} else if (currentStationIdx < 0) {
			currentStationIdx = STATIONS.length - 1;
		}

		songInfo = STATIONS[currentStationIdx].songInfo;
		updatePlayer(player ? true : false);
	}

	onMount(() => {
		changeStation(1); // Initial change.
	});

	onDestroy(() => {
		player?.pause();
	});
</script>

<div class="absolute inset-0 bg-base-dim text-orange-bright">
	<div class="mt-2 border-b-4 border-t-4 border-b-orange-dim border-t-orange-dim px-4 text-xl">
		{#if $edlaState == EDLAState.NOT_CONNECTED}
			Welcome back, waiting for
			<a href="https://github.com/e3ndr/ED-LocalAPI" target="_blank">EDLA</a>.
		{:else if $edlaState == EDLAState.GAME_RUNNING && $edlaCommander}
			Welcome back, CMDR {$edlaCommander.Name.toUpperCase()}.
		{:else}
			Welcome back, waiting for Elite Dangerous.
		{/if}

		<span class="float-right inline-flex items-center">
			{#if $edlaEmergencyOxygen}
				<span class="mr-5 text-red-bright"> DANGER </span>
			{/if}

			{#if $edlaState == EDLAState.GAME_RUNNING && $edlaLocation}
				{#if $edlaLocation.Docked || $edlaLocation.event == 'ApproachSettlement' || $edlaLocation.event == 'Docked' || $edlaLocation.event == 'Undocked' || $edlaLocation.event == 'DockingRequested' || ($edlaLocation.event == 'SupercruiseExit' && $edlaLocation.BodyType == 'Station')}
					<!-- svelte-ignore a11y-missing-attribute -->
					<object
						data="/icons/{$edlaLocation.StationType || 'SurfacePort'}.svg"
						class="mr-1.5 inline-block h-4 w-auto -translate-y-px"
					>
						<img
							src="/icons/SurfacePort.svg"
							alt=""
							class="mr-1.5 inline-block h-4 w-auto -translate-y-px"
						/>
					</object>
					{($edlaLocation.StationName || $edlaLocation.Name || $edlaLocation.Body).toUpperCase()}
				{:else if $edlaLocation.BodyType == 'Star' || $edlaLocation.event == 'LeaveBody' || $edlaLocation.event == 'SupercruiseEntry'}
					<img
						src="/icons/System.svg"
						alt=""
						class="mr-1.5 inline-block h-4 w-auto -translate-y-px"
					/>
					{$edlaLocation.StarSystem.toUpperCase()}
				{:else}
					<img
						src="/icons/Planet.svg"
						alt=""
						class="mr-1.5 inline-block h-4 w-auto -translate-y-px"
					/>
					{$edlaLocation.Body.toUpperCase()}
				{/if}
			{/if}
		</span>
	</div>

	<div class="relative mx-auto mt-20 h-60 w-[50rem] rounded-md bg-[#1b1b1b] p-6">
		<div
			class:bg-red-bright={player}
			class:bg-red-dim={!player}
			class="ring-px absolute left-5 top-5 h-3 w-3 rounded-full ring-red-dim"
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
						updatePlayer(!player);
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
					<p class="h-12 w-[14ch] overflow-hidden text-nowrap text-blue-bright">
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
					<p class="absolute bottom-3 h-7 w-[34ch] overflow-hidden text-xl text-blue-dim">
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

	<!-- State:
	<pre>{$edlaState}</pre>

	{#if $edlaState == EDLAState.GAME_RUNNING}
		Status: <pre>{JSON.stringify($edlaStatus)}</pre>
		<br />
		Location:
		<pre>{JSON.stringify($edlaLocation)}</pre>
		<br />
		Commander:
		<pre>{JSON.stringify($edlaCommander)}</pre>
	{/if} -->
</div>
