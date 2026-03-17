import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    SafeAreaView,
    FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext, LANGUAGES } from '../context/AppContext';

export default function LanguageScreen({ navigation }) {
    const { language: currentLanguage, changeLanguage, t } = useAppContext();

    const handleLanguageSelect = (code) => {
        changeLanguage(code);
        navigation.goBack();
    };

    const renderItem = ({ item }) => {
        const isSelected = item.code === currentLanguage;
        return (
            <TouchableOpacity
                style={[styles.languageItem, isSelected && styles.languageItemSelected]}
                onPress={() => handleLanguageSelect(item.code)}
            >
                <View style={styles.languageInfo}>
                    <Text style={styles.flag}>{item.flag}</Text>
                    <View>
                        <Text style={[styles.languageNative, isSelected && styles.textSelected]}>
                            {item.nativeLabel}
                        </Text>
                        <Text style={[styles.languageLabel, isSelected && styles.textSelectedSubtitle]}>
                            {item.label}
                        </Text>
                    </View>
                </View>
                {isSelected && (
                    <MaterialCommunityIcons name="check-circle" size={24} color="#2ecc71" />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{t('selectLanguage')}</Text>
            </View>
            <FlatList
                data={LANGUAGES}
                keyExtractor={(item) => item.code}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        padding: 24,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1e293b',
    },
    list: {
        padding: 16,
    },
    languageItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 18,
        backgroundColor: '#fff',
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    languageItemSelected: {
        borderColor: '#2d6a4f',
        backgroundColor: '#f0fdf4',
    },
    languageInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    flag: {
        fontSize: 32,
        marginRight: 18,
    },
    languageNative: {
        fontSize: 17,
        fontWeight: '800',
        color: '#1e293b',
    },
    languageLabel: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
        marginTop: 1,
    },
    textSelected: {
        color: '#2d6a4f',
    },
    textSelectedSubtitle: {
        color: '#2d6a4f',
        opacity: 0.8,
    },
});
