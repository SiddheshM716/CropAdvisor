import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, Text, View, ScrollView, Image, TouchableOpacity,
    TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import axios from 'axios';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';

const BASE_URL = 'http://192.168.137.38:5005/api/forum';

export default function QuestionDetailScreen({ route, navigation }) {
    const { questionId } = route.params;
    const { t, user, token } = useAppContext();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [answerText, setAnswerText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchDetails = useCallback(async () => {
        try {
            const response = await axios.get(`${BASE_URL}/questions/${questionId}`);
            setData(response.data);
        } catch (error) {
            console.error('Fetch error:', error);
            Alert.alert(t('error'), 'Could not load question details');
        } finally {
            setLoading(false);
        }
    }, [questionId]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    const handleVote = async (answerId) => {
        if (!user) {
            Alert.alert(t('login'), t('loginToParticipate'));
            return;
        }
        try {
            await axios.post(`${BASE_URL}/answers/${answerId}/vote`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchDetails(); // Refresh to show new vote count
        } catch (error) {
            console.error('Vote error:', error);
        }
    };

    const handleSetBest = async (answerId) => {
        try {
            await axios.patch(`${BASE_URL}/answers/${answerId}/best`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchDetails();
        } catch (error) {
            Alert.alert(t('error'), 'Only question owner can select best answer');
        }
    };

    const submitAnswer = async () => {
        if (!answerText.trim()) return;
        if (!user) {
            navigation.navigate('Auth');
            return;
        }

        setSubmitting(true);
        try {
            await axios.post(`${BASE_URL}/questions/${questionId}/answers`, { text: answerText }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAnswerText('');
            fetchDetails();
        } catch (error) {
            Alert.alert(t('error'), 'Failed to submit answer');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#2ecc71" />;
    if (!data) return null;

    const { question, answers } = data;
    const isOwner = user && user._id === question.owner._id;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={100}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Question Section */}
                <View style={styles.questionCard}>
                    <View style={styles.authorRow}>
                        <Image source={{ uri: question.owner.avatar }} style={styles.avatar} />
                        <View>
                            <Text style={styles.username}>{question.owner.username}</Text>
                            <Text style={styles.date}>{new Date(question.createdAt).toLocaleDateString()}</Text>
                        </View>
                    </View>
                    <Text style={styles.title}>{question.title}</Text>
                    <Text style={styles.description}>{question.description}</Text>
                    {question.image && <Image source={{ uri: question.image }} style={styles.qImage} />}
                </View>

                {/* Answers Section */}
                <Text style={styles.sectionHeader}>{answers.length} {t('answers')}</Text>

                {answers.map((ans) => {
                    const hasVoted = user && ans.votes.includes(user._id);
                    return (
                        <View key={ans._id} style={[styles.answerCard, ans.isBest && styles.bestAnswerCard]}>
                            {ans.isBest && (
                                <View style={styles.bestLabel}>
                                    <MaterialCommunityIcons name="star" size={14} color="#fff" />
                                    <Text style={styles.bestLabelText}>{t('bestAnswer')}</Text>
                                </View>
                            )}
                            <View style={styles.answerHeader}>
                                <Image source={{ uri: ans.owner.avatar }} style={styles.sAvatar} />
                                <Text style={styles.sUsername}>{ans.owner.username}</Text>
                            </View>
                            <Text style={styles.answerText}>{ans.text}</Text>

                            <View style={styles.answerFooter}>
                                <TouchableOpacity
                                    style={[styles.voteButton, hasVoted && styles.votedButton]}
                                    onPress={() => handleVote(ans._id)}
                                >
                                    <MaterialCommunityIcons
                                        name={hasVoted ? "thumb-up" : "thumb-up-outline"}
                                        size={18} color={hasVoted ? "#fff" : "#64748b"}
                                    />
                                    <Text style={[styles.voteText, hasVoted && styles.votedText]}>{ans.voteCount}</Text>
                                </TouchableOpacity>

                                {isOwner && !ans.isBest && (
                                    <TouchableOpacity style={styles.bestBtn} onPress={() => handleSetBest(ans._id)}>
                                        <Text style={styles.bestBtnText}>{t('markAsBest')}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    );
                })}

                <View style={{ height: 100 }} />
            </ScrollView>

            <View style={styles.inputBar}>
                <TextInput
                    style={styles.textInput}
                    placeholder={t('submitAnswer')}
                    multiline
                    value={answerText}
                    onChangeText={setAnswerText}
                />
                <TouchableOpacity
                    style={[styles.sendBtn, !answerText.trim() && styles.sendBtnDisabled]}
                    onPress={submitAnswer}
                    disabled={submitting || !answerText.trim()}
                >
                    {submitting ? <ActivityIndicator size="small" color="#fff" /> : <MaterialCommunityIcons name="send" size={24} color="#fff" />}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    scrollContent: { padding: 16, paddingTop: 60 },
    questionCard: {
        backgroundColor: '#fff', borderRadius: 28, padding: 22, marginBottom: 24,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, elevation: 2,
        borderWidth: 1, borderColor: '#f1f5f9'
    },
    authorRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 22 },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f8fafc' },
    username: { fontSize: 17, fontWeight: '800', color: '#1e293b' },
    date: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
    title: { fontSize: 24, fontWeight: '800', color: '#1e293b', marginBottom: 14, lineHeight: 32 },
    description: { fontSize: 16, color: '#475569', lineHeight: 26, marginBottom: 22 },
    qImage: { width: '100%', height: 260, borderRadius: 24, marginBottom: 10 },
    sectionHeader: { fontSize: 19, fontWeight: '800', color: '#1e293b', marginBottom: 18, marginLeft: 6 },
    answerCard: {
        backgroundColor: '#fff', borderRadius: 24, padding: 18, marginBottom: 16,
        borderWidth: 1, borderColor: '#f1f5f9',
        shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 1
    },
    bestAnswerCard: { borderColor: '#2d6a4f', borderWidth: 2, backgroundColor: '#f0fdf4' },
    bestLabel: {
        position: 'absolute', top: -14, right: 20, backgroundColor: '#2d6a4f',
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14,
        shadowColor: '#2d6a4f', shadowOpacity: 0.2, shadowRadius: 5
    },
    bestLabelText: { color: '#fff', fontSize: 12, fontWeight: '800' },
    answerHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    sAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f8fafc' },
    sUsername: { fontSize: 15, fontWeight: '700', color: '#334155' },
    answerText: { fontSize: 15, color: '#334155', lineHeight: 24, marginBottom: 18 },
    answerFooter: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 14
    },
    voteButton: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#f8fafc', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14,
        borderWidth: 1, borderColor: '#edf2f7'
    },
    votedButton: { backgroundColor: '#2d6a4f', borderColor: '#2d6a4f' },
    voteText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
    votedText: { color: '#fff' },
    bestBtn: { padding: 6 },
    bestBtnText: { color: '#2d6a4f', fontSize: 14, fontWeight: '800' },
    inputBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center',
        padding: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05, shadowRadius: 10, elevation: 5
    },
    textInput: {
        flex: 1, backgroundColor: '#f8fafc', borderRadius: 25,
        paddingHorizontal: 20, paddingVertical: 12, maxHeight: 120,
        fontSize: 16, color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0'
    },
    sendBtn: {
        backgroundColor: '#2d6a4f', width: 48, height: 48, borderRadius: 24,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#2d6a4f', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
    },
    sendBtnDisabled: { backgroundColor: '#cbd5e1', shadowOpacity: 0, elevation: 0 }
});
