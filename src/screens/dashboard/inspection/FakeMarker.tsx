import React from 'react';
import {View} from 'react-native';
import {LatLng} from 'react-native-maps';

type FakeMarkerProps = {
  coordinate: LatLng;
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  mapWidth: number;
  mapHeight: number;
  size?: number;
  color?: string;
};

export const FakeMarker = ({
  coordinate,
  region,
  mapWidth,
  mapHeight,
  size = 20,
  color = 'red',
}: FakeMarkerProps) => {
  // Convertimos coordenadas a posición relativa dentro del MapView
  const x =
    ((coordinate.longitude - (region.longitude - region.longitudeDelta / 2)) /
      region.longitudeDelta) *
    mapWidth;
  const y =
    ((region.latitude + region.latitudeDelta / 2 - coordinate.latitude) /
      region.latitudeDelta) *
    mapHeight;
  console.log('fakemarker');
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: '#fff',
      }}
    />
  );
};
