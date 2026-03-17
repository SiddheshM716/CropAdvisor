import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, TextInput, TouchableOpacity,
    ActivityIndicator, Image, ScrollView, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';

const BASE_URL = 'http://192.168.137.38:5005/api/forum/questions';

export default function PostQuestionScreen({ navigation }) {
    const { t, token } = useAppContext();
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState(null);
    const [location, setLocation] = useState(null);

    const [form, setForm] = useState({
        title: '',
        description: '',
        cropType: '',
        soilType: ''
    });

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                let currentLoc = await Location.getCurrentPositionAsync({});
                setLocation(currentLoc);
            }
        })();
    }, []);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!form.title || !form.description) {
            Alert.alert(t('error'), 'Title and description are required');
            return;
        }

        if (!location) {
            Alert.alert(t('error'), 'Location is required to post a question.');
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('description', form.description);
        formData.append('cropType', form.cropType);
        formData.append('soilType', form.soilType);
        formData.append('lat', location.coords.latitude.toString());
        formData.append('lon', location.coords.longitude.toString());

        if (image) {
            const uriParts = image.split('.');
            const fileType = uriParts[uriParts.length - 1];
            formData.append('image', {
                uri: image,
                name: `photo.${fileType}`,
                type: `image/${fileType}`,
            });
        }

        try {
            await axios.post(BASE_URL, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });
            Alert.alert('Success', 'Question posted successfully!');
            navigation.goBack();
        } catch (error) {
            console.error('Post error:', error);
            Alert.alert(t('error'), error.response?.data?.error || 'Failed to post question');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>{t('askQuestion')}</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <MaterialCommunityIcons name="close" size={24} color="#1e293b" />
                    </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('questionTitle')}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. My tomato leaves are turning yellow"
                        value={form.title}
                        onChangeText={(val) => setForm({ ...form, title: val })}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('questionDesc')}</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Describe the problem in detail..."
                        multiline
                        numberOfLines={4}
                        value={form.description}
                        onChangeText={(val) => setForm({ ...form, description: val })}
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>{t('cropType')}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Tomato"
                            value={form.cropType}
                            onChangeText={(val) => setForm({ ...form, cropType: val })}
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>{t('soilType')}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Clay"
                            value={form.soilType}
                            onChangeText={(val) => setForm({ ...form, soilType: val })}
                        />
                    </View>
                </View>

                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                    {image ? (
                        <Image source={{ uri: image }} style={styles.preview} />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <MaterialCommunityIcons name="camera-plus-outline" size={40} color="#94a3b8" />
                            <Text style={styles.imageText}>{t('uploadImage')}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitText}>{t('postQuestion')}</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    scrollContent: { padding: 24, paddingTop: 60 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 32
    },
    title: { fontSize: 26, fontWeight: '800', color: '#1e293b' },
    inputGroup: { marginBottom: 24 },
    label: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16,
        fontSize: 16, color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02, shadowRadius: 5, elevation: 1
    },
    textArea: { height: 140, textAlignVertical: 'top' },
    row: { flexDirection: 'row', gap: 16 },
    imagePicker: {
        width: '100%', height: 200, borderRadius: 24,
        backgroundColor: '#fff', borderStyle: 'dashed',
        borderWidth: 2, borderColor: '#cbd5e1',
        overflow: 'hidden', marginBottom: 35,
        justifyContent: 'center', alignItems: 'center'
    },
    imagePlaceholder: { alignItems: 'center', gap: 10 },
    imageText: { color: '#64748b', fontWeight: '700', fontSize: 14 },
    preview: { width: '100%', height: '100%' },
    submitButton: {
        backgroundColor: '#2d6a4f', borderRadius: 18, paddingVertical: 18,
        alignItems: 'center', shadowColor: '#2d6a4f', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25, shadowRadius: 12, elevation: 8
    },
    disabledButton: { opacity: 0.7 },
    submitText: { color: '#fff', fontSize: 17, fontWeight: '800' }
});
