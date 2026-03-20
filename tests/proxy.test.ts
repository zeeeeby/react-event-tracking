import { describe, it, expect, vi } from "vitest";
import { createTracker } from "../src/proxy"
import { FlatTracker } from "../src/types";

export type LoginScreenEvents = {
    forgot_password: { from: "footer" | "button" },
    logged_in: { timePassed: number }
}

export type AnalyticsEvents = {
    login_screen: LoginScreenEvents,
    no_prefix_event: { test: string }
}


describe("createTracker", () => {
    it("should convert property access chain into a dotted string and call track", () => {
        const track = vi.fn();

        const tracker = createTracker<AnalyticsEvents>([], track);

        tracker.login_screen.logged_in({ timePassed: 1 })


        expect(track).toHaveBeenCalledWith(
            "login_screen.logged_in",
            { timePassed: 1 }
        );

        tracker.no_prefix_event({ test: "test" })

        expect(track).toHaveBeenCalledWith(
            "no_prefix_event",
            { test: "test" }
        );
    });

    it("should work with narrowed param", () => {
        const track = vi.fn();
        const tracker = createTracker<AnalyticsEvents>(["login_screen"], track) as unknown as FlatTracker<AnalyticsEvents>["login_screen"];

        tracker.logged_in({ timePassed: 1 })

        expect(track).toHaveBeenCalledWith(
            "login_screen.logged_in",
            { timePassed: 1 }
        );
    })
});

