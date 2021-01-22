import React, {useState, useEffect} from 'react';
import RNLocation from 'react-native-location';
import styled from 'styled-components';
import {arrayOfLocations} from '../assets/data/locationsReadBox';

import {View, Text, TouchableOpacity, TextInput, Linking} from 'react-native';

const FindLetterBox = () => {
  let [locationSearched, setLocationSearched] = useState();
  let [inProgess, setInProgress] = useState();
  let [error, setError] = useState();
  let [value, onChangeText] = useState('');
  let [closestLocation, setClosestLocation] = useState();
  let location;
  // Clé de l'API Google à compléter
  let apiKey = '';

  // Accèder à la localisation de l'utilisateur après vérification des permissions
  const permissionHandle = async () => {
    // Vérification des permissions données par l'utilisateur pour accèder à sa localisation
    let permission = await RNLocation.checkPermission({
      ios: 'whenInUse',
      android: {
        detail: 'coarse',
      },
    });

    // demande d'accès à la localisation si besoin
    if (!permission) {
      permission = await RNLocation.requestPermission({
        ios: 'whenInUse',
        android: {
          detail: 'coarse',
          rationale: {
            title: "Nous avons besoin d'accéder à votre localisation",
            buttonPositive: 'OK',
            buttonNegative: 'Cancel',
          },
        },
      });
      try {
        location = await RNLocation.getLatestLocation({timeout: 100});
        setLocationSearched(location);
      } catch (error) {
        setError(true);
      }
    } else {
      // Si la permission est donnée, ou déjà existante on récupère la location
      try {
        location = await RNLocation.getLatestLocation({timeout: 100});
        setLocationSearched({
          lat: location.latitude,
          lng: location.longitude,
        });
      } catch (error) {
        setError(true);
      }
    }
  };

  // Fonction permettant de transformer l'addresse rentrée en input et stockée dans le state en coordonnées GPS
  const transformAddressToLatLong = async (addressToTransform) => {
    setInProgress(true);
    setError(null);

    try {
      let result = await fetch(
        'https://maps.googleapis.com/maps/api/geocode/json?address=' +
          addressToTransform +
          `&key=${apiKey}`,
      );
      let resultFinal = await result.json();
      let address = resultFinal?.results[0].geometry;
      // Enregistrement du resultat en state
      setLocationSearched({
        lat: address?.location.lat,
        lng: address?.location.lng,
      });
      // Gestion des erreurs
    } catch (e) {
      setError(true);
    }
  };

  // Fonction permettant de calculer la distance entre deux endroits
  function distance(locationSearched, locationDataBase, unit) {
    let lat1 = locationSearched.lat;
    let lon1 = locationSearched.lng;
    let lat2 = locationDataBase.lat;
    let lon2 = locationDataBase.lng;

    if (lat1 == lat2 && lon1 == lon2) {
      return {dist: 0, lat: lat2, lng: lon2};
    } else {
      var radlat1 = (Math.PI * lat1) / 180;
      var radlat2 = (Math.PI * lat2) / 180;
      var theta = lon1 - lon2;
      var radtheta = (Math.PI * theta) / 180;
      var dist =
        Math.sin(radlat1) * Math.sin(radlat2) +
        Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
      if (dist > 1) {
        dist = 1;
      }
      dist = Math.acos(dist);
      dist = (dist * 180) / Math.PI;
      dist = dist * 60 * 1.1515;
      if (unit == 'K') {
        dist = dist * 1.609344;
      }
      return {dist: dist, lat: lat2, lng: lon2};
    }
  }

  // Fonction permettant de trouver l'endroit le plus proche dans un tableau de données
  const findClosestLocation = (arrayOfLocations, locationSearched) => {
    let result = {};
    let closestAddress = {};
    arrayOfLocations.map((oneLocation) => {
      // Je mets au bon format la localisation avant de déclencher la fonction pour obtenir le résultat
      let formatedLocation = {
        lat: oneLocation.Coord_GPS.split(',')[0],
        lng: oneLocation.Coord_GPS.split(',')[1],
      };
      // Je déclenche la fonction qui permet de calculer la distance
      let distanceBetweenLocation =
        locationSearched && distance(locationSearched, formatedLocation, 'K');
      // je stocke la distance résultantes ainsi que l'endroit lié à cette distance
      if (!result.dist) {
        result = distanceBetweenLocation;
        closestAddress = oneLocation;
      } else if (result.dist > distanceBetweenLocation.dist) {
        result = distanceBetweenLocation;
        closestAddress = oneLocation;
      }
    });

    return closestAddress;
  };

  // UseEffect qui déclenche la recherche de la boite à livre la plus proche dés que l'endroit cherché change
  useEffect(() => {
    if (locationSearched) {
      setInProgress(true);
      let result = findClosestLocation(arrayOfLocations, locationSearched);
      setClosestLocation(result);
      setInProgress(false);
    }
  }, [locationSearched]);

  return (
    <StyledMainView>
      <StyledView>
        <View>
          <StyledTextInput
            onChangeText={(text) => {
              onChangeText(text);
            }}
            value={value}
            placeholder="Rentrez votre addresse"
          />
          <StyledTouchableOpacity
            onPress={() => transformAddressToLatLong(value)}>
            <StyledTextTouchableOpacity>Valider</StyledTextTouchableOpacity>
          </StyledTouchableOpacity>
        </View>
        <StyledText>OU</StyledText>
        <StyledTouchableOpacity onPress={permissionHandle}>
          <StyledTextTouchableOpacity>
            Utiliser ma géolocalisation
          </StyledTextTouchableOpacity>
        </StyledTouchableOpacity>
      </StyledView>
      {/** Si la location est trouvée, et qu'aucune recherche n'est en cours, et qu'il n'y a pas d'erreur, on affiche le résultat  */}
      {closestLocation && !inProgess && !error && (
        <>
          <AddressView>
            <StyledText>
              La boite à livre la plus proche de l'addresse indiquée est :
            </StyledText>
            <StyledText>
              {closestLocation.Adresse +
                ' ' +
                closestLocation.Code_Postal +
                ' ' +
                closestLocation.Ville +
                ' ' +
                closestLocation.Pays}
            </StyledText>
          </AddressView>
          {/** Lien vers Gmaps */}
          <StyledTouchableOpacity
            onPress={() =>
              Linking.openURL(
                `google.navigation:q=${closestLocation.Coord_GPS}`,
              )
            }>
            <StyledTextTouchableOpacity>
              Ouvrir dans Google
            </StyledTextTouchableOpacity>
          </StyledTouchableOpacity>
        </>
      )}
      {/** Gestion des différents états liés à la requête Google  */}
      {inProgess && !error && <Text>En cours ... </Text>}
      {error && (
        <Text>Un problème est survenu, veuillez nous en excuser ... </Text>
      )}
    </StyledMainView>
  );
};

export default FindLetterBox;

const StyledMainView = styled(View)`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;
const StyledView = styled(View)`
  margin: 40px auto;
  padding: 10px;
  width: 90%;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const AddressView = styled(View)`
  margin: 20px auto;
  padding: 10px;
  width: 90%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledTextInput = styled(TextInput)`
  border: 1px solid grey;
  padding-left: 10px;
  width: 300px;
  margin-bottom: 10px;
`;

const StyledText = styled(Text)`
  margin: 10px auto;
  width: 80%;
  color: black;
  font-size: 20px;
  text-align: center;
`;
const StyledTextTouchableOpacity = styled(Text)`
  color: white;
  font-size: 16px;
  text-align: center;
`;

const StyledTouchableOpacity = styled(TouchableOpacity)`
  width: 250px;
  color: white;
  background-color: #30364a;
  font-size: 20px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  justify-content: center;
  margin: 20px auto;
`;
