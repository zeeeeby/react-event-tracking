export type EventParams<T extends Record<string, any> = Record<string, any>> = T

export type EventsMap = Record<string, any>

export type AnyFunction = (...args: any[]) => any

type IsLeaf<T> = T extends Record<string, any>
	? (keyof T extends never ? true : T[keyof T] extends Record<string, any> ? false : true)
	: true;

export type FlatTracker<T> = {
	[K in keyof T]: IsLeaf<T[K]> extends true
	? (params: T[K]) => void
	: FlatTracker<T[K]>;
};


export type EventObject<E extends string = string, P = EventParams> = { eventName: E; params?: P }


export type EventFilter = (eventName: string, params: EventParams) => boolean

export type TransformedEvent = { eventName: string; params: EventParams }

export type EventTransformer = (
	eventName: string,
	params: EventParams
) => TransformedEvent
