import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import translations from '../i18n/translations';

const LANGUAGE_KEY = '@app_language';
const SOIL_DATA_KEY = '@last_soil_data';
const AUTH_TOKEN_KEY = '@auth_token';
const USER_DATA_KEY = '@user_data';

const AppContext = createContext();

export const LANGUAGES = [
    { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
    { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी', flag: '🇮🇳' },
    { code: 'mr', label: 'Marathi', nativeLabel: 'मరాఠీ', flag: '🇮🇳' },
    { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు', flag: '🇮🇳' },
];

export function AppProvider({ children }) {
    const [language, setLanguage] = useState('en');
    const [lastSoilData, setLastSoilData] = useState(null);
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [savedLang, savedSoil, savedToken, savedUser] = await Promise.all([
                    AsyncStorage.getItem(LANGUAGE_KEY),
                    AsyncStorage.getItem(SOIL_DATA_KEY),
                    AsyncStorage.getItem(AUTH_TOKEN_KEY),
                    AsyncStorage.getItem(USER_DATA_KEY)
                ]);

                if (savedLang && translations[savedLang]) setLanguage(savedLang);
                if (savedSoil) setLastSoilData(JSON.parse(savedSoil));
                if (savedToken) setToken(savedToken);
                if (savedUser) setUser(JSON.parse(savedUser));
            } catch (err) {
                console.error('Failed to load initial data:', err);
            } finally {
                setLoaded(true);
            }
        };
        loadInitialData();
    }, []);

    const changeLanguage = async (code) => {
        setLanguage(code);
        await AsyncStorage.setItem(LANGUAGE_KEY, code);
    };

    const saveSoilData = async (data) => {
        setLastSoilData(data);
        await AsyncStorage.setItem(SOIL_DATA_KEY, JSON.stringify(data));
    };

    const login = async (userData, authToken) => {
        setUser(userData);
        setToken(authToken);
        await Promise.all([
            AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData)),
            AsyncStorage.setItem(AUTH_TOKEN_KEY, authToken)
        ]);
    };

    const logout = async () => {
        setUser(null);
        setToken(null);
        await Promise.all([
            AsyncStorage.removeItem(USER_DATA_KEY),
            AsyncStorage.removeItem(AUTH_TOKEN_KEY)
        ]);
    };

    const t = (key) =>
        (translations[language] && translations[language][key]) ||
        (translations['en'] && translations['en'][key]) ||
        key;

    return (
        <AppContext.Provider value={{
            language, changeLanguage, t, loaded,
            lastSoilData, saveSoilData,
            user, token, login, logout
        }}>
            {loaded ? children : null}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    return useContext(AppContext);
}
