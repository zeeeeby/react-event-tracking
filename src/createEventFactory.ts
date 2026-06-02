import { createFactoryProxy } from "./proxy";
import { EventFactory, EventsMap } from "./types";

export function createEventFactory<Map extends EventsMap>(): EventFactory<Map> {
    return createFactoryProxy()
}
