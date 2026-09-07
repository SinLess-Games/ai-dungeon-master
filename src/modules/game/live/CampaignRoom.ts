import { DurableObject } from "cloudflare:workers";

export interface CampaignRoomBindings {
  BACKGROUND_QUEUE?: Queue<unknown>;
  RUNTIME_CACHE?: KVNamespace;
}

export interface CampaignSocketAttachment {
  campaignId: string;
  userId: string;
  connectedAt: number;
}

export interface CampaignLiveMessage {
  type: string;
  campaignId: string;
  occurredAt: string;
  payload?: Record<string, unknown>;
}

function attachment(socket: WebSocket): CampaignSocketAttachment | null {
  try {
    return socket.deserializeAttachment() as CampaignSocketAttachment;
  } catch {
    return null;
  }
}

/**
 * One Durable Object instance coordinates one active campaign's live clients.
 *
 * D1 remains authoritative persistence. This object owns only ephemeral live
 * coordination: WebSocket presence and broadcasts. Hibernating WebSockets let
 * Cloudflare evict the object while connections are idle without disconnecting
 * players.
 */
export class CampaignRoom extends DurableObject<CampaignRoomBindings> {
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return new Response("Expected a WebSocket upgrade.", { status: 426 });
    }
    if (request.method !== "GET") {
      return new Response("WebSocket connections must use GET.", { status: 405 });
    }

    const campaignId = request.headers.get("x-endless-codex-campaign-id")?.trim();
    const userId = request.headers.get("x-endless-codex-user-id")?.trim();
    if (!campaignId || !userId) {
      return new Response("Missing authenticated campaign connection context.", { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const connectedAt = Date.now();

    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ campaignId, userId, connectedAt } satisfies CampaignSocketAttachment);

    await this.publish({
      type: "presence.joined",
      campaignId,
      occurredAt: new Date(connectedAt).toISOString(),
      payload: {
        userId,
        connections: this.ctx.getWebSockets().length,
      },
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  /** Broadcast a trusted server-side event to every connected campaign client. */
  async publish(message: CampaignLiveMessage): Promise<number> {
    const encoded = JSON.stringify(message);
    let delivered = 0;
    for (const socket of this.ctx.getWebSockets()) {
      try {
        socket.send(encoded);
        delivered += 1;
      } catch {
        // A close event will clean up dead sockets. One broken client must not
        // prevent the rest of the campaign from receiving an event.
      }
    }
    return delivered;
  }

  /** Return aggregate presence without exposing connection internals. */
  async presence(): Promise<{ connections: number; users: number }> {
    const sockets = this.ctx.getWebSockets();
    const users = new Set<string>();
    for (const socket of sockets) {
      const state = attachment(socket);
      if (state) users.add(state.userId);
    }
    return { connections: sockets.length, users: users.size };
  }

  async webSocketMessage(socket: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const state = attachment(socket);
    if (!state) {
      socket.close(1008, "Missing connection state");
      return;
    }

    if (typeof message !== "string") {
      socket.send(JSON.stringify({ type: "error", code: "TEXT_MESSAGES_ONLY" }));
      return;
    }

    let input: unknown;
    try {
      input = JSON.parse(message);
    } catch {
      socket.send(JSON.stringify({ type: "error", code: "INVALID_JSON" }));
      return;
    }

    if (
      typeof input === "object" &&
      input !== null &&
      "type" in input &&
      (input as { type?: unknown }).type === "ping"
    ) {
      socket.send(
        JSON.stringify({
          type: "pong",
          campaignId: state.campaignId,
          occurredAt: new Date().toISOString(),
        }),
      );
      return;
    }

    // Gameplay commands remain authenticated HTTP/RPC operations. The socket
    // is deliberately not a second path that can bypass command validation.
    socket.send(JSON.stringify({ type: "error", code: "SOCKET_COMMANDS_READ_ONLY" }));
  }

  async webSocketClose(
    socket: WebSocket,
    code: number,
    reason: string,
    _wasClean: boolean,
  ): Promise<void> {
    const state = attachment(socket);
    if (state) {
      await this.publish({
        type: "presence.left",
        campaignId: state.campaignId,
        occurredAt: new Date().toISOString(),
        payload: {
          userId: state.userId,
          connections: Math.max(0, this.ctx.getWebSockets().length - 1),
        },
      });
    }
    socket.close(code, reason);
  }
}
