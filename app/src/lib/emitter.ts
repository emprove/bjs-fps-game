import mitt, { Emitter as MittEmitter, EventType, Handler, WildcardHandler } from "mitt";

declare module "mitt" {
  interface Emitter<Events extends Record<EventType, unknown>> {
    emitAsync<Key extends keyof Events>(type: Key, event: Events[Key]): Promise<void>;
  }
}

export function createEmitterAsync<
  Events extends Record<EventType, unknown>,
>(): MittEmitter<Events> {
  const emitter = mitt<Events>();

  emitter.emitAsync = async <Key extends keyof Events>(
    type: Key,
    event: Events[Key],
  ): Promise<void> => {
    // run all matching handlers
    const handlers = (emitter.all.get(type) ?? []) as Handler<Events[Key]>[];
    for (const h of handlers) {
      await h(event);
    }
    // then run all wildcard handlers
    const wildcards = (emitter.all.get("*") ?? []) as WildcardHandler<Events>[];
    for (const h of wildcards) {
      await h(type, event);
    }
  };

  return emitter;
}

export const emitter = mitt();

interface MyEvents {
  [key: string]: unknown;
  [key: symbol]: unknown;
}

export const emitterAsync = createEmitterAsync<MyEvents>();
