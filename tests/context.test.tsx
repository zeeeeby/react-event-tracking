import { describe, it, expect, vi } from "vitest"
import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TrackRoot, TrackProvider, useTracker } from "../src"

const TestButton = ({
	eventName,
	params,
	label = "Click me"
}: {
	eventName: string
	params?: Record<string, any>
	label?: string
}) => {
	const { sendEvent } = useTracker()
	return <button onClick={() => sendEvent(eventName, params)}>{label}</button>
}

describe("Track Context", () => {
	it("should send event from root", async () => {
		const onEvent = vi.fn()

		render(
			<TrackRoot onEvent={onEvent}>
				<TestButton
					eventName="test_click"
					params={{ foo: "bar" }}
					label="Root Click"
				/>
			</TrackRoot>
		)

		await userEvent.click(screen.getByText("Root Click"))

		expect(onEvent).toHaveBeenCalledTimes(1)
		expect(onEvent).toHaveBeenCalledWith("test_click", { foo: "bar" })
	})

	it("should merge params from nested providers", async () => {
		const onEvent = vi.fn()

		render(
			<TrackRoot onEvent={onEvent}>
				<TrackProvider params={{ section: "header" }}>
					<TrackProvider params={{ item: "logo" }}>
						<TestButton
							eventName="logo_click"
							params={{ action: "click" }}
							label="Nested Click"
						/>
					</TrackProvider>
				</TrackProvider>
			</TrackRoot>
		)

		await userEvent.click(screen.getByText("Nested Click"))

		expect(onEvent).toHaveBeenCalledWith("logo_click", {
			section: "header",
			item: "logo",
			action: "click"
		})
	})

	it("should override params from child to parent", async () => {
		const onEvent = vi.fn()

		render(
			<TrackRoot onEvent={onEvent}>
				<TrackProvider params={{ page: "home", id: 1 }}>
					{/* Переопределяем id */}
					<TrackProvider params={{ id: 2 }}>
						<TestButton
							eventName="click"
							params={{ id: 3 }}
							label="Override Click"
						/>
					</TrackProvider>
				</TrackProvider>
			</TrackRoot>
		)

		await userEvent.click(screen.getByText("Override Click"))

		expect(onEvent).toHaveBeenCalledWith("click", {
			page: "home",
			id: 3
		})
	})

	it("should use latest params without re-rendering children", async () => {
		const onEvent = vi.fn()

		const Wrapper = ({ count }: { count: number }) => (
			<TrackProvider params={{ count }}>
				<TestButton eventName="count_click" label="Rerender Click" />
			</TrackProvider>
		)

		const { rerender } = render(
			<TrackRoot onEvent={onEvent}>
				<Wrapper count={1} />
			</TrackRoot>
		)

		await userEvent.click(screen.getByText("Rerender Click"))
		expect(onEvent).toHaveBeenLastCalledWith("count_click", { count: 1 })

		rerender(
			<TrackRoot onEvent={onEvent}>
				<Wrapper count={2} />
			</TrackRoot>
		)

		await userEvent.click(screen.getByText("Rerender Click"))
		expect(onEvent).toHaveBeenLastCalledWith("count_click", { count: 2 })
	})

	it("should NOT trigger re-render in consumers when params update (optimization check)", () => {
		const renderFn = vi.fn()

		const MemoChild = React.memo(() => {
			useTracker()
			renderFn()
			return <div>Memo Child</div>
		})

		// eslint-disable-next-line react/display-name
		MemoChild.displayName = "MemoChild"

		const { rerender } = render(
			<TrackRoot onEvent={() => {}}>
				<TrackProvider params={{ val: 1 }}>
					<MemoChild />
				</TrackProvider>
			</TrackRoot>
		)

		expect(renderFn).toHaveBeenCalledTimes(1)

		rerender(
			<TrackRoot onEvent={() => {}}>
				<TrackProvider params={{ val: 2 }}>
					<MemoChild />
				</TrackProvider>
			</TrackRoot>
		)

		expect(renderFn).toHaveBeenCalledTimes(1)
	})

	it("should throw error if used outside of TrackRoot", () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

		expect(() => {
			render(<TestButton eventName="fail" label="Fail Click" />)
		}).toThrow("useTracker must be used within TrackRoot")

		consoleSpy.mockRestore()
	})

	it("should send event from multiple roots", async () => {
		const onEvent = vi.fn()
		const onEvent2 = vi.fn()

		render(
			<TrackRoot onEvent={onEvent}>
				<TrackProvider
					params={{
						ui: "ui"
					}}
				>
					<TrackRoot onEvent={onEvent2}>
						<TestButton
							eventName="test_click"
							params={{ foo: "bar" }}
							label="Root Click"
						/>
					</TrackRoot>
				</TrackProvider>
			</TrackRoot>
		)

		await userEvent.click(screen.getByText("Root Click"))

		expect(onEvent).toHaveBeenCalledTimes(1)
		expect(onEvent).toHaveBeenCalledWith("test_click", { foo: "bar", ui: "ui" })
		expect(onEvent2).toHaveBeenCalledTimes(1)
		expect(onEvent2).toHaveBeenCalledWith("test_click", { foo: "bar" })
	})

	it("should handle error in onEvent gracefully and bubble up", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
		const onChildEvent = vi.fn().mockImplementation(() => {
			throw new Error("Handler failed")
		})
		const onParentEvent = vi.fn()

		render(
			<TrackRoot onEvent={onParentEvent}>
				<TrackRoot onEvent={onChildEvent}>
					<TestButton eventName="click" />
				</TrackRoot>
			</TrackRoot>
		)

		await userEvent.click(screen.getByText("Click me"))

		expect(onChildEvent).toHaveBeenCalled()
		expect(onParentEvent).toHaveBeenCalledWith("click", {})
		expect(consoleSpy).toHaveBeenCalledWith(
			"TrackRoot onEvent failed:",
			expect.any(Error)
		)

		consoleSpy.mockRestore()
	})
})
