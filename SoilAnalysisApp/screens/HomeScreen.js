import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen({ navigation }) {
    const { t, user } = useAppContext();

    const features = [
        {
            id: 'soil',
            title: t('soilAnalyzer'),
            sub: t('analyze'),
            icon: 'test-tube',
            color: ['#1b4332', '#2d6a4f'],
            iconColor: '#bbf7d0', // Mint
            route: 'SoilAnalyzer'
        },
        {
            id: 'disease',
            title: t('diseaseDetector'),
            sub: t('detect'),
            icon: 'leaf-circle',
            color: ['#1b4332', '#40916c'],
            iconColor: '#ffcf72', // Amber
            route: 'PlantDisease'
        },
        {
            id: 'market',
            title: t('marketPrices'),
            sub: t('live'),
            icon: 'trending-up',
            color: ['#2d6a4f', '#52b788'],
            iconColor: '#7dd3fc', // Sky
            route: 'MarketPrice'
        },
        {
            id: 'chatbot',
            title: t('agriChatbot'),
            sub: t('agriChatbotDesc'),
            icon: 'robot-outline',
            color: ['#40916c', '#74c69d'],
            iconColor: '#c084fc', // Lilac
            route: 'Chatbot'
        },
        {
            id: 'news',
            title: t('agriNews'),
            sub: t('stayUpdated'),
            icon: 'newspaper-variant-outline',
            color: ['#1b4332', '#2d6a4f'],
            iconColor: '#fda4af', // Rose
            route: 'News'
        },
        {
            id: 'weather',
            title: t('weatherAdvisory'),
            sub: t('weatherAdvisoryDesc'),
            icon: 'weather-partly-cloudy',
            color: ['#2d6a4f', '#40916c'],
            iconColor: '#fde047', // Yellow
            route: 'Weather'
        }
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.bgWrapper}>
                <LinearGradient
                    colors={['#fff', '#f8fafc']}
                    style={StyleSheet.absoluteFill}
                />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Premium Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View style={styles.headerTextWrapper}>
                            <Text style={styles.greetingText} numberOfLines={1}>
                                {user ? `${t('hi')}, ${user.username}` : t('welcome')}
                            </Text>
                            <Text style={styles.headerSubtitle}>{t('homeSubtitle')}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.headerIconBtn}
                            onPress={() => navigation.navigate('Language')}
                        >
                            <MaterialCommunityIcons name="translate" size={22} color="#1b4332" />
                        </TouchableOpacity>
                    </View>

                    {/* Stats/Weather Integration Placeholder */}
                    <LinearGradient
                        colors={['#1b4332', '#2d6a4f']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroCard}
                    >
                        <View style={styles.heroInfo}>
                            <Text style={styles.heroTitle}>Farmer Dashboard</Text>
                            <Text style={styles.heroSub}>Expert tools for your growth</Text>
                        </View>
                        <View style={styles.heroIconBox}>
                            <MaterialCommunityIcons name="leaf" size={40} color="rgba(255,255,255,0.9)" />
                        </View>
                    </LinearGradient>
                </View>

                {/* Feature Grid */}
                <View style={styles.gridContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionHeading}>{t('features')}</Text>
                        <View style={styles.headingUnderline} />
                    </View>

                    <View style={styles.grid}>
                        {features.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.gridItem}
                                onPress={() => navigation.navigate(item.route)}
                            >
                                <LinearGradient
                                    colors={item.color}
                                    style={styles.itemIconContainer}
                                >
                                    <MaterialCommunityIcons name={item.icon} size={28} color={item.iconColor} />
                                </LinearGradient>
                                <Text style={styles.itemTitle}>{item.title}</Text>
                                <Text style={styles.itemSub} numberOfLines={1}>{item.sub}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    bgWrapper: { ...StyleSheet.absoluteFillObject },
    scrollContent: { paddingBottom: 40 },
    header: { padding: 24, paddingTop: Platform.OS === 'ios' ? 20 : 40 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16 },
    headerTextWrapper: { flex: 1 },
    greetingText: { fontSize: 26, fontWeight: '800', color: '#1e293b' },
    headerSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
    headerIconBtn: {
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
        shadowColor: '#1b4332', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, shadowRadius: 10, elevation: 3,
        borderWidth: 1, borderColor: '#f1f5f9'
    },
    heroCard: {
        borderRadius: 24, padding: 24, flexDirection: 'row',
        justifyContent: 'space-between', alignItems: 'center',
        shadowColor: '#1b4332', shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2, shadowRadius: 20, elevation: 12
    },
    heroInfo: { flex: 1 },
    heroTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
    heroIconBox: {
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center', alignItems: 'center'
    },
    gridContainer: { paddingHorizontal: 24, marginTop: 10 },
    sectionHeader: { marginBottom: 16, position: 'relative' },
    sectionHeading: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
    headingUnderline: { width: 40, height: 4, backgroundColor: '#2d6a4f', borderRadius: 2, marginTop: 4 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    gridItem: {
        width: '48%', backgroundColor: '#fff', borderRadius: 24, padding: 16,
        marginBottom: 16, alignItems: 'center',
        shadowColor: '#1b4332', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06, shadowRadius: 15, elevation: 4, borderWidth: 1, borderColor: '#f1f5f9'
    },
    itemIconContainer: {
        width: 52, height: 52, borderRadius: 16,
        justifyContent: 'center', alignItems: 'center', marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8
    },
    itemTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b', textAlign: 'center' },
    itemSub: { fontSize: 10, color: '#94a3b8', marginTop: 4, textAlign: 'center' }
});
