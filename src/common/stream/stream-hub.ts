import { Response } from 'express';

type Client = {
  id: number;
  res: Response;
  filter?: (message: Record<string, unknown>) => boolean;
  map?: (message: Record<string, unknown>) => Record<string, unknown> | null;
};

export class StreamHub {
  private clients: Client[] = [];
  private nextId = 1;

  register(
    res: Response,
    filter?: (message: Record<string, unknown>) => boolean,
    map?: (message: Record<string, unknown>) => Record<string, unknown> | null,
  ) {
    const client: Client = { id: this.nextId++, res, filter, map };
    this.clients.push(client);
    return client.id;
  }

  unregister(id: number) {
    this.clients = this.clients.filter((c) => c.id !== id);
  }

  broadcast(message: Record<string, unknown>) {
    this.clients.forEach((c) => {
      try {
        if (!c.filter || c.filter(message)) {
          const payload = c.map ? c.map(message) : message;
          if (!payload) return;
          const data = `data: ${JSON.stringify(payload)}\n\n`;
          c.res.write(data);
        }
      } catch {
        this.unregister(c.id);
      }
    });
  }
}

export const streamHub = new StreamHub();
