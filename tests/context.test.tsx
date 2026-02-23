import { describe, it, expect, vi } from "vitest"
import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AnalyticsRoot, AnalyticsProvider, useAnalytics } from "../src/context"

const TestButton = ({
	eventName,
	params,
	label = "Click me"
}: {
	eventName: string
	params?: Record<string, any>
	label?: string
}) => {
	const { sendEvent } = useAnalytics()
	return <button onClick={() => sendEvent(eventName, params)}>{label}</button>
}

describe("Analytics Context", () => {
	it("should send event from root", async () => {
		const onEvent = vi.fn()

		render(
			<AnalyticsRoot onEvent={onEvent}>
				<TestButton
					eventName="test_click"
					params={{ foo: "bar" }}
					label="Root Click"
				/>
			</AnalyticsRoot>
		)

		await userEvent.click(screen.getByText("Root Click"))

		expect(onEvent).toHaveBeenCalledTimes(1)
		expect(onEvent).toHaveBeenCalledWith("test_click", { foo: "bar" })
	})

	it("should merge params from nested providers", async () => {
		const onEvent = vi.fn()

		render(
			<AnalyticsRoot onEvent={onEvent}>
				<AnalyticsProvider params={{ section: "header" }}>
					<AnalyticsProvider params={{ item: "logo" }}>
						<TestButton
							eventName="logo_click"
							params={{ action: "click" }}
							label="Nested Click"
						/>
					</AnalyticsProvider>
				</AnalyticsProvider>
			</AnalyticsRoot>
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
			<AnalyticsRoot onEvent={onEvent}>
				<AnalyticsProvider params={{ page: "home", id: 1 }}>
					{/* Переопределяем id */}
					<AnalyticsProvider params={{ id: 2 }}>
						<TestButton
							eventName="click"
							params={{ id: 3 }}
							label="Override Click"
						/>
					</AnalyticsProvider>
				</AnalyticsProvider>
			</AnalyticsRoot>
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
			<AnalyticsProvider params={{ count }}>
				<TestButton eventName="count_click" label="Rerender Click" />
			</AnalyticsProvider>
		)

		const { rerender } = render(
			<AnalyticsRoot onEvent={onEvent}>
				<Wrapper count={1} />
			</AnalyticsRoot>
		)

		await userEvent.click(screen.getByText("Rerender Click"))
		expect(onEvent).toHaveBeenLastCalledWith("count_click", { count: 1 })

		rerender(
			<AnalyticsRoot onEvent={onEvent}>
				<Wrapper count={2} />
			</AnalyticsRoot>
		)

		await userEvent.click(screen.getByText("Rerender Click"))
		expect(onEvent).toHaveBeenLastCalledWith("count_click", { count: 2 })
	})

	it("should NOT trigger re-render in consumers when params update (optimization check)", () => {
		const renderFn = vi.fn()

		const MemoChild = React.memo(() => {
			useAnalytics()
			renderFn()
			return <div>Memo Child</div>
		})

		// eslint-disable-next-line react/display-name
		MemoChild.displayName = "MemoChild"

		const { rerender } = render(
			<AnalyticsRoot onEvent={() => {}}>
				<AnalyticsProvider params={{ val: 1 }}>
					<MemoChild />
				</AnalyticsProvider>
			</AnalyticsRoot>
		)

		expect(renderFn).toHaveBeenCalledTimes(1)

		rerender(
			<AnalyticsRoot onEvent={() => {}}>
				<AnalyticsProvider params={{ val: 2 }}>
					<MemoChild />
				</AnalyticsProvider>
			</AnalyticsRoot>
		)

		expect(renderFn).toHaveBeenCalledTimes(1)
	})

	it("should throw error if used outside of AnalyticsRoot", () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

		expect(() => {
			render(<TestButton eventName="fail" label="Fail Click" />)
		}).toThrow("useAnalytics must be used within AnalyticsRoot")

		consoleSpy.mockRestore()
	})
})
