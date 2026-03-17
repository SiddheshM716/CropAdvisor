import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, ScrollView, SafeAreaView, Alert } from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import { useAppContext } from '../context/AppContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Visual Crossing API Key
const WEATHER_API_KEY = 'F3Q769Q28C8FYLDKMQQFH6DVA';

export default function SoilAnalyzerScreen() {
  const { t, saveSoilData } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);

  const getInterpretation = (type, value) => {
    if (value === null || value === undefined) return { label: t('unknown'), color: '#95a5a6' };

    switch (type) {
      case 'pH':
        if (value < 6.0) return { label: t('acidic'), color: '#ef4444' };
        if (value <= 7.5) return { label: t('optimal'), color: '#2d6a4f' };
        return { label: t('alkaline'), color: '#f59e0b' };
      case 'nitrogen':
        if (value < 20) return { label: t('low'), color: '#ef4444' };
        if (value <= 50) return { label: t('optimal'), color: '#2d6a4f' };
        return { label: t('high'), color: '#f59e0b' };
      case 'clay':
        if (value < 20) return { label: t('low'), color: '#3b82f6' };
        if (value <= 40) return { label: t('moderate'), color: '#2d6a4f' };
        return { label: t('high'), color: '#f59e0b' };
      default:
        return { label: t('normal'), color: '#2d6a4f' };
    }
  };

  const renderBadge = (type, value) => {
    const { label, color } = getInterpretation(type, value);
    return (
      <View style={[styles.badge, { backgroundColor: color + '20' }]}>
        <Text style={[styles.badgeText, { color: color }]}>{label}</Text>
      </View>
    );
  };

  const getRecommendations = (ph, nitrogen, clay) => {
    const recs = [];
    if (ph < 6.0) recs.push(t('adviceAcidic'));
    else if (ph > 7.5) recs.push(t('adviceAlkaline'));

    if (nitrogen < 30) recs.push(t('adviceLowP').replace('Phosphorus', 'Nitrogen'));

    if (clay > 45) recs.push(t('adviceHighP'));

    if (recs.length === 0) recs.push(t('optimal'));
    return recs;
  };

  const getCropRecommendations = (ph, clay, temp) => {
    let crops = [];
    // Basic logic combining pH, Clay, and Temp
    if (ph >= 6.0 && ph <= 7.0 && temp > 20) {
      crops.push(t('cropWheat'), t('cropCorn'), t('cropSoybeans'));
    }
    if (clay > 30 && ph > 6.5) {
      crops.push(t('cropCotton'), t('cropSugarBeet'));
    }
    if (ph < 6.5 && temp < 25) {
      crops.push(t('cropPotatoes'), t('cropOats'));
    }
    crops = [...new Set(crops)].slice(0, 5);
    if (crops.length === 0) crops.push(t('cropWheat'));
    return crops;
  };

  const getRegionalFallback = (lat, lon) => {
    // Basic India-centric fallback logic
    // South India (Red Soil)
    if (lat >= 8 && lat < 18) {
      return { pH: 6.5, nitrogen: 35, soc: 40, clay: 25, sand: 45 };
    }
    // Central/Western India (Black Soil)
    if (lat >= 18 && lat < 24 && lon >= 72 && lon <= 80) {
      return { pH: 7.8, nitrogen: 45, soc: 55, clay: 55, sand: 15 };
    }
    // Northern India (Alluvial)
    if (lat >= 24 && lat < 35) {
      return { pH: 7.2, nitrogen: 50, soc: 50, clay: 30, sand: 35 };
    }
    // Default global average
    return { pH: 6.8, nitrogen: 40, soc: 45, clay: 32, sand: 38 };
  };

  const fetchSoilData = async () => {
    setLoading(true);
    setResults(null);
    setError(null);

    try {
      // 1. Get Location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError(t('locationDenied'));
        setLoading(false);
        return;
      }

      let currentPosition = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentPosition.coords;
      setLocation({ latitude, longitude });

      // 2. Fetch Weather Data (always needed)
      let weatherData = null;
      try {
        const weatherUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${latitude},${longitude}?unitGroup=metric&key=${WEATHER_API_KEY}&contentType=json`;
        const weatherResponse = await axios.get(weatherUrl);
        weatherData = weatherResponse.data;
      } catch (e) {
        console.warn('Weather fetch failed, using defaults');
      }

      // 3. Fetch SoilGrids Data
      try {
        const soilUrl = `https://rest.isric.org/soilgrids/v2.0/properties/query?lat=${latitude}&lon=${longitude}&property=phh2o&property=nitrogen&property=soc&property=clay&property=sand&depth=0-5cm&value=mean`;
        const soilResponse = await axios.get(soilUrl);

        const props = soilResponse.data.properties.layers;
        const findVal = (name) => {
          const layer = props.find(l => l.name === name);
          return layer ? layer.depths[0].values.mean / 10 : null;
        };

        const resultsObj = {
          pH: findVal('phh2o'),
          nitrogen: findVal('nitrogen'),
          soc: findVal('soc'),
          clay: findVal('clay'),
          sand: findVal('sand'),
          weather: weatherData?.currentConditions || { temp: 25 },
          forecast: weatherData?.days.slice(0, 7) || [],
          isFallback: false
        };
        setResults(resultsObj);
        saveSoilData(resultsObj);
      } catch (err) {
        console.warn('SoilGrids Error (Silently Using Fallback):', err);
        // Silently use regional fallback without showing error to user
        const fallback = getRegionalFallback(latitude, longitude);
        const resultsObj = {
          ...fallback,
          weather: weatherData?.currentConditions || { temp: 25 },
          forecast: weatherData?.days.slice(0, 7) || [],
          isFallback: true
        };
        setResults(resultsObj);
        saveSoilData(resultsObj);
      }
    } catch (err) {
      console.error(err);
      setError(t('analyzeError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('soilAnalyzerTitle')}</Text>
          <Text style={styles.subtitle}>{t('soilAnalyzerDesc')}</Text>
        </View>

        <View style={styles.locationCard}>
          <MaterialCommunityIcons name="map-marker-radius" size={40} color="#2d6a4f" />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>{t('lat')}: {location?.latitude.toFixed(4) || '--'}</Text>
            <Text style={styles.locationLabel}>{t('lon')}: {location?.longitude.toFixed(4) || '--'}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.mainButton, loading && styles.buttonDisabled]}
          onPress={fetchSoilData}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="target" size={24} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.buttonText}>{t('analyzeLocation')}</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.resultsContainer}>
          {error && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={24} color="#e74c3c" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {results && (
            <View style={styles.cardsContainer}>
              <View style={styles.resultsHeaderRow}>
                <Text style={styles.resultsTitle}>{results.isFallback ? t('regionalFallbackTitle') : t('soilDataGlobal')}</Text>
                {results.isFallback && (
                  <View style={styles.fallbackBadge}>
                    <Text style={styles.fallbackBadgeText}>ESTIMATE</Text>
                  </View>
                )}
              </View>

              <View style={styles.row}>
                <View style={[styles.card, { borderTopColor: '#2d6a4f' }]}>
                  <Text style={styles.cardLabel}>{t('phSoilGrids')}</Text>
                  <Text style={styles.cardValue}>{results.pH?.toFixed(1) || 'N/A'}</Text>
                  {renderBadge('pH', results.pH)}
                </View>

                <View style={[styles.card, { borderTopColor: '#40916c' }]}>
                  <Text style={styles.cardLabel}>{t('nitrogen')}</Text>
                  <Text style={styles.cardValue}>{results.nitrogen?.toFixed(0) || 'N/A'}</Text>
                  <Text style={styles.cardUnit}>cg/kg</Text>
                  {renderBadge('nitrogen', results.nitrogen)}
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.card, { borderTopColor: '#52b788' }]}>
                  <Text style={styles.cardLabel}>{t('clay')}</Text>
                  <Text style={styles.cardValue}>{results.clay?.toFixed(0) || 'N/A'}</Text>
                  <Text style={styles.cardUnit}>g/kg</Text>
                  {renderBadge('clay', results.clay)}
                </View>

                <View style={[styles.card, { borderTopColor: '#74c69d' }]}>
                  <Text style={styles.cardLabel}>{t('soc')}</Text>
                  <Text style={styles.cardValue}>{results.soc?.toFixed(0) || 'N/A'}</Text>
                  <Text style={styles.cardUnit}>dg/kg</Text>
                </View>
              </View>

              <View style={styles.recommendationCard}>
                <View style={styles.recHeader}>
                  <MaterialCommunityIcons name="lightbulb-on" size={24} color="#f39c12" />
                  <Text style={styles.recTitle}>{t('farmingRecommendations')}</Text>
                </View>
                {getRecommendations(results.pH, results.nitrogen, results.clay).map((rec, index) => (
                  <View key={index} style={styles.recItemContainer}>
                    <Text style={styles.recBullet}>•</Text>
                    <Text style={[styles.recText, rec === t('optimal') ? styles.optimalText : null]}>{rec}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.recommendationCard, { borderLeftColor: '#2d6a4f', marginTop: 15 }]}>
                <View style={styles.recHeader}>
                  <MaterialCommunityIcons name="leaf" size={24} color="#2d6a4f" />
                  <Text style={styles.recTitle}>{t('suitableCrops')}</Text>
                </View>
                <View style={styles.cropsContainer}>
                  {getCropRecommendations(results.pH, results.clay, results.weather?.temp).map((crop, index) => (
                    <View key={index} style={styles.cropBadge}>
                      <Text style={styles.cropBadgeText}>{crop}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 20,
    marginBottom: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#7f8c8d',
    lineHeight: 22,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#edf2f7',
  },
  locationInfo: {
    marginLeft: 15,
  },
  locationLabel: {
    fontSize: 14,
    color: '#34495e',
    fontWeight: '600',
  },
  mainButton: {
    backgroundColor: '#1b4332',
    flexDirection: 'row',
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1b4332',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 30,
  },
  buttonDisabled: {
    backgroundColor: '#95a5a6',
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  resultsContainer: {
    width: '100%',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdecea',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#e74c3c',
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 15,
  },
  cardsContainer: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    borderTopWidth: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
  },
  cardUnit: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  recommendationCard: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 24,
    borderLeftWidth: 6,
    borderLeftColor: '#f39c12',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  recTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 10,
  },
  recItemContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  recBullet: {
    fontSize: 18,
    color: '#f39c12',
    marginRight: 10,
  },
  recText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
    lineHeight: 22,
  },
  optimalText: {
    color: '#10b981',
    fontWeight: '700',
  },
  cropsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  cropBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  cropBadgeText: {
    color: '#166534',
    fontWeight: '600',
    fontSize: 14,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  fallbackBadge: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  fallbackBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#c2410c',
  }
});
