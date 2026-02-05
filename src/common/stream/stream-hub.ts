import { Response } from 'express';

type Client = { id: number; res: Response };

export class StreamHub {
  private clients: Client[] = [];
  private nextId = 1;

  register(res: Response) {
    const client: Client = { id: this.nextId++, res };
    this.clients.push(client);
    return client.id;
  }

  unregister(id: number) {
    this.clients = this.clients.filter((c) => c.id !== id);
  }

  broadcast(message: Record<string, unknown>) {
    const data = `data: ${JSON.stringify(message)}\n\n`;
    this.clients.forEach((c) => {
      try {
        c.res.write(data);
      } catch {
        this.unregister(c.id);
      }
    });
  }
}

export const streamHub = new StreamHub();
