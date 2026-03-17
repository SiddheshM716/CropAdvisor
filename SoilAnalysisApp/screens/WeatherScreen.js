import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, ScrollView, TouchableOpacity,
    TextInput, ActivityIndicator, SafeAreaView, Platform, Keyboard,
} from 'react-native';
import axios from 'axios';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';

const API_KEY = 'F3Q769Q28C8FYLDKMQQFH6DVA';
const BASE_URL = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline';

// ── Weather icon mapping ─────────────────────────────────────────────────────
function getWeatherIcon(conditions = '', icon = '') {
    const c = (conditions + icon).toLowerCase();
    if (c.includes('thunder') || c.includes('storm')) return { name: 'weather-lightning-rainy', color: '#a29bfe' };
    if (c.includes('snow')) return { name: 'weather-snowy', color: '#74b9ff' };
    if (c.includes('rain') || c.includes('shower')) return { name: 'weather-rainy', color: '#0984e3' };
    if (c.includes('fog') || c.includes('mist')) return { name: 'weather-fog', color: '#95a5a6' };
    if (c.includes('cloud') || c.includes('overcast')) return { name: 'weather-cloudy', color: '#b2bec3' };
    if (c.includes('partly')) return { name: 'weather-partly-cloudy', color: '#fab1a0' };
    if (c.includes('clear') || c.includes('sun')) return { name: 'weather-sunny', color: '#fdcb6e' };
    return { name: 'weather-partly-cloudy', color: '#fab1a0' };
}

