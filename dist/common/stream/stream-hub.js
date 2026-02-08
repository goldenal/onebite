"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamHub = exports.StreamHub = void 0;
class StreamHub {
    constructor() {
        this.clients = [];
        this.nextId = 1;
    }
    register(res, filter, map) {
        const client = { id: this.nextId++, res, filter, map };
        this.clients.push(client);
        return client.id;
    }
    unregister(id) {
        this.clients = this.clients.filter((c) => c.id !== id);
    }
    broadcast(message) {
        this.clients.forEach((c) => {
            try {
                if (!c.filter || c.filter(message)) {
                    const payload = c.map ? c.map(message) : message;
                    if (!payload)
                        return;
                    const data = `data: ${JSON.stringify(payload)}\n\n`;
                    c.res.write(data);
                }
            }
            catch {
                this.unregister(c.id);
            }
        });
    }
}
exports.StreamHub = StreamHub;
exports.streamHub = new StreamHub();
