import { describe, it, expect, vi } from "vitest"
import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TrackRoot, useReactEventTracking } from "../src"

const TestButton = ({ eventName, params }: { eventName: string; params?: any }) => {
	const { track } = useReactEventTracking()
	return <button onClick={() => track(eventName, params)}>Click me</button>
}

describe("TrackRoot filter", () => {
	it("should filter events based on event name", async () => {
		const onEvent = vi.fn()

		const filter = (name: string) => name.startsWith("allow")

		render(
			<TrackRoot onEvent={onEvent} filter={filter}>
				<TestButton eventName="allow_me" />
				<TestButton eventName="block_me" />
			</TrackRoot>
		)

		const buttons = screen.getAllByText("Click me")

		// Allowed
		await userEvent.click(buttons[0])
		expect(onEvent).toHaveBeenCalledWith("allow_me", {})
		onEvent.mockClear()

		// Blocked
		await userEvent.click(buttons[1])
		expect(onEvent).not.toHaveBeenCalled()
	})

	it("should filter events based on params", async () => {
		const onEvent = vi.fn()

		const filter = (_: string, params?: any) => params?.valid === true

		render(
			<TrackRoot onEvent={onEvent} filter={filter}>
				<TestButton eventName="test" params={{ valid: true }} />
				<TestButton eventName="test" params={{ valid: false }} />
			</TrackRoot>
		)

		const buttons = screen.getAllByText("Click me")

		await userEvent.click(buttons[0])
		expect(onEvent).toHaveBeenCalledWith("test", { valid: true })
		onEvent.mockClear()

		await userEvent.click(buttons[1])
		expect(onEvent).not.toHaveBeenCalled()
	})

	it("should still bubble event to parent even if filtered locally", async () => {
		const onParentEvent = vi.fn()
		const onChildEvent = vi.fn()

		// Child blocks everything, Parent accepts everything
		render(
			<TrackRoot onEvent={onParentEvent}>
				<TrackRoot onEvent={onChildEvent} filter={() => false}>
					<TestButton eventName="test" />
				</TrackRoot>
			</TrackRoot>
		)

		await userEvent.click(screen.getByText("Click me"))

		expect(onChildEvent).not.toHaveBeenCalled()

		expect(onParentEvent).toHaveBeenCalledWith("test", {})
	})

	it("should handle errors in filter function gracefully and still bubble", async () => {
		const onParentEvent = vi.fn()
		const onChildEvent = vi.fn()
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

		const throwingFilter = () => {
			throw new Error("Filter failed")
		}

		render(
			<TrackRoot onEvent={onParentEvent}>
				<TrackRoot onEvent={onChildEvent} filter={throwingFilter}>
					<TestButton eventName="test" />
				</TrackRoot>
			</TrackRoot>
		)

		await userEvent.click(screen.getByText("Click me"))

		// Local handler skipped due to error
		expect(onChildEvent).not.toHaveBeenCalled()

		// Parent handler still called (bubbling preserved)
		expect(onParentEvent).toHaveBeenCalledWith("test", {})

		// Error logged
		expect(consoleSpy).toHaveBeenCalledWith(
			"TrackRoot filter failed:",
			expect.any(Error)
		)

		consoleSpy.mockRestore()
	})
})
