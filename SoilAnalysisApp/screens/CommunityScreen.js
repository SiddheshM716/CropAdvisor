import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, Text, View, FlatList, TouchableOpacity,
    ActivityIndicator, Image, RefreshControl, Platform
} from 'react-native';
import axios from 'axios';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';

const BASE_URL = 'http://192.168.137.38:5005/api/forum';

export default function CommunityScreen({ navigation }) {
    const { t, user } = useAppContext();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [useLocation, setUseLocation] = useState(false);
    const [location, setLocation] = useState(null);

    const fetchQuestions = useCallback(async (pageNum = 1, shouldRefresh = false) => {
        try {
            let url = `${BASE_URL}/questions?page=${pageNum}&limit=10`;
            if (useLocation && location) {
                url += `&lat=${location.coords.latitude}&lon=${location.coords.longitude}&distance=100`;
            }

            const response = await axios.get(url);
            const data = response.data;

            if (data.length < 10) setHasMore(false);

            if (shouldRefresh) {
                setQuestions(data);
            } else {
                setQuestions(prev => [...prev, ...data]);
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [useLocation, location]);

    useEffect(() => {
        fetchQuestions(1, true);
    }, [fetchQuestions]);

    const handleRefresh = () => {
        setRefreshing(true);
        setPage(1);
        setHasMore(true);
        fetchQuestions(1, true);
    };

    const loadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchQuestions(nextPage);
        }
    };

    const toggleLocationFilter = async () => {
        if (!useLocation) {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
            let currentLoc = await Location.getCurrentPositionAsync({});
            setLocation(currentLoc);
            setUseLocation(true);
        } else {
            setUseLocation(false);
        }
        setRefreshing(true);
        setPage(1);
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('QuestionDetail', { questionId: item._id })}
        >
            <View style={styles.cardHeader}>
                <Image source={{ uri: item.owner.avatar }} style={styles.avatar} />
                <View>
                    <Text style={styles.username}>{item.owner.username}</Text>
                    <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                {item.cropType && (
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>{item.cropType}</Text>
                    </View>
                )}
            </View>

            <Text style={styles.questionTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.questionDesc} numberOfLines={3}>{item.description}</Text>

            {item.image && (
                <Image source={{ uri: item.image }} style={styles.questionImage} />
            )}

            <View style={styles.cardFooter}>
                <View style={styles.stat}>
                    <MaterialCommunityIcons name="comment-text-outline" size={18} color="#64748b" />
                    <Text style={styles.statText}>{item.answerCount} {t('answers')}</Text>
                </View>
                <View style={styles.stat}>
                    <MaterialCommunityIcons name="map-marker-outline" size={18} color="#64748b" />
                    <Text style={styles.statText}>Nearby</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('forumTitle')}</Text>

                <TouchableOpacity
                    style={[styles.filterButton, useLocation && styles.filterButtonActive]}
                    onPress={toggleLocationFilter}
                >
                    <MaterialCommunityIcons
                        name={useLocation ? "crosshairs-gps" : "map-marker-off-outline"}
                        size={20} color={useLocation ? "#fff" : "#2d6a4f"}
                    />
                    <Text style={[styles.filterText, useLocation && styles.filterTextActive]}>
                        {useLocation ? t('nearestQuestions') : "All"}
                    </Text>
                </TouchableOpacity>
            </View>

            {loading && page === 1 ? (
                <ActivityIndicator style={styles.loader} size="large" color="#2d6a4f" />
            ) : (
                <FlatList
                    data={questions}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#2d6a4f']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="comment-question-outline" size={60} color="#e2e8f0" />
                            <Text style={styles.emptyText}>{t('noQuestions')}</Text>
                        </View>
                    }
                    ListFooterComponent={hasMore && questions.length > 0 ? (
                        <ActivityIndicator style={{ padding: 20 }} color="#2d6a4f" />
                    ) : null}
                />
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => user ? navigation.navigate('PostQuestion') : navigation.navigate('Auth')}
            >
                <MaterialCommunityIcons name="plus" size={30} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingBottom: 20, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
    },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
    filterButton: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12
    },
    filterButtonActive: { backgroundColor: '#2d6a4f' },
    filterText: { fontSize: 13, fontWeight: '700', color: '#2d6a4f' },
    filterTextActive: { color: '#fff' },
    listContent: { padding: 20, paddingBottom: 100 },
    card: {
        backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20,
        shadowColor: '#1b4332', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, shadowRadius: 15, elevation: 3,
        borderWidth: 1, borderColor: '#f1f5f9'
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9' },
    username: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    date: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
    tag: {
        marginLeft: 'auto', backgroundColor: '#f0fdf4',
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10
    },
    tagText: { color: '#2d6a4f', fontSize: 11, fontWeight: '800' },
    questionTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 8, lineHeight: 24 },
    questionDesc: { fontSize: 15, color: '#475569', lineHeight: 22, marginBottom: 15 },
    questionImage: { width: '100%', height: 220, borderRadius: 18, marginBottom: 15, backgroundColor: '#f1f5f9' },
    cardFooter: {
        flexDirection: 'row', gap: 20, borderTopWidth: 1,
        borderTopColor: '#f8fafc', paddingTop: 15
    },
    stat: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
    loader: { flex: 1, justifyContent: 'center' },
    fab: {
        position: 'absolute', right: 20, bottom: 20,
        backgroundColor: '#1b4332', width: 64, height: 64, borderRadius: 32,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#1b4332', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3, shadowRadius: 15, elevation: 8
    },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#94a3b8', marginTop: 16, fontSize: 16, fontWeight: '600' }
});
