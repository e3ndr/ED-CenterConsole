import { get, writable } from "svelte/store";

export enum EDLAState {
    NOT_CONNECTED,
    GAME_NOT_RUNNING,
    GAME_RUNNING
}

export class EDLA {
    address = "http://localhost:10986";

    state = writable<EDLAState>(EDLAState.NOT_CONNECTED);

    status = writable<null | any>(null);
    commander = writable<null | any>(null);

    constructor() {
        const checkEdla = async () => {
            if (get(this.state) == EDLAState.NOT_CONNECTED) {
                const random = Math.random().toString(28);
                const returned = await fetch(`${this.address}/edla/challenge/${random}`)
                    .then((response) => response.text());

                const newState = random == returned;

                if (newState) {
                    // We're alive!
                    const gameWebsocket = new WebSocket(`${this.address.replace("http", "ws")}/game`);
                    this.state.set(EDLAState.GAME_NOT_RUNNING);

                    gameWebsocket.onclose = () => {
                        this.state.set(EDLAState.NOT_CONNECTED);
                    }

                    gameWebsocket.onerror = (e) => {
                        console.error(e);
                        this.state.set(EDLAState.NOT_CONNECTED);
                    }

                    gameWebsocket.onmessage = async (e) => {
                        if (typeof e.data != "string") return; // We don't use binary messages.
                        const json = JSON.parse(e.data);

                        if (json.isGameRunning) {
                            new WebSocket(`${this.address.replace("http", "ws")}/file/Status`).onmessage = (e) => {
                                if (typeof e.data != "string") return; // We don't use binary messages.
                                const json = JSON.parse(e.data);
                                this.status.set(json);
                            }

                            const handleJournalEvent = (json: any | null) => {
                                if (json == null) return;
                                switch (json.event) {
                                    case "Commander":
                                        this.commander.set(json);
                                        break;
                                }
                            }

                            new WebSocket(`${this.address.replace("http", "ws")}/file/Journal`).onmessage = (e) => {
                                if (typeof e.data != "string") return; // We don't use binary messages.
                                const json = JSON.parse(e.data);
                                handleJournalEvent(json);
                            }

                            (await fetch(`${this.address}/file/Journal`)
                                .then((response) => response.text())
                            )
                                .split("\n")
                                .filter((line) => line.length > 0) // Last line is probably blank.
                                .map((line) => JSON.parse(line))
                                .forEach(handleJournalEvent);

                            this.state.set(EDLAState.GAME_RUNNING);
                        } else {
                            this.state.set(EDLAState.GAME_NOT_RUNNING);
                            this.status.set(null);
                        }
                    }
                }
            }
        }

        setInterval(checkEdla, 5_000);
        checkEdla();
    }
}

export const EDLA_INSTANCE: EDLA = typeof window == "undefined" ? {
    address: "<unknown>",
    state: writable(EDLAState.NOT_CONNECTED),
    status: writable(null),
    commander: writable(null),
} : new EDLA();
