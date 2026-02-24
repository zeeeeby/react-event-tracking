# react-event-tracking [![NPM Version](https://img.shields.io/npm/v/react-event-tracking)](https://www.npmjs.com/package/react-event-tracking)
A convenient React context for tracking analytics events. 

## Features

- **Nested Contexts**: Automatically merges parameters from parent providers.
- **Zero Re-renders**: No need to wrap props in `useCallback`/`useMemo`.


## Installation

```
npm install react-event-tracking
```
```
yarn add react-event-tracking
```

## Quickstart

1. Define the root handler (e.g., send to GTM, Amplitude or API)
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

## Built-in Hooks   

### useMountEvent   

Sends an event when the component mounts.

```tsx
import { useMountEvent } from 'react-event-tracking';

export function DashboardScreen(props) {
    useMountEvent('page_view', { screen: 'dashboard' });

    return <div>Dashboard</div>;
}
```
## Best Practices

A common pattern is to layer data from global to specific. Here is how parameters merge:

```tsx
// 1. ROOT: Global data (App Version, Environment)
<TrackRoot onEvent={handleEvent} params={{ appVersion: '1.0.0' }}>
  
  {/* 2. PAGE: Screen-level context */}
  <TrackProvider params={{ page: 'ProductDetails', category: 'Shoes' }}>
    
    {/* 3. COMPONENT: Widget-level context */}
    <TrackProvider params={{ productId: 'sku-999' }}>
       <AddToCartButton />
    </TrackProvider>

  </TrackProvider>
</TrackRoot>

// Inside AddToCartButton:
const { sendEvent } = useTracker();

// 4. EVENT: Action-specific data
// When clicked, we only pass what changed right now.
const handleClick = () => {
  sendEvent('add_to_cart', { quantity: 1 });
};
```

**Resulting Event Payload:**
The library merges all layers automatically. The handler receives:


```js
{
  // From Root
  appVersion: '1.0.0',
  // From Page Provider
  page: 'ProductDetails',
  category: 'Shoes',
  // From Component Provider
  productId: 'sku-999',
  // From Event
  quantity: 1
}
```
