import { get, writable, type Writable } from "svelte/store";

export declare type RadioStationSong = {
    name: string,
    author: string,
    imageUrl: string,
    lengthMs: number,
    startedAtMs: number,
    getCurrentProgress(): number
}

export declare type RadioStation = {
    name: string,
    streamUrl: string,
    songInfo: Writable<RadioStationSong | null>,
    volumeScale: number,
    fetchCurrentSongInfo(): Promise<RadioStationSong | null>,
}

export const STATIONS: RadioStation[] = [
    {
        name: "Radio Skvortsov",
        streamUrl: "https://cast1.torontocast.com:3225/stream",
        songInfo: writable(null),
        volumeScale: 1,
        async fetchCurrentSongInfo() {
            const json = await (await fetch("https://cast1.torontocast.com:3210/api/v2/history/?limit=1&offset=0&server=1")).json()
            return {
                name: json.results[0].title,
                author: json.results[0].author,
                imageUrl: json.results[0].img_large_url || "https://cast1.torontocast.com:3210/media/widgets/skvortsovdisc_orb_s.png",
                lengthMs: json.results[0].length,
                startedAtMs: json.results[0].ts,
                getCurrentProgress() {
                    return (Date.now() - json.results[0].ts) / json.results[0].length;
                },
            };
        }
    },
    {
        name: "Hutton Orbital Radio",
        streamUrl: "https://quincy.torontocast.com/hutton",
        songInfo: writable(null),
        volumeScale: 1,
        async fetchCurrentSongInfo() {
            const json = await (await fetch("https://quincy.torontocast.com:2760/api/v2/history/?limit=1&offset=0&server=1")).json()
            return {
                name: json.results[0].title,
                author: json.results[0].author,
                imageUrl: json.results[0].img_large_url,
                lengthMs: json.results[0].length,
                startedAtMs: json.results[0].ts,
                getCurrentProgress() {
                    return (Date.now() - json.results[0].ts) / json.results[0].length;
                },
            };
        }
    },
    // {
    //     name: "Lave Radio",
    //     streamUrl: "https://kathy.torontocast.com:1545/stream",
    //     songInfo: writable(null),
    //     volumeScale: 1,
    //     async fetchCurrentSongInfo() {
    //         const json = await (await fetch("https://kathy.torontocast.com:1350/api/v2/history/?limit=1&offset=0&server=1")).json()
    //         return {
    //             name: json.results[0].title,
    //             author: json.results[0].author,
    //             imageUrl: json.results[0].img_large_url,
    //             lengthMs: json.results[0].length,
    //             startedAtMs: json.results[0].ts,
    //             getCurrentProgress() {
    //                 return (Date.now() - json.results[0].ts) / json.results[0].length;
    //             },
    //         };
    //     }
    // },
    {
        name: "Radio Sidewinder",
        streamUrl: "https://radiosidewinder.out.airtime.pro:8000/radiosidewinder_a",
        songInfo: writable(null),
        volumeScale: .75,
        async fetchCurrentSongInfo() {
            const json = await (await fetch("https://radiosidewinder.airtime.pro/api/live-info")).json()
            const startedAt = new Date(json.current.starts).getTime();
            const endsAt = new Date(json.current.ends).getTime();
            return {
                name: json.current.metadata.track_title,
                author: json.current.metadata.artist_name,
                imageUrl: json.current.album_artwork_image || "https://radiosidewinder.airtime.pro/images/cover-art.png",
                lengthMs: endsAt - startedAt,
                startedAtMs: startedAt,
                getCurrentProgress() {
                    return Date.now() / endsAt;
                },
            };
        }
    },
    {
        name: "NASA's Third Rock Radio",
        streamUrl: "https://rfcm.streamguys1.com/thirdrock-mp3",
        songInfo: writable(null),
        volumeScale: .45,
        async fetchCurrentSongInfo() {
            const json = await (await fetch("https://jetapi.streamguys.com/67aba0b806d22e74d235bd2564f5b0cc5aab5824/scraper/c37faecf-887a-4672-8094-bd795223997a/metadata")).json()
            // This doesn't actually give us author or the audio length. So we just set our interval to 15s and hope for the best.
            return {
                name: json.StreamTitle,
                author: null,
                imageUrl: "https://player.streamguys.com/thirdrock/sgplayer/include/image/ThirdRockRadio500x500.jpg",
                lengthMs: 15_000,
                startedAtMs: json.timestamp,
                getCurrentProgress() {
                    return 0;
                },
            };
        }
    },
];

async function fetchLoop(station: RadioStation) {
    const current = await station.fetchCurrentSongInfo();
    station.songInfo.set(current);
    console.debug("Fetched new song info for", station.name, current);

    if (current) {
        if (current.lengthMs == Number.MAX_SAFE_INTEGER) {
            return; // We never actually receive an update.
        }

        const timeUntilChange = current.lengthMs - (Date.now() - current.startedAtMs);
        setTimeout(() => fetchLoop(station), Math.max(timeUntilChange, 15_000));
    } else {
        setTimeout(() => fetchLoop(station), 15_000);
    }
}

const alreadyFetching: string[] = [];
if (typeof window != "undefined") {
    // We don't want to start fetching song info on the server-side.
    for (const station of STATIONS) {
        if (!alreadyFetching.includes(station.name)) {
            alreadyFetching.push(station.name);
            fetchLoop(station);
        }
    }
}