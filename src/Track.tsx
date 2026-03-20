import { useMountEvent } from "./hooks";
import { EventObject } from "./types";

export const Track = {
    OnMount: (props: EventObject & {children?: React.ReactNode}) => {
        useMountEvent(props);
        return props.children ?? null;
    }
};
