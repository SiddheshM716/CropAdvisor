import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet, Text, View, TextInput, TouchableOpacity,
    FlatList, ActivityIndicator, KeyboardAvoidingView,
    Platform, SafeAreaView, Keyboard, Alert
} from 'react-native';
import axios from 'axios';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import Voice from '@react-native-voice/voice';

const GEMINI_KEY = 'AIzaSyAODjx2_w_T1xfvboZOnOife2WMPCyEMao';
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

// Language mapping for TTS
const LANG_MAP = {
    en: 'en-IN',
    hi: 'hi-IN',
    mr: 'mr-IN',
    ta: 'ta-IN',
    te: 'te-IN'
};

export default function ChatbotScreen() {
    const { t, language } = useAppContext();
    const [messages, setMessages] = useState([
        {
            id: '1',
            text: t('welcome') || 'Hello! I am your AI Agri Assistant. How can I help you with your crops today?',
            sender: 'bot',
            time: new Date()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [autoSpeak, setAutoSpeak] = useState(true);
    const flatListRef = useRef();

    useEffect(() => {
        Voice.onSpeechStart = () => setIsListening(true);
        Voice.onSpeechEnd = () => setIsListening(false);
        Voice.onSpeechError = (e) => {
            console.log('Speech Error:', e);
            setIsListening(false);
        };
        Voice.onSpeechResults = (e) => {
            if (e.value && e.value.length > 0) {
                setInputText(e.value[0]);
            }
        };

        return () => {
            Voice.destroy().then(Voice.removeAllListeners);
        };
    }, []);

    const toggleListening = async () => {
        if (isListening) {
            try {
                await Voice.stop();
            } catch (e) {
                console.error(e);
            }
        } else {
            try {
                setInputText('');
                await Voice.start(LANG_MAP[language] || 'en-IN');
            } catch (e) {
                console.error(e);
                Alert.alert('Error', 'Microphone error. Please check permissions.');
            }
        }
    };

    const speak = (text) => {
        if (!autoSpeak) return;
        Speech.stop();
        Speech.speak(text, {
            language: LANG_MAP[language] || 'en-IN',
            pitch: 1.0,
            rate: 0.9,
        });
    };

    const sendMessage = async (textToUse = inputText) => {
        const text = textToUse.trim();
        if (!text || loading) return;

        const userMsg = {
            id: Date.now().toString(),
            text: text,
            sender: 'user',
            time: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setLoading(true);

        try {
            const prompt = `
                You are a professional agronomist and agriculture expert. 
                Answer the following question from a farmer. 
                Keep your answer practical, accurate, and helpful.
                If the question is not related to agriculture, farming, crops, or soil, politely inform the user that you can only answer agriculture-related questions.
                
                Current Language: ${language}
                Question: ${text}
            `;

            const response = await axios.post(API_URL, {
                contents: [{ parts: [{ text: prompt }] }]
            });

            const botText = response.data.candidates[0].content.parts[0].text;

            const botMsg = {
                id: (Date.now() + 1).toString(),
                text: botText,
                sender: 'bot',
                time: new Date()
            };

            setMessages(prev => [...prev, botMsg]);
            speak(botText); // AI Speaks back
        } catch (error) {
            console.error('Chatbot error:', error);
            const errorMsg = 'Sorry, I encountered an error. Please try again later.';
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: errorMsg,
                sender: 'bot',
                time: new Date()
            }]);
            speak(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
        }
    }, [messages]);

    const renderMessage = ({ item }) => (
        <View style={[
            styles.messageWrapper,
            item.sender === 'user' ? styles.userWrapper : styles.botWrapper
        ]}>
            <View style={[
                styles.messageBubble,
                item.sender === 'user' ? styles.userBubble : styles.botBubble
            ]}>
                <Text style={[
                    styles.messageText,
                    item.sender === 'user' ? styles.userText : styles.botText
                ]}>
                    {item.text}
                </Text>
            </View>
            <Text style={styles.timeText}>
                {item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 100}
            >
                {/* Header with audio toggle */}
                <View style={styles.chatHeader}>
                    <Text style={styles.headerTitle}>{t('agriChatbot')}</Text>
                    <TouchableOpacity
                        style={[styles.audioToggle, !autoSpeak && styles.audioToggleOff]}
                        onPress={() => setAutoSpeak(!autoSpeak)}
                    >
                        <MaterialCommunityIcons
                            name={autoSpeak ? "volume-high" : "volume-off"}
                            size={20}
                            color={autoSpeak ? "#1b4332" : "#94a3b8"}
                        />
                    </TouchableOpacity>
                </View>

                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
                />

                {loading && (
                    <View style={styles.loadingIndicator}>
                        <ActivityIndicator color="#2d6a4f" size="small" />
                        <Text style={styles.loadingLabel}>AI is thinking...</Text>
                    </View>
                )}

                {isListening && (
                    <View style={styles.listeningOverlay}>
                        <ActivityIndicator color="#ef4444" size="small" />
                        <Text style={styles.listeningText}>{t('listening')}</Text>
                    </View>
                )}

                <View style={styles.inputArea}>
                    <View style={styles.inputRow}>
                        <TouchableOpacity
                            style={[styles.voiceBtn, isListening && styles.voiceBtnActive]}
                            onPress={toggleListening}
                        >
                            <MaterialCommunityIcons
                                name={isListening ? "microphone" : "microphone-outline"}
                                size={24}
                                color={isListening ? "#fff" : "#2d6a4f"}
                            />
                        </TouchableOpacity>

                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder={t('chatPlaceholder')}
                                value={inputText}
                                onChangeText={setInputText}
                                multiline
                                maxHeight={100}
                            />
                            <TouchableOpacity
                                style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                                onPress={() => sendMessage()}
                                disabled={!inputText.trim() || loading || isListening}
                            >
                                <MaterialCommunityIcons name="send" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1b4332' },
    audioToggle: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center',
    },
    audioToggleOff: { backgroundColor: '#f1f5f9' },
    listContent: { padding: 20, paddingBottom: 10 },
    messageWrapper: { marginBottom: 15, maxWidth: '85%' },
    userWrapper: { alignSelf: 'flex-end' },
    botWrapper: { alignSelf: 'flex-start' },
    messageBubble: {
        padding: 14,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    userBubble: {
        backgroundColor: '#2d6a4f',
        borderBottomRightRadius: 4,
    },
    botBubble: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    messageText: { fontSize: 15, lineHeight: 22 },
    userText: { color: '#fff' },
    botText: { color: '#1e293b' },
    timeText: { fontSize: 10, color: '#94a3b8', marginTop: 4, alignSelf: 'flex-end' },
    loadingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
        marginBottom: 10
    },
    loadingLabel: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic' },
    listeningOverlay: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#fef2f2',
        paddingVertical: 8,
        marginHorizontal: 20,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#fee2e2'
    },
    listeningText: { color: '#ef4444', fontWeight: '700', fontSize: 13 },
    inputArea: {
        padding: 15,
        paddingBottom: Platform.OS === 'ios' ? 30 : 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9'
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    voiceBtn: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#dcfce7'
    },
    voiceBtnActive: {
        backgroundColor: '#ef4444', borderColor: '#fee2e2'
    },
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#f8fafc',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#1e293b',
        paddingVertical: Platform.OS === 'ios' ? 10 : 5
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1b4332',
        justifyContent: 'center',
        alignItems: 'center'
    },
    sendBtnDisabled: {
        backgroundColor: '#cbd5e1'
    }
});
