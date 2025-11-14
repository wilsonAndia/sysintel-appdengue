import React, {useEffect, useRef, useState} from 'react';
import {Animated, Pressable, StyleSheet, View} from 'react-native';

interface ToggleButtonProps {
  isToggled: boolean;
  onChangeToggle: (value: boolean) => void;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({
  isToggled,
  onChangeToggle,
}) => {
  const [active, setActive] = useState(isToggled);
  const animatedValue = useRef(new Animated.Value(isToggled ? 1 : 0)).current;

  useEffect(() => {
    onChangeToggle(active);
  }, [active]);

  const toggle = () => {
    const toValue = active ? 0 : 1;
    Animated.timing(animatedValue, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
    setActive(!active);
  };

  const interpolatedTranslateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 32], // Ajustado para que llegue al borde derecho
  });

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#d1d5db', '#bfdbfe'], // fondo gris claro -> azul claro
  });

  const circleColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#9ca3af', '#3b82f6'], // gris medio -> azul fuerte
  });

  return (
    <Pressable onPress={toggle}>
      <Animated.View style={[styles.container, {backgroundColor}]}>
        <Animated.View
          style={[
            styles.circle,
            {
              transform: [{translateX: interpolatedTranslateX}],
              backgroundColor: circleColor,
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 64,
    height: 32,
    borderRadius: 999,
    padding: 2,
    justifyContent: 'center',
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 999,
    position: 'absolute',
  },
});

export default ToggleButton;
