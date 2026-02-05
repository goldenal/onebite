"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamHub = exports.StreamHub = void 0;
class StreamHub {
    constructor() {
        this.clients = [];
        this.nextId = 1;
    }
    register(res) {
        const client = { id: this.nextId++, res };
        this.clients.push(client);
        return client.id;
    }
    unregister(id) {
        this.clients = this.clients.filter((c) => c.id !== id);
    }
    broadcast(message) {
        const data = `data: ${JSON.stringify(message)}\n\n`;
        this.clients.forEach((c) => {
            try {
                c.res.write(data);
            }
            catch {
                this.unregister(c.id);
            }
        });
    }
}
exports.StreamHub = StreamHub;
exports.streamHub = new StreamHub();
