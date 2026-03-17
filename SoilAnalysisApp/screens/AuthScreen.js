import React, { useState } from 'react';
import {
    StyleSheet, Text, View, TextInput, TouchableOpacity,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import axios from 'axios';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import * as Location from 'expo-location';

// Backend URL
const BASE_URL = 'http://192.168.137.38:5005/api/auth';

export default function AuthScreen({ navigation }) {
    const { t, login } = useAppContext();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        phoneNumber: ''
    });

    const toggleMode = () => setIsLogin(!isLogin);

    const handleSubmit = async () => {
        if (!form.email || !form.password || (!isLogin && (!form.username || !form.phoneNumber))) {
            Alert.alert(t('error'), 'Please fill all fields');
            return;
        }

        setLoading(true);
        try {
            let registrationData = { ...form };

            if (!isLogin) {
                // Fetch location during signup
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const location = await Location.getCurrentPositionAsync({});
                    registrationData.lat = location.coords.latitude;
                    registrationData.lon = location.coords.longitude;
                }
            }

            const endpoint = isLogin ? '/login' : '/register';
            const response = await axios.post(`${BASE_URL}${endpoint}`, registrationData);

            const { user, token } = response.data;
            await login(user, token);

            navigation.goBack();
        } catch (error) {
            console.error('Auth error:', error);
            Alert.alert(t('error'), error.response?.data?.error || t('authError'));
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
                    <View style={styles.logoIcon}>
                        <MaterialCommunityIcons name="account-group" size={40} color="#fff" />
                    </View>
                    <Text style={styles.title}>{isLogin ? t('login') : t('signup')}</Text>
                    <Text style={styles.subtitle}>
                        {isLogin ? t('welcome') : t('createAccount')}
                    </Text>
                </View>

                <View style={styles.formCard}>
                    {!isLogin && (
                        <>
                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons name="account-outline" size={20} color="#94a3b8" />
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('username')}
                                    placeholderTextColor="#94a3b8"
                                    value={form.username}
                                    onChangeText={(val) => setForm({ ...form, username: val })}
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons name="phone-outline" size={20} color="#94a3b8" />
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('phoneNumber')}
                                    placeholderTextColor="#94a3b8"
                                    value={form.phoneNumber}
                                    onChangeText={(val) => setForm({ ...form, phoneNumber: val })}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </>
                    )}

                    <View style={styles.inputContainer}>
                        <MaterialCommunityIcons name="email-outline" size={20} color="#94a3b8" />
                        <TextInput
                            style={styles.input}
                            placeholder={t('email')}
                            placeholderTextColor="#94a3b8"
                            value={form.email}
                            onChangeText={(val) => setForm({ ...form, email: val })}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <MaterialCommunityIcons name="lock-outline" size={20} color="#94a3b8" />
                        <TextInput
                            style={styles.input}
                            placeholder={t('password')}
                            placeholderTextColor="#94a3b8"
                            value={form.password}
                            onChangeText={(val) => setForm({ ...form, password: val })}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.mainButton}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>
                                {isLogin ? t('login') : t('signup')}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.switchButton} onPress={toggleMode}>
                        <Text style={styles.switchText}>
                            {isLogin ? t('noAccount') : t('alreadyHaveAccount')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    scrollContent: { padding: 24, justifyContent: 'center', minHeight: '100%' },
    header: { alignItems: 'center', marginBottom: 40 },
    logoIcon: {
        width: 80, height: 80, borderRadius: 24,
        backgroundColor: '#1b4332', justifyContent: 'center', alignItems: 'center',
        marginBottom: 20, shadowColor: '#1b4332', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2, shadowRadius: 12, elevation: 8
    },
    title: { fontSize: 28, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#64748b', textAlign: 'center' },
    formCard: {
        backgroundColor: '#fff', borderRadius: 28, padding: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05, shadowRadius: 20, elevation: 2,
        borderWidth: 1, borderColor: '#f1f5f9'
    },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#f8fafc', borderRadius: 16, paddingHorizontal: 16,
        paddingVertical: 14, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0'
    },
    input: { flex: 1, fontSize: 16, color: '#1e293b' },
    mainButton: {
        backgroundColor: '#2d6a4f', borderRadius: 18, paddingVertical: 18,
        alignItems: 'center', marginTop: 12, shadowColor: '#2d6a4f',
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    switchButton: { marginTop: 24, alignItems: 'center' },
    switchText: { color: '#2d6a4f', fontSize: 14, fontWeight: '700' }
});
