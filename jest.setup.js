/* global jest */

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');

  const MockMapView = React.forwardRef((props, ref) =>
    React.createElement(View, { ...props, ref }),
  );
  const MockMapChild = props => React.createElement(View, props);

  MockMapView.Marker = MockMapChild;
  MockMapView.Polygon = MockMapChild;
  MockMapView.Polyline = MockMapChild;
  MockMapView.Circle = MockMapChild;

  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMapChild,
    Polygon: MockMapChild,
    Polyline: MockMapChild,
    Circle: MockMapChild,
    PROVIDER_GOOGLE: 'google',
  };
});

jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn(success =>
    success({
      coords: {
        latitude: 0,
        longitude: 0,
      },
    }),
  ),
  watchPosition: jest.fn(() => 1),
  clearWatch: jest.fn(),
  stopObserving: jest.fn(),
}));

jest.mock('react-native-permissions', () => ({
  check: jest.fn(() => Promise.resolve('granted')),
  request: jest.fn(() => Promise.resolve('granted')),
  openSettings: jest.fn(() => Promise.resolve()),
  PERMISSIONS: {
    ANDROID: {
      ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
    },
    IOS: {
      LOCATION_WHEN_IN_USE: 'ios.permission.LOCATION_WHEN_IN_USE',
    },
  },
  RESULTS: {
    GRANTED: 'granted',
    BLOCKED: 'blocked',
    DENIED: 'denied',
  },
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
    }),
  ),
  addEventListener: jest.fn(() => jest.fn()),
}));

jest.mock('react-native-google-places-autocomplete', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    GooglePlacesAutocomplete: props => React.createElement(View, props),
  };
});

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = require('react-native');

  return props => React.createElement(View, props);
});

jest.mock('@react-native-picker/picker', () => {
  const React = require('react');
  const { View } = require('react-native');

  const Picker = props => React.createElement(View, props);
  Picker.Item = props => React.createElement(View, props);

  return { Picker };
});

jest.mock('@nozbe/watermelondb/adapters/sqlite', () =>
  jest.fn().mockImplementation(config => ({
    schema: config.schema,
  })),
);
