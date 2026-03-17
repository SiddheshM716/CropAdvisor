import React, { useState } from 'react';
import {
    StyleSheet, Text, View, Image, TouchableOpacity,
    ActivityIndicator, ScrollView, SafeAreaView, Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';

const API_URL = 'http://192.168.137.38:5002/predict_disease';

export default function PlantDiseaseScreen() {
    const { t } = useAppContext();
    const [imageUri, setImageUri] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);


    const requestPermissions = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                alert(t('error'));
            }
        }
    };

    const pickImage = async () => {
        await requestPermissions();
        const picked = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            base64: true,
        });
        if (!picked.canceled) {
            setImageUri(picked.assets[0].uri);
            setResult(null);
            setError(null);
            analyzeImage(picked.assets[0].base64);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { alert(t('error')); return; }
        const picked = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            base64: true,
        });
        if (!picked.canceled) {
            setImageUri(picked.assets[0].uri);
            setResult(null);
            setError(null);
            analyzeImage(picked.assets[0].base64);
        }
    };

    const analyzeImage = async (base64Image) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('inputImage', base64Image);
            const response = await axios.post(API_URL, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setResult(response.data);
        } catch (err) {
            console.error(err);
            setError(t('analyzeError'));
        } finally {
            setLoading(false);
        }
    };

    const formatLabel = (label) => {
        if (!label) return '';
        // If it's a known class, it might have a translation, but for now we format the model output
        if (label === 'unknown') return t('unknown');
        if (label.toLowerCase().includes('healthy')) return t('optimal');
        return label.replace(/___|__/g, ' › ').replace(/_/g, ' ');
    };

    const isHealthy = result && result.label && result.label.toLowerCase().includes('healthy');
    const isUnknown = result && result.label && result.label.toLowerCase() === 'unknown';

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Image area */}
                <View style={styles.imageContainer}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.image} />
                    ) : (
                        <View style={styles.placeholder}>
                            <MaterialCommunityIcons name="leaf" size={60} color="#b2dfdb" />
                            <Text style={styles.placeholderText}>{t('leafPrompt')}</Text>
                        </View>
                    )}
                </View>

                {/* Buttons */}
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.btn} onPress={pickImage}>
                        <MaterialCommunityIcons name="image-outline" size={20} color="#fff" />
                        <Text style={styles.btnText}>{t('pickFromGallery')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={takePhoto}>
                        <MaterialCommunityIcons name="camera-outline" size={20} color="#2ecc71" />
                        <Text style={styles.btnTextSecondary}>{t('takePhoto')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Loading */}
                {loading && (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color="#2ecc71" />
                        <Text style={styles.loadingText}>{t('analyzing2')}</Text>
                    </View>
                )}

                {/* Error */}
                {error && <Text style={styles.errorText}>{error}</Text>}

                {/* Results */}
                {result && (
                    <View style={styles.resultsContainer}>

                        {/* Disease Name */}
                        <View style={[
                            styles.diseaseCard,
                            { borderLeftColor: isHealthy ? '#2ecc71' : isUnknown ? '#95a5a6' : '#e74c3c' }
                        ]}>
                            <View style={styles.diseaseRow}>
                                <MaterialCommunityIcons
                                    name={isHealthy ? 'check-circle' : isUnknown ? 'help-circle' : 'alert-circle'}
                                    size={28}
                                    color={isHealthy ? '#2ecc71' : isUnknown ? '#95a5a6' : '#e74c3c'}
                                />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.diseaseLabel}>{t('detectionResult')}</Text>
                                    <Text style={styles.diseaseName}>{formatLabel(result.label)}</Text>
                                </View>
                            </View>

                            {/* Confidence */}
                            <View style={styles.metaRow}>
                                <View style={styles.metaBadge}>
                                    <Text style={styles.metaLabel}>{t('confidence')}</Text>
                                    <Text style={styles.metaValue}>{result.confidence?.toFixed(1)}%</Text>
                                </View>
                            </View>
                        </View>

                        {/* Treatment */}
                        {result.treatment && (
                            <View style={styles.treatmentCard}>
                                <Text style={styles.treatmentTitle}>
                                    {isHealthy ? `✅  ${t('plantStatus')}` : `💊  ${t('treatment')}`}
                                </Text>
                                <Text style={styles.treatmentText}>{result.treatment}</Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    scrollContent: { padding: 20, alignItems: 'center', paddingBottom: 50 },
    imageContainer: {
        width: 280, height: 280, borderRadius: 24,
        backgroundColor: '#fff', overflow: 'hidden',
        marginBottom: 24, marginTop: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, shadowRadius: 12, elevation: 5,
        borderWidth: 1, borderColor: '#e2e8f0',
        justifyContent: 'center', alignItems: 'center',
    },
    image: { width: '100%', height: '100%' },
    placeholder: { alignItems: 'center', gap: 12 },
    placeholderText: { color: '#94a3b8', fontSize: 16, fontWeight: '500' },
    buttonRow: { flexDirection: 'row', width: '100%', marginBottom: 24, gap: 12 },
    btn: {
        flex: 1, flexDirection: 'row', gap: 10,
        backgroundColor: '#1b4332', paddingVertical: 15,
        borderRadius: 16, alignItems: 'center', justifyContent: 'center',
        shadowColor: '#1b4332', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
    },
    btnSecondary: {
        backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#1b4332',
        shadowOpacity: 0, elevation: 0,
    },
    btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    btnTextSecondary: { color: '#1b4332', fontSize: 15, fontWeight: '700' },
    loadingBox: { alignItems: 'center', marginVertical: 30 },
    loadingText: { marginTop: 12, fontSize: 15, color: '#64748b', fontWeight: '600' },
    errorText: {
        color: '#ef4444', fontSize: 14, textAlign: 'center',
        backgroundColor: '#fef2f2', padding: 16, borderRadius: 16, width: '100%',
        borderWidth: 1, borderColor: '#fee2e2'
    },
    resultsContainer: { width: '100%', gap: 16 },
    diseaseCard: {
        backgroundColor: '#fff', padding: 20, borderRadius: 20,
        borderLeftWidth: 6,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    },
    diseaseRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    diseaseLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    diseaseName: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginTop: 4, flexShrink: 1 },
    metaRow: { flexDirection: 'row', gap: 12 },
    metaBadge: {
        backgroundColor: '#f8fafc', borderRadius: 12,
        padding: 12, flex: 1, borderWidth: 1, borderColor: '#edf2f7'
    },
    metaLabel: { fontSize: 10, color: '#64748b', fontWeight: '700', textTransform: 'uppercase' },
    metaValue: { fontSize: 18, fontWeight: '800', color: '#1b4332', marginTop: 2 },
    treatmentCard: {
        backgroundColor: '#fff', padding: 22, borderRadius: 20,
        borderLeftWidth: 6, borderLeftColor: '#3b82f6',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    },
    treatmentTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 12 },
    treatmentText: { fontSize: 15, color: '#475569', lineHeight: 24 },
});
