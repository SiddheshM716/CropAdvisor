import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, Text, View, FlatList, TouchableOpacity,
    ActivityIndicator, SafeAreaView, Image, Linking, RefreshControl, ScrollView,
} from 'react-native';
import axios from 'axios';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';

const API_KEY = '998da17d10bd42c2afa8a7459026374e';
const BASE_URL = 'https://newsapi.org/v2/everything';

export default function NewsScreen() {
    const { t, language } = useAppContext();

    const TOPICS = [
        { id: 'general', label: t('topicGeneral'), query: 'agriculture farming' },
        { id: 'prices', label: t('topicPrices'), query: 'crop price mandi market' },
        { id: 'weather', label: t('topicWeather'), query: 'monsoon drought flood farm' },
        { id: 'pest', label: t('topicPest'), query: 'pest disease crop blight' },
        { id: 'policy', label: t('topicPolicy'), query: 'farmer government subsidy scheme India' },
        { id: 'tech', label: t('topicTech'), query: 'agritech agriculture technology innovation' },
    ];

    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [selectedTopic, setSelectedTopic] = useState(TOPICS[0]);

    const fetchNews = useCallback(async (topic, isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        try {
            const res = await axios.get(BASE_URL, {
                params: {
                    q: topic.query,
                    apiKey: API_KEY,
                    language: 'en',
                    sortBy: 'publishedAt',
                    pageSize: 20,
                },
            });

            const filtered = (res.data.articles || []).filter(
                a => a.title && a.title !== '[Removed]' && a.urlToImage
            );
            setArticles(filtered);
        } catch (e) {
            console.error(e);
            setError(t('error'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [t]);

    // Update selectedTopic whenever translation changes (to keep label updated)
    useEffect(() => {
        const current = TOPICS.find(tp => tp.id === selectedTopic.id) || TOPICS[0];
        setSelectedTopic(current);
    }, [language]);

    useEffect(() => {
        fetchNews(selectedTopic);
    }, [selectedTopic, fetchNews]);

    const handleTopicChange = (topic) => {
        setSelectedTopic(topic);
        setArticles([]);
    };

    const openArticle = (url) => {
        if (url) Linking.openURL(url);
    };

    const formatDate = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleDateString(language === 'en' ? 'en-IN' : language, { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const renderItem = ({ item, index }) => (
        <TouchableOpacity style={styles.card} onPress={() => openArticle(item.url)} activeOpacity={0.85}>
            {item.urlToImage ? (
                <Image source={{ uri: item.urlToImage }} style={styles.cardImage} />
            ) : (
                <View style={[styles.cardImage, styles.noImage]}>
                    <MaterialCommunityIcons name="newspaper-variant-outline" size={36} color="#d5e8d4" />
                </View>
            )}
            <View style={styles.cardBody}>
                <View style={styles.metaRow}>
                    <Text style={styles.source}>{item.source?.name || 'News'}</Text>
                    <Text style={styles.date}>{formatDate(item.publishedAt)}</Text>
                </View>
                <Text style={styles.headline} numberOfLines={3}>{item.title}</Text>
                {item.description ? (
                    <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                ) : null}
                <View style={styles.readMore}>
                    <Text style={styles.readMoreText}>{t('readMore')}</Text>
                    <MaterialCommunityIcons name="arrow-right" size={14} color="#2ecc71" />
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Topic chips */}
            <View style={styles.topicsWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.topicsScroll}
                >
                    {TOPICS.map((tItem) => (
                        <TouchableOpacity
                            key={tItem.id}
                            style={[styles.topicChip, selectedTopic.id === tItem.id && styles.topicChipActive]}
                            onPress={() => handleTopicChange(tItem)}
                        >
                            <Text style={[styles.topicText, selectedTopic.id === tItem.id && styles.topicTextActive]}>
                                {tItem.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading && (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#2ecc71" />
                    <Text style={styles.loadingText}>{t('newsLoading')}</Text>
                </View>
            )}

            {error && !loading && (
                <View style={styles.center}>
                    <MaterialCommunityIcons name="wifi-off" size={46} color="#e74c3c" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => fetchNews(selectedTopic)}>
                        <Text style={styles.retryText}>{t('retry')}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {!loading && !error && (
                <FlatList
                    data={articles}
                    keyExtractor={(_, i) => i.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => fetchNews(selectedTopic, true)}
                            tintColor="#2ecc71"
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <MaterialCommunityIcons name="newspaper-remove" size={50} color="#bdc3c7" />
                            <Text style={styles.emptyText}>{t('noArticles')}</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },

    topicsWrapper: {
        backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    },
    topicsScroll: { paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
    topicChip: {
        paddingHorizontal: 16, paddingVertical: 9, borderRadius: 25,
        backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
    },
    topicChipActive: {
        backgroundColor: '#1b4332', borderColor: '#1b4332',
    },
    topicText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
    topicTextActive: { color: '#fff' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    loadingText: { marginTop: 12, fontSize: 15, color: '#64748b', fontWeight: '500' },
    errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center', marginTop: 12 },
    retryBtn: {
        marginTop: 20, backgroundColor: '#2d6a4f', paddingHorizontal: 28,
        paddingVertical: 12, borderRadius: 25,
        shadowColor: '#2d6a4f', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
    },
    retryText: { color: '#fff', fontWeight: '800', fontSize: 14 },
    emptyText: { color: '#94a3b8', fontSize: 16, marginTop: 12, fontWeight: '500' },

    list: { padding: 16, gap: 16 },
    card: {
        backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
        borderWidth: 1, borderColor: '#f1f5f9'
    },
    cardImage: { width: '100%', height: 190 },
    noImage: {
        backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center',
    },
    cardBody: { padding: 16 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' },
    source: {
        fontSize: 11, fontWeight: '800', color: '#2d6a4f',
        textTransform: 'uppercase', letterSpacing: 0.8,
    },
    date: { fontSize: 11, color: '#64748b', fontWeight: '500' },
    headline: { fontSize: 16, fontWeight: '800', color: '#1e293b', lineHeight: 24, marginBottom: 8 },
    description: { fontSize: 14, color: '#475569', lineHeight: 21, marginBottom: 12 },
    readMore: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    readMoreText: { fontSize: 14, color: '#2d6a4f', fontWeight: '700' },
});