function toTitleCase(str) {
    if (!str) return '';
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

export default function WeatherScreen() {
    const { t, language, lastSoilData } = useAppContext();
    const [location, setLocation] = useState('');
    const [inputText, setInputText] = useState('');
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(false);
    const [locating, setLocating] = useState(false);
    const [error, setError] = useState(null);

    // AI State
    const [aiAdvisory, setAiAdvisory] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);

    // ── Farming advisory generator (Rule-based) ──────────────────────────────────
    function getFarmingAdvisory(current, days = []) {
        const advisories = [];
        const { temp, humidity, precipprob, windspeed, uvindex, conditions = '' } = current;
        const todayPrecip = days[0]?.precipprob ?? precipprob;
        const weekRain = days.slice(0, 5).some(d => (d.precipprob ?? 0) > 60);
        const c = conditions.toLowerCase();

        if (todayPrecip > 70) advisories.push({ icon: 'water', color: '#3498db', title: t('rainExpected'), body: t('rainExpectedBody') });
        else if (todayPrecip < 20 && humidity < 40) advisories.push({ icon: 'water-off', color: '#e67e22', title: t('irrigationNeeded'), body: t('irrigationNeededBody') });
        else if (weekRain) advisories.push({ icon: 'weather-rainy', color: '#3498db', title: t('rainComing'), body: t('rainComingBody') });

        if (temp > 38) advisories.push({ icon: 'thermometer-high', color: '#e74c3c', title: t('extremeHeat'), body: t('extremeHeatBody') });
        else if (temp < 10) advisories.push({ icon: 'snowflake-alert', color: '#74b9ff', title: t('coldRisk'), body: t('coldRiskBody') });
        else if (temp > 32) advisories.push({ icon: 'thermometer-alert', color: '#e67e22', title: t('highTemp'), body: t('highTempBody') });

        if (humidity > 80) advisories.push({ icon: 'virus', color: '#8e44ad', title: t('fungalRisk'), body: t('fungalRiskBody') });
        else if (humidity > 65) advisories.push({ icon: 'eye-check', color: '#9b59b6', title: t('monitorFungal'), body: t('monitorFungalBody') });

        if (windspeed > 30) advisories.push({ icon: 'weather-windy', color: '#7f8c8d', title: t('highWind'), body: t('highWindBody') });
        else if (windspeed < 10 && precipprob < 30) advisories.push({ icon: 'spray', color: '#27ae60', title: t('goodSpraying'), body: t('goodSprayingBody') });

        if (uvindex >= 8) advisories.push({ icon: 'white-balance-sunny', color: '#f39c12', title: t('highUV'), body: t('highUVBody') });
        else if (uvindex >= 5) advisories.push({ icon: 'weather-sunny', color: '#f1c40f', title: t('goodSolar'), body: t('goodSolarBody') });

        if (c.includes('thunder') || c.includes('storm')) advisories.push({ icon: 'lightning-bolt', color: '#8e44ad', title: t('stormAlert'), body: t('stormAlertBody') });

        if (advisories.length === 0) advisories.push({ icon: 'check-circle', color: '#2d6a4f', title: t('favourableConditions'), body: t('favourableConditionsBody') });
        return advisories;
    }

    const fetchAIAdvisory = async (weatherData, soilData) => {
        if (!weatherData || !weatherData.currentConditions) return;
        setAiLoading(true);
        try {
            const GEMINI_KEY = 'GEMINI-API-KEY';
            const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

            const prompt = `
                Acting as an expert agronomist, provide precision agricultural advice for a farmer at location: ${weatherData.resolvedAddress}.
                
                Current Weather: ${weatherData.currentConditions.temp}°C, ${weatherData.currentConditions.conditions}, ${weatherData.currentConditions.humidity}% humidity.
                7-Day Forecast Summary: ${weatherData.days.slice(0, 5).map(d => `${d.datetime}: ${d.tempmax}/${d.tempmin}°C, ${d.conditions}`).join('; ')}.
                
                Soil Analysis (Latest): ${soilData ? `pH: ${soilData.pH}, Nitrogen: ${soilData.nitrogen} cg/kg, ClayContent: ${soilData.clay} g/kg, Organic Carbon: ${soilData.soc} dg/kg.` : 'No soil data available.'}
                
                Provide the advice in ${language} language.
                Output MUST be in JSON format with exactly these three keys:
                "advisory": (General agricultural guidance for this week),
                "irrigation": (Specific irrigation tips based on rain probability and soil type),
                "fertilizer": (Fertilizer application advice based on current soil and weather).
                
                Keep each value concise (2-3 sentences max). Return only the JSON.
            `;

            const response = await axios.post(url, {
                contents: [{ parts: [{ text: prompt }] }]
            });

            const text = response.data.candidates[0].content.parts[0].text;
            // Sanitization in case Gemini wraps in markdown code blocks
            const sanitized = text.replace(/```json|```/g, '').trim();
            const content = JSON.parse(sanitized);
            setAiAdvisory(content);
        } catch (err) {
            console.error('Gemini AI error:', err);
        } finally {
            setAiLoading(false);
        }
    };

    useEffect(() => {
        if (weather) {
            fetchAIAdvisory(weather, lastSoilData);
        }
    }, [weather, lastSoilData]);

    // Auto-fetch location on mount
    useEffect(() => {
        useCurrentLocation();
    }, []);

    const fetchWeather = async (query) => {
        if (!query?.trim()) return;
        setLoading(true);
        setError(null);
        setWeather(null);
        setAiAdvisory(null);
        try {
            const url = `${BASE_URL}/${encodeURIComponent(query.trim())}`;
            const res = await axios.get(url, {
                params: {
                    key: API_KEY,
                    unitGroup: 'metric',
                    include: 'days,current',
                    contentType: 'json',
                },
            });
            setWeather(res.data);
            setLocation(res.data.resolvedAddress || query);
        } catch (e) {
            setError(t('weatherFetchError'));
        } finally {
            setLoading(false);
        }
    };

    const useCurrentLocation = async () => {
        setLocating(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') { setError(t('locationPermissionError')); setLocating(false); return; }
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const query = `${loc.coords.latitude},${loc.coords.longitude}`;
            setInputText(t('myLocation'));
            await fetchWeather(query);
        } catch {
            setError(t('locationError'));
        } finally {
            setLocating(false);
        }
    };

    const handleSearch = () => { Keyboard.dismiss(); fetchWeather(inputText); };

    const formatDay = (dateStr) => {
        const d = new Date(dateStr);
        const dayIdx = d.getDay();
        const labels = [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];
        return labels[dayIdx];
    };

    const current = weather?.currentConditions;
    const days = weather?.days?.slice(0, 7) ?? [];
    const advisory = current ? getFarmingAdvisory(current, days) : [];
    const iconState = current ? getWeatherIcon(current.conditions, current.icon) : null;

    return (
        <SafeAreaView style={styles.container}>
            {/* Search bar */}
            <View style={styles.searchRow}>
                <View style={styles.searchBar}>
                    <MaterialCommunityIcons name="map-marker-outline" size={20} color="#7f8c8d" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('enterCity')}
                        placeholderTextColor="#bdc3c7"
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                    />
                </View>
                <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                    <MaterialCommunityIcons name="magnify" size={22} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.gpsBtn} onPress={useCurrentLocation}>
                    {locating ? <ActivityIndicator size="small" color="#2d6a4f" />
                        : <MaterialCommunityIcons name="crosshairs-gps" size={22} color="#2d6a4f" />}
                </TouchableOpacity>
            </View>

            {/* States */}
            {loading && (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#2ecc71" />
                    <Text style={styles.loadingText}>{t('fetchingWeather')}</Text>
                </View>
            )}
            {error && !loading && (
                <View style={styles.center}>
                    <MaterialCommunityIcons name="wifi-off" size={48} color="#e74c3c" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}
            {!weather && !loading && !error && (
                <View style={styles.center}>
                    <MaterialCommunityIcons name="weather-partly-cloudy" size={72} color="#d5e8d4" />
                    <Text style={styles.emptyTitle}>{t('searchLocation')}</Text>
                    <Text style={styles.emptySubText}>{t('gpsHint')}</Text>
                </View>
            )}

            {/* Weather data */}
            {weather && !loading && (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Current weather hero */}
                    <View style={styles.heroCard}>
                        <Text style={styles.heroLocation} numberOfLines={2}>{location}</Text>
                        <View style={styles.heroMain}>
                            <MaterialCommunityIcons name={iconState.name} size={90} color={iconState.color} />
                            <View style={styles.heroTemps}>
                                <Text style={styles.heroTemp}>{Math.round(current.temp)}°C</Text>
                                <Text style={styles.heroFeels}>{t('feelsLike')} {Math.round(current.feelslike)}°C</Text>
                                <Text style={styles.heroCondition}>{toTitleCase(current.conditions)}</Text>
                            </View>
                        </View>
                        {/* Stats row */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <MaterialCommunityIcons name="water-percent" size={18} color="#3498db" />
                                <Text style={styles.statValue}>{current.humidity}%</Text>
                                <Text style={styles.statLabel}>{t('weatherHumidity')}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <MaterialCommunityIcons name="weather-windy" size={18} color="#7f8c8d" />
                                <Text style={styles.statValue}>{current.windspeed} km/h</Text>
                                <Text style={styles.statLabel}>{t('weatherWind')}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <MaterialCommunityIcons name="weather-rainy" size={18} color="#3498db" />
                                <Text style={styles.statValue}>{Math.round(current.precipprob ?? 0)}%</Text>
                                <Text style={styles.statLabel}>{t('weatherRain')}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <MaterialCommunityIcons name="white-balance-sunny" size={18} color="#f39c12" />
                                <Text style={styles.statValue}>{current.uvindex}</Text>
                                <Text style={styles.statLabel}>{t('weatherUV')}</Text>
                            </View>
                        </View>
                    </View>

                    {/* 7-day forecast */}
                    <Text style={[styles.sectionTitle, { marginTop: 12 }]}>{t('weatherForecast')}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastRow}>
                        {days.map((d, i) => {
                            const di = getWeatherIcon(d.conditions, d.icon);
                            return (
                                <View key={i} style={[styles.forecastCard, i === 0 && styles.forecastCardToday]}>
                                    <Text style={[styles.forecastDay, i === 0 && styles.forecastDayToday]}>
                                        {i === 0 ? t('weatherToday') : formatDay(d.datetime)}
                                    </Text>
                                    <MaterialCommunityIcons name={di.name} size={28} color={di.color} style={{ marginVertical: 8 }} />
                                    <Text style={styles.forecastMax}>{Math.round(d.tempmax)}°</Text>
                                    <Text style={styles.forecastMin}>{Math.round(d.tempmin)}°</Text>
                                    <View style={styles.rainChance}>
                                        <MaterialCommunityIcons name="water" size={10} color="#3498db" />
                                        <Text style={styles.rainPct}>{Math.round(d.precipprob ?? 0)}%</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>

                    {/* AI Precision Advisory */}
                    <Text style={[styles.sectionTitle, { marginTop: 24 }]}>✨ {t('aiAdvisoryTitle')}</Text>
                    <View style={styles.geminiCard}>
                        {aiLoading ? (
                            <View style={styles.aiLoadingRow}>
                                <ActivityIndicator color="#6c5ce7" size="small" />
                                <Text style={styles.aiLoadingText}>{t('geminiGenerating')}</Text>
                            </View>
                        ) : aiAdvisory ? (
                            <View style={styles.aiContent}>
                                <View style={styles.aiItem}>
                                    <View style={[styles.aiIconBox, { backgroundColor: '#edf2ff' }]}>
                                        <MaterialCommunityIcons name="robot" size={24} color="#6c5ce7" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.advisoryTitle}>{t('aiAdvisoryTitle')}</Text>
                                        <Text style={styles.advisoryBody}>{aiAdvisory.advisory}</Text>
                                    </View>
                                </View>
                                <View style={styles.aiSeparator} />
                                <View style={styles.aiItem}>
                                    <View style={[styles.aiIconBox, { backgroundColor: '#e3f2fd' }]}>
                                        <MaterialCommunityIcons name="water-check" size={24} color="#3498db" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.advisoryTitle}>{t('aiIrrigationTips')}</Text>
                                        <Text style={styles.advisoryBody}>{aiAdvisory.irrigation}</Text>
                                    </View>
                                </View>
                                <View style={styles.aiSeparator} />
                                <View style={styles.aiItem}>
                                    <View style={[styles.aiIconBox, { backgroundColor: '#f0fdf4' }]}>
                                        <MaterialCommunityIcons name="bottle-tonic-plus" size={24} color="#2d6a4f" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.advisoryTitle}>{t('aiFertilizerTips')}</Text>
                                        <Text style={styles.advisoryBody}>{aiAdvisory.fertilizer}</Text>
                                    </View>
                                </View>
                            </View>
                        ) : !lastSoilData ? (
                            <View style={styles.aiEmptyRow}>
                                <MaterialCommunityIcons name="flask-empty-outline" size={24} color="#95a5a6" />
                                <Text style={styles.aiEmptyText}>{t('noSoilDataForAI')}</Text>
                            </View>
                        ) : (
                            <View style={styles.aiEmptyRow}>
                                <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#7f8c8d" />
                                <Text style={styles.aiEmptyText}>AI advisory unavailable. Check connection.</Text>
                            </View>
                        )}
                    </View>

                    {/* Farming Advisory */}
                    <Text style={[styles.sectionTitle, { marginTop: 24 }]}>🌱 {t('weatherAdvisory')}</Text>
                    <View style={styles.advisoryContainer}>
                        {advisory.map((a, i) => (
                            <View key={i} style={[styles.advisoryCard, { borderLeftColor: a.color }]}>
                                <View style={[styles.advisoryIconBox, { backgroundColor: a.color + '22' }]}>
                                    <MaterialCommunityIcons name={a.icon} size={24} color={a.color} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.advisoryTitle}>{a.title}</Text>
                                    <Text style={styles.advisoryBody}>{a.body}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    searchRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 14, paddingVertical: 12,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    },
    searchBar: {
        flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#f5f7fa', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
        borderWidth: 1, borderColor: '#e8e8e8',
    },
    searchInput: { flex: 1, fontSize: 14, color: '#2c3e50', padding: 0 },
    searchBtn: { backgroundColor: '#1b4332', padding: 12, borderRadius: 12 },
    gpsBtn: { backgroundColor: '#f0fdf4', padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#2d6a4f' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
    loadingText: { marginTop: 12, color: '#7f8c8d', fontSize: 15 },
    errorText: { color: '#e74c3c', fontSize: 14, textAlign: 'center', marginTop: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#2c3e50', marginTop: 16 },
    emptySubText: { fontSize: 13, color: '#95a5a6', marginTop: 8, textAlign: 'center' },
    scrollContent: { padding: 16, paddingBottom: 40, gap: 16 },
    heroCard: {
        backgroundColor: '#1b4332', borderRadius: 24, padding: 22,
        shadowColor: '#1b4332', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
    },
    heroLocation: { color: '#ecf0f1', fontSize: 14, fontWeight: '500', marginBottom: 16, opacity: 0.85 },
    heroMain: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 20 },
    heroTemps: { flex: 1 },
    heroTemp: { color: '#fff', fontSize: 56, fontWeight: '800', lineHeight: 60 },
    heroFeels: { color: '#bdc3c7', fontSize: 14, marginTop: 4 },
    heroCondition: { color: '#ecf0f1', fontSize: 16, fontWeight: '600', marginTop: 4 },
    statsRow: {
        flexDirection: 'row', justifyContent: 'space-around',
        backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 14,
    },
    statItem: { alignItems: 'center', gap: 4 },
    statValue: { color: '#fff', fontSize: 13, fontWeight: '700' },
    statLabel: { color: '#95a5a6', fontSize: 10 },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: '#2c3e50', marginBottom: 2, marginTop: 4 },
    forecastRow: { marginHorizontal: -4 },
    forecastCard: {
        width: 80, backgroundColor: '#fff', borderRadius: 16, padding: 12,
        alignItems: 'center', marginHorizontal: 4,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },
    forecastCardToday: { backgroundColor: '#1b4332' },
    forecastDay: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
    forecastDayToday: { color: '#52b788' },
    forecastMax: { fontSize: 15, fontWeight: '800', color: '#2c3e50' },
    forecastMin: { fontSize: 12, color: '#95a5a6' },
    rainChance: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
    rainPct: { fontSize: 10, color: '#3498db', fontWeight: '600' },
    advisoryContainer: { gap: 12 },
    advisoryCard: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16,
        flexDirection: 'row', gap: 14, alignItems: 'flex-start',
        borderLeftWidth: 4,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },
    advisoryIconBox: {
        width: 44, height: 44, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center', flexShrink: 0,
    },
    advisoryTitle: { fontSize: 14, fontWeight: '800', color: '#2c3e50', marginBottom: 4 },
    advisoryBody: { fontSize: 13, color: '#475569', lineHeight: 19 },
    geminiCard: {
        backgroundColor: '#fff', borderRadius: 24, padding: 18,
        borderWidth: 1, borderColor: '#e0e7ff',
        shadowColor: '#6c5ce7', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05, shadowRadius: 12, elevation: 4,
    },
    aiContent: { gap: 16 },
    aiItem: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
    aiIconBox: {
        width: 44, height: 44, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center', flexShrink: 0,
    },
    aiSeparator: { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 20 },
    aiLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, justifyContent: 'center' },
    aiLoadingText: { color: '#6c5ce7', fontWeight: '600', fontSize: 14 },
    aiEmptyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, justifyContent: 'center' },
    aiEmptyText: { color: '#94a3b8', fontSize: 13, textAlign: 'center', flex: 1 },
});
