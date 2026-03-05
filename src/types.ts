export type EventParams = Record<string, any>

export interface TrackContextValue {
	sendEvent(eventName: string, params?: EventParams): void
	sendEvent(event: EventObject): void
}

export type EventObject = { eventName: string; params?: EventParams }

export type EventFilter = (eventName: string, params: EventParams) => boolean

export type TransformedEvent = { eventName: string; params: EventParams }

export type EventTransformer = (
	eventName: string,
	params: EventParams
) => TransformedEvent
