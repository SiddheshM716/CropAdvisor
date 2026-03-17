import React from 'react';
import {
    StyleSheet, Text, View, TouchableOpacity,
    SafeAreaView, ScrollView, Image, Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen({ navigation }) {
    const { t, user, logout } = useAppContext();

    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.guestContainer}>
                    <View style={styles.guestIconBox}>
                        <MaterialCommunityIcons name="account-circle-outline" size={80} color="#2d6a4f" />
                    </View>
                    <Text style={styles.guestTitle}>{t('welcomeGuest') || 'Welcome to FarmAssist'}</Text>
                    <Text style={styles.guestSub}>{t('loginToSeeProfile') || 'Log in to manage your profile and see your activities.'}</Text>
                    <TouchableOpacity
                        style={styles.loginBtn}
                        onPress={() => navigation.navigate('Auth')}
                    >
                        <Text style={styles.loginBtnText}>{t('login')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const ProfileItem = ({ icon, label, value, color = '#2d6a4f' }) => (
        <View style={styles.item}>
            <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                <MaterialCommunityIcons name={icon} size={22} color={color} />
            </View>
            <View style={styles.itemContent}>
                <Text style={styles.itemLabel}>{label}</Text>
                <Text style={styles.itemValue}>{value || 'Not provided'}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header Section */}
                <LinearGradient
                    colors={['#1b4332', '#2d6a4f']}
                    style={styles.header}
                >
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=40916c&color=fff&size=150` }}
                            style={styles.avatar}
                        />
                        <TouchableOpacity style={styles.editAvatarBtn}>
                            <MaterialCommunityIcons name="camera" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>{user.username}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statNum}>12</Text>
                            <Text style={styles.statLabel}>{t('questions') || 'Questions'}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statNum}>4</Text>
                            <Text style={styles.statLabel}>{t('analyses') || 'Analyses'}</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Details Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('Personal Info') || 'Personal Information'}</Text>
                    <View style={styles.card}>
                        <ProfileItem
                            icon="phone"
                            label={t('phoneNumber') || 'Phone Number'}
                            value={user.phoneNumber}
                            color="#3b82f6" // Sky blue
                        />
                        <View style={styles.divider} />
                        <ProfileItem
                            icon="map-marker"
                            label={t('location') || 'Location'}
                            value={user.location?.address || 'GPS Location'}
                            color="#f59e0b" // Amber
                        />
                    </View>
                </View>

                {/* Settings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('settings') || 'Preferences'}</Text>
                    <View style={styles.card}>
                        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Language')}>
                            <View style={styles.menuLeft}>
                                <View style={[styles.iconBox, { backgroundColor: '#f1f5f9' }]}>
                                    <MaterialCommunityIcons name="translate" size={22} color="#475569" />
                                </View>
                                <Text style={styles.menuText}>{t('selectLanguage')}</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={20} color="#94a3b8" />
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.menuItem}>
                            <View style={styles.menuLeft}>
                                <View style={[styles.iconBox, { backgroundColor: '#fef2f2' }]}>
                                    <MaterialCommunityIcons name="bell-outline" size={22} color="#ef4444" />
                                </View>
                                <Text style={styles.menuText}>{t('notifications') || 'Notifications'}</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                    <MaterialCommunityIcons name="logout" size={22} color="#ef4444" />
                    <Text style={styles.logoutText}>{t('logout')}</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        paddingTop: 40,
        paddingBottom: 30,
        alignItems: 'center',
        borderBottomLeftRadius: 35,
        borderBottomRightRadius: 35,
        shadowColor: '#1b4332',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
    },
    avatarContainer: {
        marginBottom: 15,
        position: 'relative',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#40916c',
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#1b4332',
    },
    userName: { color: '#fff', fontSize: 24, fontWeight: '800' },
    userEmail: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 },
    statsRow: {
        flexDirection: 'row',
        marginTop: 25,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    statBox: { alignItems: 'center', paddingHorizontal: 15 },
    statNum: { color: '#fff', fontSize: 18, fontWeight: '800' },
    statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
    statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', height: '70%', alignSelf: 'center' },

    section: { paddingHorizontal: 20, marginTop: 30 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    itemContent: { flex: 1, justifyContent: 'center' },
    itemLabel: { fontSize: 13, color: '#64748b', fontWeight: '500' },
    itemValue: { fontSize: 16, color: '#0f172a', fontWeight: '600', marginTop: 1 },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 58 },

    menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
    menuLeft: { flexDirection: 'row', alignItems: 'center' },
    menuText: { fontSize: 15, color: '#1e293b', fontWeight: '600' },

    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        marginTop: 40,
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#fee2e2',
        gap: 10,
    },
    logoutText: { fontSize: 16, color: '#ef4444', fontWeight: '700' },

    guestContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    guestIconBox: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
    guestTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b', textAlign: 'center' },
    guestSub: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 10, lineHeight: 22 },
    loginBtn: { backgroundColor: '#2d6a4f', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 30, marginTop: 30, shadowColor: '#2d6a4f', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
    loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
