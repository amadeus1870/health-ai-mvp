import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, TextInput, TouchableOpacity, FlatList, Platform, ActivityIndicator, Keyboard, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { ChatService, ChatMessage } from '../../services/ChatService';
import { BlurView } from 'expo-blur';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Markdown from 'react-native-markdown-display';
import * as Haptics from 'expo-haptics';
import Reanimated, { FadeInDown, Layout } from 'react-native-reanimated';
import TypingIndicator from '../../components/ui/TypingIndicator';
import QuickReplyChips from '../../components/ui/QuickReplyChips';
import i18n from '../../config/i18n';

const markdownStyles = {
    body: {
        color: '#EEE',
        fontFamily: Typography.fontFamily.regular,
        fontSize: 15,
        lineHeight: 22,
    },
    strong: {
        fontFamily: Typography.fontFamily.bold,
        color: '#FFF',
        fontWeight: 'bold' as 'bold',
    },
    bullet_list: {
        marginBottom: 8,
    },
    paragraph: {
        marginBottom: 10,
        marginTop: 0,
    },
};

// Animated Message Component to isolate animation logic
const AnimatedMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
        <Reanimated.View
            entering={FadeInDown.duration(300).springify()}
            layout={Layout.springify()}
            style={[
                styles.messageRow,
                isUser ? styles.userRow : styles.aiRow
            ]}
        >
            {!isUser && (
                <View style={styles.aiAvatar}>
                    <Ionicons name="chatbubbles" size={16} color="#FFF" />
                </View>
            )}

            {isUser ? (
                <View style={[styles.messageBubble, styles.userBubble]}>
                    <Text style={[styles.messageText, styles.userText]}>
                        {item.content}
                    </Text>
                </View>
            ) : (
                <BlurView
                    intensity={60}
                    tint="dark"
                    style={[styles.messageBubble, styles.aiBubble]}
                    experimentalBlurMethod='dimezisBlurView'
                >
                    <Markdown style={markdownStyles}>
                        {item.content}
                    </Markdown>
                </BlurView>
            )}
        </Reanimated.View>
    );
};

import { useLanguage } from '../../context/LanguageContext';

