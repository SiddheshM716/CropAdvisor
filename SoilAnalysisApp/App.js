import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { AppProvider, useAppContext } from './context/AppContext';

// Screens
import HomeScreen from './screens/HomeScreen';
import SoilAnalyzerScreen from './screens/SoilAnalyzerScreen';
import PlantDiseaseScreen from './screens/PlantDiseaseScreen';
import MarketPriceScreen from './screens/MarketPriceScreen';
import NewsScreen from './screens/NewsScreen';
import WeatherScreen from './screens/WeatherScreen';
import LanguageScreen from './screens/LanguageScreen';
import CommunityScreen from './screens/CommunityScreen';
import QuestionDetailScreen from './screens/QuestionDetailScreen';
import PostQuestionScreen from './screens/PostQuestionScreen';
import AuthScreen from './screens/AuthScreen';
import ChatbotScreen from './screens/ChatbotScreen';
import ProfileScreen from './screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
    const { t } = useAppContext();
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: '#fff' },
                headerShadowVisible: false,
                headerTintColor: '#2c3e50',
                headerTitleStyle: { fontWeight: '700', fontSize: 18 },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SoilAnalyzer" component={SoilAnalyzerScreen} options={{ title: t('soilAnalyzerTitle'), headerBackTitle: t('back') }} />
            <Stack.Screen name="PlantDisease" component={PlantDiseaseScreen} options={{ title: t('diseaseDetectorTitle'), headerBackTitle: t('back') }} />
            <Stack.Screen name="MarketPrice" component={MarketPriceScreen} options={{ title: t('marketPrices'), headerBackTitle: t('back') }} />
            <Stack.Screen name="News" component={NewsScreen} options={{ title: t('agriNews'), headerBackTitle: t('back') }} />
            <Stack.Screen name="Weather" component={WeatherScreen} options={{ title: t('weatherAdvisory'), headerBackTitle: t('back') }} />
            <Stack.Screen name="Chatbot" component={ChatbotScreen} options={{ title: t('agriChatbot'), headerBackTitle: t('back') }} />
            <Stack.Screen name="Language" component={LanguageScreen} options={{ title: t('selectLanguage'), headerBackTitle: t('back') }} />
        </Stack.Navigator>
    );
}

function CommunityStack() {
    const { t } = useAppContext();
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: '#fff' },
                headerShadowVisible: false,
                headerTintColor: '#2c3e50',
                headerTitleStyle: { fontWeight: '700', fontSize: 18 },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="CommunityMain" component={CommunityScreen} options={{ headerShown: false }} />
            <Stack.Screen name="QuestionDetail" component={QuestionDetailScreen} options={{ title: t('community'), headerBackTitle: t('back') }} />
        </Stack.Navigator>
    );
}

function MainTabs() {
    const { t } = useAppContext();
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    let iconName;
                    if (route.name === 'Home') iconName = 'home-variant';
                    else if (route.name === 'Community') iconName = 'account-group';
                    else if (route.name === 'Profile') iconName = 'account-circle';
                    return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#2d6a4f',
                tabBarInactiveTintColor: '#94a3b8',
                tabBarStyle: {
                    height: Platform.OS === 'ios' ? 95 : 78,
                    paddingTop: 12,
                    paddingBottom: Platform.OS === 'ios' ? 35 : 18,
                    backgroundColor: '#fff',
                    borderTopWidth: 1,
                    borderTopColor: '#f1f5f9',
                },
                headerShown: false,
            })}
        >
            <Tab.Screen name="Home" component={HomeStack} />
            <Tab.Screen name="Community" component={CommunityStack} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

function AppContent() {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_bottom' }}>
                <Stack.Screen name="Main" component={MainTabs} />
                <Stack.Screen name="PostQuestion" component={PostQuestionScreen} options={{ presentation: 'modal' }} />
                <Stack.Screen name="Auth" component={AuthScreen} options={{ presentation: 'modal' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default function App() {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
}

