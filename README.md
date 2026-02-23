A convenient React context for tracking analytics events.

## Features

- **Nested Contexts**: Automatically merges parameters from parent providers.
- **Zero Re-renders**: No need to wrap props in `useCallback`/`useMemo`.


## Installation

```
npm install treact-event-tracking
```
```
yarn add react-event-tracking
```

## Quickstart

1. Define the root handler (e.g., send to GTM or API)
```tsx
import { TrackRoot } from 'react-event-tracking';

const Main = () => (
  <TrackRoot onEvent={(name, params) => gtag('event', name, params)}>
    <App/>
  </TrackRoot>
);
``` 
2. Wrap any component with shared parameters
```tsx
import { TrackProvider } from 'react-event-tracking';

const Dashboard = () => (
  <TrackProvider params={{ screen: 'dashboard' }}>
    <DashboardView/>
  </TrackProvider>
);
```

3. Send events conveniently. On button click, parameters will be merged.

```tsx
import { useTracker } from 'react-event-tracking';

const MyButton = () => {
  const { sendEvent } = useTracker();

  return (
    // event sent with parameters: { screen: 'dashboard', button_id: '123' }
    <button onClick={() => sendEvent('click', { button_id: '123' })}>
      Click me
    </button>
  );
};
```

## Example

### Page View

```tsx
export function PageView(props) {
    const { sendEvent } = useTracker();

    useEffect(() => {
        sendEvent('page_view');
    }, []);

    return <>{props.children}</>
}
```