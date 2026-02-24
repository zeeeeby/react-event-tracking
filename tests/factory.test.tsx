import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TrackRoot, useTracker } from "../src"

const TestButton = ({ eventName, params }: { eventName: string; params?: any }) => {
	const { sendEvent } = useTracker()
	return <button onClick={() => sendEvent(eventName, params)}>Click me</button>
}

describe("TrackRoot.factory", () => {
	it("should create a working TrackRoot component", async () => {
		const onEvent = vi.fn()
		const CustomRoot = TrackRoot.factory(onEvent)

		render(
			<CustomRoot>
				<TestButton eventName="test_event" params={{ foo: "bar" }} />
			</CustomRoot>
		)

		await userEvent.click(screen.getByText("Click me"))

		expect(onEvent).toHaveBeenCalledWith("test_event", { foo: "bar" })
	})

	it("should filter events based on function", async () => {
		const onEvent = vi.fn()

		const CustomRoot = TrackRoot.factory(onEvent, (name) => name === "allowed")

		render(
			<CustomRoot>
				<TestButton eventName="allowed" />
				<TestButton eventName="blocked" />
			</CustomRoot>
		)

		const buttons = screen.getAllByText("Click me")

		// 1. Allowed
		await userEvent.click(buttons[0])
		expect(onEvent).toHaveBeenCalledWith("allowed", undefined)
		onEvent.mockClear()

		// 2. Blocked
		await userEvent.click(buttons[1])
		expect(onEvent).not.toHaveBeenCalled()
	})

	it("should support wildcard matching via custom function", async () => {
		const onEvent = vi.fn()
		// Allow ui.*
		const CustomRoot = TrackRoot.factory(onEvent, (name) => name.startsWith("ui."))

		render(
			<CustomRoot>
				<TestButton eventName="ui.click" />
				<TestButton eventName="data.fetch" />
			</CustomRoot>
		)

		const buttons = screen.getAllByText("Click me")

		await userEvent.click(buttons[0])
		expect(onEvent).toHaveBeenCalledWith("ui.click", undefined)
		onEvent.mockClear()

		await userEvent.click(buttons[1])
		expect(onEvent).not.toHaveBeenCalled()
	})

	it("should support regex matching via custom function", async () => {
		const onEvent = vi.fn()
		const CustomRoot = TrackRoot.factory(onEvent, (name) => /^user_\d+$/.test(name))

		render(
			<CustomRoot>
				<TestButton eventName="user_123" />
				<TestButton eventName="user_abc" />
			</CustomRoot>
		)

		const buttons = screen.getAllByText("Click me")

		// Matches regex
		await userEvent.click(buttons[0])
		expect(onEvent).toHaveBeenCalledWith("user_123", undefined)
		onEvent.mockClear()

		// Does not match regex
		await userEvent.click(buttons[1])
		expect(onEvent).not.toHaveBeenCalled()
	})

	it("should chain multiple roots (bubbling)", async () => {
		const onRoot1 = vi.fn()
		const onRoot2 = vi.fn()

		const Root1 = TrackRoot.factory(onRoot1)
		const Root2 = TrackRoot.factory(onRoot2)

		render(
			<Root1>
				<Root2>
					<TestButton eventName="test" params={{ id: 1 }} />
				</Root2>
			</Root1>
		)

		await userEvent.click(screen.getByText("Click me"))

		expect(onRoot2).toHaveBeenCalledWith("test", { id: 1 })
		expect(onRoot1).toHaveBeenCalledWith("test", { id: 1 })
	})

	it("should apply filters independently in chain", async () => {
		const onGlobal = vi.fn()
		const onLocal = vi.fn()

		// Global only wants "global.*" events
		const GlobalRoot = TrackRoot.factory(onGlobal, (name) =>
			name.startsWith("global.")
		)

		// Local wants everything (no filter)
		const LocalRoot = TrackRoot.factory(onLocal)

		render(
			<GlobalRoot>
				<LocalRoot>
					<TestButton eventName="global.init" />
					<TestButton eventName="local.click" />
				</LocalRoot>
			</GlobalRoot>
		)

		const buttons = screen.getAllByText("Click me")

		await userEvent.click(buttons[0])
		expect(onLocal).toHaveBeenCalledWith("global.init", undefined)
		expect(onGlobal).toHaveBeenCalledWith("global.init", undefined)

		onLocal.mockClear()
		onGlobal.mockClear()

		await userEvent.click(buttons[1])
		expect(onLocal).toHaveBeenCalledWith("local.click", undefined)
		expect(onGlobal).not.toHaveBeenCalled()
	})
})