import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChatScreen() {
    const { language } = useLanguage();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const insets = useSafeAreaInsets();

    // Manual Keyboard Handling
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const tabBarHeight = useBottomTabBarHeight() || 85;

    // Animation for smooth transition
    // User requested to move down by 10px total (9 + 1) => Subtract 10 from tabBarHeight padding
    const restingPadding = tabBarHeight - 10;
    const paddingBottomAnim = useRef(new Animated.Value(restingPadding)).current;

    useEffect(() => {
        // Initial padding
        paddingBottomAnim.setValue(restingPadding);

        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const keyboardShowSub = Keyboard.addListener(showEvent, (e) => {
            const height = e.endCoordinates.height;
            setKeyboardHeight(height);

            Animated.timing(paddingBottomAnim, {
                toValue: height + 5, // Keyboard height + 5px offset
                duration: e.duration || 250,
                useNativeDriver: false,
            }).start();
        });

        const keyboardHideSub = Keyboard.addListener(hideEvent, (e) => {
            setKeyboardHeight(0);
            Animated.timing(paddingBottomAnim, {
                toValue: restingPadding, // Return to Adjusted TabBar padding
                duration: e.duration || 250,
                useNativeDriver: false,
            }).start();
        });

        return () => {
            keyboardShowSub.remove();
            keyboardHideSub.remove();
        };
    }, [tabBarHeight]);

    // Load Chat History
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const stored = await AsyncStorage.getItem('chat_history_v1');
                if (stored) {
                    setMessages(JSON.parse(stored));
                } else {
                    // Initial Greeting if no history
                    setMessages([
                        {
                            id: 'welcome',
                            role: 'assistant',
                            content: i18n.t('chat.welcome'),
                            timestamp: new Date()
                        }
                    ]);
                }
            } catch (e) {
                console.error("Failed to load chat history", e);
            }
        };
        loadHistory();
    }, []);

    // Save Chat History whenever messages change
    useEffect(() => {
        if (messages.length > 0) {
            AsyncStorage.setItem('chat_history_v1', JSON.stringify(messages)).catch(e => console.error("Failed to save chat", e));
        }
    }, [messages]);

    // Update Welcome Message Language if it's the only message
    useEffect(() => {
        if (messages.length === 1 && messages[0].id === 'welcome') {
            setMessages([
                {
                    id: 'welcome',
                    role: 'assistant',
                    content: i18n.t('chat.welcome'),
                    timestamp: new Date()
                }
            ]);
        }
    }, [language]);

    const handleSend = async () => {
        if (!inputText.trim()) return;

        // Haptic Feedback on Send
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: inputText.trim(),
            timestamp: new Date(),
        };

        const newHistory = [...messages, userMsg];
        setMessages(newHistory);
        setInputText('');
        setIsTyping(true);

        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            const responseText = await ChatService.generateResponse(userMsg.content, messages, language);

            // Haptic Feedback on Receive
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: responseText,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error("Chat Error", error);
            const errorMsg: ChatMessage = {
                id: Date.now().toString(),
                role: 'assistant',
                content: i18n.t('chat.error'),
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        return <AnimatedMessage item={item} />;
    };

    // ... remainder of file

    return (
        <ImageBackground
            key={language}
            source={require('../../assets/images/custom_bg.jpg')}
            style={styles.container}
            resizeMode="cover"
        >
            <View style={[styles.safeArea, { paddingTop: insets.top }]}>
                <Animated.View style={{ flex: 1, paddingBottom: paddingBottomAnim }}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{i18n.t('chat.title')}</Text>
                        <View style={styles.onlineBadge}>
                            <View style={styles.dot} />
                            <Text style={styles.onlineText}>{i18n.t('chat.online')}</Text>
                        </View>
                    </View>

                    {/* Messages List */}
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        style={{ flex: 1 }}
                    />

                    {/* Typing Indicator */}
                    {isTyping && (
                        <View style={styles.typingContainer}>
                            <TypingIndicator />
                        </View>
                    )}

                    {/* Quick Replies */}
                    <QuickReplyChips
                        visible={!isTyping && messages.length > 0}
                        onSelect={(text) => {
                            setInputText(text);
                            // Optional: auto-send after a small delay or immediately
                            // For now, just set text. User can press send.
                            // Actually, premium UX is tap -> send.
                            // Let's implement immediate send logic in a wrapper or change handleSend to accept arg.
                        }}
                    />

                    {/* Input Area */}
                    <BlurView intensity={80} tint="dark" style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder={i18n.t('chat.placeholder')}
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            style={[
                                styles.sendButton,
                                !inputText.trim() && styles.sendButtonDisabled
                            ]}
                            onPress={handleSend}
                            disabled={!inputText.trim() || isTyping}
                        >
                            {isTyping ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <Ionicons name="send" size={20} color="#FFF" />
                            )}
                        </TouchableOpacity>
                    </BlurView>
                </Animated.View>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: Typography.fontFamily.bold,
        color: '#FFF',
    },
    onlineBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: 'rgba(46, 204, 113, 0.2)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(46, 204, 113, 0.5)',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#2ecc71',
        marginRight: 6,
    },
    onlineText: {
        fontSize: 12,
        color: '#2ecc71',
        fontFamily: Typography.fontFamily.medium,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 20,
    },
    messageRow: {
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    userRow: {
        justifyContent: 'flex-end',
    },
    aiRow: {
        justifyContent: 'flex-start',
    },
    aiAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 20,
    },
    userBubble: {
        backgroundColor: Colors.primary,
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        backgroundColor: 'transparent',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        overflow: 'hidden',
    },
    messageText: {
        fontSize: 15,
        fontFamily: Typography.fontFamily.regular,
        lineHeight: 22,
    },
    userText: {
        color: '#FFF',
    },
    aiText: {
        color: '#EEE',
    },
    typingContainer: {
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    typingText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        fontStyle: 'italic',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center', // Centered vertically
        padding: 12,
        paddingBottom: Platform.OS === 'ios' ? 22 : 22,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
        maxHeight: 100,
        color: '#FFF',
        fontSize: 16,
        fontFamily: Typography.fontFamily.regular,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    sendButtonDisabled: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        opacity: 0.5,
    },
});
