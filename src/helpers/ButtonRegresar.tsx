import React from 'react';
import {TouchableOpacity, Text, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Svg, {Path} from 'react-native-svg';

interface Props {
  arrowColor?: string;
  textColor?: string;
}

export const ButtonRegresar = ({
  arrowColor = 'white',
  textColor = 'white',
}: Props) => {
  const navigation = useNavigation();

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <TouchableOpacity style={[styles.button]} onPress={handleGoBack}>
      <View style={styles.iconContainer}>
        <Svg width="20" height="20" viewBox="0 0 15 15" fill={arrowColor}>
          <Path
            d="M6.85355 3.14645C7.04882 3.34171 7.04882 3.65829 6.85355 3.85355L3.70711 7H12.5C12.7761 7 13 7.22386 13 7.5C13 7.77614 12.7761 8 12.5 8H3.70711L6.85355 11.1464C7.04882 11.3417 7.04882 11.6583 6.85355 11.8536C6.65829 12.0488 6.34171 12.0488 6.14645 11.8536L2.14645 7.85355C1.95118 7.65829 1.95118 7.34171 2.14645 7.14645L6.14645 3.14645C6.34171 2.95118 6.65829 2.95118 6.85355 3.14645Z"
            fill={arrowColor}
            fillRule="evenodd"
            clipRule="evenodd"></Path>
        </Svg>
      </View>
      <Text style={[styles.text, {color: textColor}]}>Voltar</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#144c78',
    borderRadius: 16,
    marginLeft: 12,
    marginTop: 0,
    alignSelf: 'flex-start',
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
