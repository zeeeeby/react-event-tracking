import { StrictMode } from "react"
import { describe, it, expect, vi } from "vitest"
import { render } from "@testing-library/react"
import { TrackRoot } from "../src/context"
import { useMountEvent } from "../src/hooks/useMountEvent"

const TestComponent = ({
	eventName,
	params
}: {
	eventName: string
	params?: Record<string, any>
}) => {
	useMountEvent(eventName, params)
	return <div>Test Component</div>
}

const TestComponentObject = ({
	eventName,
	params
}: {
	eventName: string
	params?: Record<string, any>
}) => {
	useMountEvent({ eventName, params })
	return <div>Test Component</div>
}

describe("useMountEvent", () => {
	it("should send event on mount", () => {
		const onEvent = vi.fn()

		render(
			<TrackRoot onEvent={onEvent}>
				<TestComponent eventName="page_view" />
			</TrackRoot>
		)

		expect(onEvent).toHaveBeenCalledTimes(1)
		expect(onEvent).toHaveBeenCalledWith("page_view", {})
	})

	it("should support overload", () => {
		const onEvent = vi.fn()

		render(
			<TrackRoot onEvent={onEvent}>
				<TestComponentObject eventName="page_view" />
			</TrackRoot>
		)

		expect(onEvent).toHaveBeenCalledTimes(1)
		expect(onEvent).toHaveBeenCalledWith("page_view", {})
	})

	it("should send event with params on mount", () => {
		const onEvent = vi.fn()
		const params = { screen: "dashboard", user_id: "123" }

		render(
			<TrackRoot onEvent={onEvent}>
				<TestComponent eventName="page_view" params={params} />
			</TrackRoot>
		)

		expect(onEvent).toHaveBeenCalledTimes(1)
		expect(onEvent).toHaveBeenCalledWith("page_view", params)
	})

	it("should send event only once even on re-render", () => {
		const onEvent = vi.fn()

		const { rerender } = render(
			<TrackRoot onEvent={onEvent}>
				<TestComponent eventName="page_view" />
			</TrackRoot>
		)

		rerender(
			<TrackRoot onEvent={onEvent}>
				<TestComponent eventName="page_view" />
			</TrackRoot>
		)

		expect(onEvent).toHaveBeenCalledTimes(1)
	})

	it("should send new event when component remounts", () => {
		const onEvent = vi.fn()

		const { unmount } = render(
			<TrackRoot onEvent={onEvent}>
				<TestComponent eventName="page_view" />
			</TrackRoot>
		)

		unmount()

		render(
			<TrackRoot onEvent={onEvent}>
				<TestComponent eventName="page_view" />
			</TrackRoot>
		)

		expect(onEvent).toHaveBeenCalledTimes(2)
	})

	it("should send event only once in StrictMode", () => {
		const onEvent = vi.fn()

		render(
			<StrictMode>
				<TrackRoot onEvent={onEvent}>
					<TestComponent eventName="page_view" params={{ screen: "home" }} />
				</TrackRoot>
			</StrictMode>
		)

		expect(onEvent).toHaveBeenCalledTimes(1)
		expect(onEvent).toHaveBeenCalledWith("page_view", { screen: "home" })
	})
})
