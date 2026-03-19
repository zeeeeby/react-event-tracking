export type EventParams<T extends Record<string, any> = Record<string, any>> = T

export interface TrackContextValue {
	track(eventName: string, params?: EventParams): void
	track(event: EventObject): void
}

export type EventObject = { eventName: string; params?: EventParams }

export type EventFilter = (eventName: string, params: EventParams) => boolean

export type TransformedEvent = { eventName: string; params: EventParams }

export type EventTransformer = (
	eventName: string,
	params: EventParams
) => TransformedEvent
