import React, {useState} from 'react';
import {Text, ScrollView, TouchableOpacity} from 'react-native';
import geolocation from '@react-native-community/geolocation';

const FindLetterBox = () => {
  const [location, setLocation] = useState('hello');

  const findCoordinates = async (e) => {};

  return (
    <ScrollView>
      <TouchableOpacity onPress={(e) => findCoordinates(e)}>
        <Text>Location</Text>
      </TouchableOpacity>

      <Text>{location} </Text>
    </ScrollView>
  );
};

export default FindLetterBox;
