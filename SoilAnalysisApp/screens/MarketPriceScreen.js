import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    StyleSheet, Text, View, TextInput, TouchableOpacity,
    FlatList, ActivityIndicator, SafeAreaView, ScrollView,
    Keyboard, Platform
} from 'react-native';
import axios from 'axios';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';

const API_KEY = '579b464db66ec23bdd000001becc074eb8df4b75576e8ffa2d82d7f7';
const RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
const BASE_URL = `https://api.data.gov.in/resource/${RESOURCE_ID}`;

const COMMODITY_SUGGESTIONS = [
    'Tomato', 'Potato', 'Onion', 'Rice', 'Wheat', 'Maize', 'Cotton',
    'Soyabean', 'Mustard', 'Groundnut', 'Turmeric', 'Chilli', 'Garlic',
    'Cabbage', 'Cauliflower', 'Brinjal', 'Banana', 'Mango', 'Grapes',
    'Apple', 'Papaya', 'Pomegranate', 'Ginger', 'Cumin', 'Bajra', 'Jowar',
];

const STATE_OPTIONS = [
    'All States', 'Andhra Pradesh', 'Bihar', 'Gujarat', 'Haryana',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Punjab',
    'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal',
];

export default function MarketPriceScreen() {
    const { t } = useAppContext();
    const [query, setQuery] = useState('');
    const [selectedState, setSelectedState] = useState('All States');
    const [districtQuery, setDistrictQuery] = useState('');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showStateFilter, setShowStateFilter] = useState(false);
    const [searched, setSearched] = useState(false);

    const fetchPrices = useCallback(async (commodity, state, district) => {
        if (!commodity.trim()) return;
        setLoading(true);
        setError(null);
        setShowSuggestions(false);
        setSearched(true);
        Keyboard.dismiss();

        try {
            const params = {
                'api-key': API_KEY,
                format: 'json',
                limit: 50,
                'filters[commodity]': commodity.trim(),
            };
            if (state && state !== 'All States') {
                params['filters[state]'] = state;
            }
            if (district && district.trim()) {
                params['filters[district]'] = district.trim();
            }

            const res = await axios.get(BASE_URL, { params });
            const data = res.data;
            if (data.records && data.records.length > 0) {
                const sorted = [...data.records].sort((a, b) => {
                    const toDate = (s) => {
                        if (!s) return 0;
                        const [d, m, y] = s.replace(/\//g, '-').split('-');
                        return new Date(`${y}-${m}-${d}`);
                    };
                    return toDate(b.arrival_date) - toDate(a.arrival_date);
                });
                setRecords(sorted);
            } else {
                setRecords([]);
            }
        } catch (e) {
            console.error(e);
            setError(t('error'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    const handleQueryChange = (text) => {
        setQuery(text);
        if (text.length > 0) {
            const filtered = COMMODITY_SUGGESTIONS.filter(s =>
                s.toLowerCase().startsWith(text.toLowerCase())
            );
            setSuggestions(filtered.slice(0, 6));
            setShowSuggestions(filtered.length > 0);
        } else {
            setShowSuggestions(false);
            setSuggestions([]);
        }
    };

    const handleSuggestionPress = (item) => {
        setQuery(item);
        setShowSuggestions(false);
        fetchPrices(item, selectedState, districtQuery);
    };

    const handleSearch = () => fetchPrices(query, selectedState, districtQuery);

    const handleStateSelect = (state) => {
        setSelectedState(state);
        setShowStateFilter(false);
        if (searched && query) fetchPrices(query, state, districtQuery);
    };

    const clearFilters = () => {
        setSelectedState('All States');
        setDistrictQuery('');
        if (searched && query) fetchPrices(query, 'All States', '');
    };

    const formatPrice = (p) => {
        const n = parseFloat(p);
        if (isNaN(n)) return '—';
        return `₹${n.toLocaleString('en-IN')}`;
    };

    const formatDate = (d) => d ? d.replace(/\//g, ' / ') : '—';

    const renderItem = ({ item, index }) => (
        <View style={[styles.card, index === 0 && styles.firstCard]}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.commodityName}>{item.commodity}</Text>
                    <Text style={styles.varietyText}>{item.variety}{item.grade ? ` · ${item.grade}` : ''}</Text>
                </View>
                <View style={styles.dateBadge}>
                    <MaterialCommunityIcons name="calendar-outline" size={12} color="#7f8c8d" />
                    <Text style={styles.dateText}>{formatDate(item.arrival_date)}</Text>
                </View>
            </View>

            <View style={styles.locationRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={14} color="#95a5a6" />
                <Text style={styles.locationText}>{item.market}, {item.district}, {item.state}</Text>
            </View>

            <View style={styles.priceRow}>
                <View style={styles.priceBox}>
                    <Text style={styles.priceLabel}>{t('minPrice')}</Text>
                    <Text style={[styles.priceValue, { color: '#2d6a4f' }]}>{formatPrice(item.min_price)}</Text>
                </View>
                <View style={[styles.priceBox, styles.priceBoxModal]}>
                    <Text style={styles.priceLabel}>{t('modalPrice')}</Text>
                    <Text style={[styles.priceValue, styles.modalPrice]}>{formatPrice(item.modal_price)}</Text>
                </View>
                <View style={styles.priceBox}>
                    <Text style={styles.priceLabel}>{t('maxPrice')}</Text>
                    <Text style={[styles.priceValue, { color: '#ef4444' }]}>{formatPrice(item.max_price)}</Text>
                </View>
            </View>
            <Text style={styles.perQuintal}>{t('perQuintal')}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <MaterialCommunityIcons name="magnify" size={22} color="#7f8c8d" style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('searchCommodity')}
                        placeholderTextColor="#bdc3c7"
                        value={query}
                        onChangeText={handleQueryChange}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                        autoCapitalize="words"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => { setQuery(''); setSuggestions([]); setShowSuggestions(false); }}>
                            <MaterialCommunityIcons name="close-circle" size={20} color="#bdc3c7" />
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                    <Text style={styles.searchBtnText}>{t('search')}</Text>
                </TouchableOpacity>
            </View>

            {/* Suggestions Dropdown */}
            {showSuggestions && (
                <View style={styles.suggestionsBox}>
                    {suggestions.map((s) => (
                        <TouchableOpacity key={s} style={styles.suggestionItem} onPress={() => handleSuggestionPress(s)}>
                            <MaterialCommunityIcons name="sprout-outline" size={16} color="#2ecc71" />
                            <Text style={styles.suggestionText}>{s}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Filter Section */}
            <View style={styles.filterSection}>
                <View style={styles.filterRow}>
                    <TouchableOpacity style={styles.filterChip} onPress={() => setShowStateFilter(v => !v)}>
                        <MaterialCommunityIcons name="bank-outline" size={16} color="#2d6a4f" />
                        <Text style={styles.filterChipText} numberOfLines={1}>{selectedState === 'All States' ? t('allStates') : selectedState}</Text>
                        <MaterialCommunityIcons name={showStateFilter ? 'chevron-up' : 'chevron-down'} size={16} color="#2d6a4f" />
                    </TouchableOpacity>

                    <View style={styles.districtInputContainer}>
                        <MaterialCommunityIcons name="map-marker-outline" size={16} color="#95a5a6" />
                        <TextInput
                            style={styles.districtInput}
                            placeholder={t('district')}
                            placeholderTextColor="#bdc3c7"
                            value={districtQuery}
                            onChangeText={setDistrictQuery}
                            onSubmitEditing={handleSearch}
                        />
                    </View>

                    {(selectedState !== 'All States' || districtQuery) && (
                        <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
                            <MaterialCommunityIcons name="filter-remove" size={18} color="#e74c3c" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {showStateFilter && (
                <View style={styles.stateDropdown}>
                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true}>
                        {STATE_OPTIONS.map((s) => (
                            <TouchableOpacity
                                key={s}
                                style={[styles.stateOption, selectedState === s && styles.stateOptionSelected]}
                                onPress={() => handleStateSelect(s)}
                            >
                                <Text style={[styles.stateOptionText, selectedState === s && styles.stateOptionTextSelected]}>
                                    {s === 'All States' ? t('allStates') : s}
                                </Text>
                                {selectedState === s && <MaterialCommunityIcons name="check" size={16} color="#2d6a4f" />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Content */}
            {loading && (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="#2ecc71" />
                    <Text style={styles.loadingText}>{t('fetchingPrices')}</Text>
                </View>
            )}

            {error && !loading && (
                <View style={styles.centerBox}>
                    <MaterialCommunityIcons name="wifi-off" size={40} color="#e74c3c" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {!loading && !error && searched && records.length === 0 && (
                <View style={styles.centerBox}>
                    <MaterialCommunityIcons name="emoticon-sad-outline" size={48} color="#bdc3c7" />
                    <Text style={styles.emptyText}>{t('noResultsFor')} "{query}"</Text>
                    <Text style={styles.emptySubText}>{t('tryDifferent')}</Text>
                </View>
            )}

            {!loading && !searched && (
                <View style={styles.centerBox}>
                    <MaterialCommunityIcons name="store-outline" size={60} color="#d5e8d4" />
                    <Text style={styles.emptyText}>{t('searchForCommodity')}</Text>
                    <Text style={styles.emptySubText}>{t('liveMandiPrices')}</Text>
                    <View style={styles.quickSuggestionsRow}>
                        {['Tomato', 'Onion', 'Wheat', 'Rice'].map(s => (
                            <TouchableOpacity key={s} style={styles.quickChip} onPress={() => handleSuggestionPress(s)}>
                                <Text style={styles.quickChipText}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {!loading && records.length > 0 && (
                <FlatList
                    data={records}
                    keyExtractor={(_, i) => i.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                />
            )}
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa' },

    searchSection: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
        gap: 10,
    },
    searchBar: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#f5f7fa', borderRadius: 12, paddingHorizontal: 12,
        paddingVertical: 10, borderWidth: 1, borderColor: '#e8e8e8',
    },
    searchInput: { flex: 1, fontSize: 15, color: '#2c3e50', padding: 0 },
    searchBtn: {
        backgroundColor: '#1b4332', paddingHorizontal: 18, paddingVertical: 12,
        borderRadius: 12, shadowColor: '#1b4332',
        shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
    },
    searchBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

    suggestionsBox: {
        backgroundColor: '#fff', marginHorizontal: 16, marginTop: 4,
        borderRadius: 12, elevation: 6, shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8,
        zIndex: 100, position: 'absolute', top: 72, left: 0, right: 0,
        borderWidth: 1, borderColor: '#f0f0f0',
    },
    suggestionItem: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingVertical: 12, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: '#f8f9fa',
    },
    suggestionText: { fontSize: 15, color: '#2c3e50', fontWeight: '500' },

    filterRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 10,
    },
    filterChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#f0fdf4', paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 20, borderWidth: 1, borderColor: '#dcfce7',
    },
    filterChipText: { color: '#2d6a4f', fontWeight: '700', fontSize: 13 },
    resultCount: { fontSize: 13, color: '#95a5a6', fontWeight: '500' },

    stateDropdown: {
        backgroundColor: '#fff', marginHorizontal: 16,
        borderRadius: 14, elevation: 8, shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10,
        borderWidth: 1, borderColor: '#f0f0f0', marginBottom: 8, overflow: 'hidden',
    },
    stateOption: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 12, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: '#f8f9fa',
    },
    stateOptionSelected: { backgroundColor: '#f0fdf4' },
    stateOptionText: { fontSize: 14, color: '#2c3e50' },
    stateOptionTextSelected: { color: '#2d6a4f', fontWeight: '700' },

    filterSection: { backgroundColor: '#fff', paddingBottom: 10 },
    districtInputContainer: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#f5f7fa', borderRadius: 20,
        paddingHorizontal: 12, paddingVertical: 6,
        borderWidth: 1, borderColor: '#e8e8e8', gap: 6,
    },
    districtInput: { flex: 1, fontSize: 13, color: '#2c3e50', padding: 0 },
    clearBtn: { padding: 4 },

    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    loadingText: { marginTop: 12, fontSize: 15, color: '#7f8c8d', fontWeight: '500' },
    errorText: { color: '#e74c3c', fontSize: 14, textAlign: 'center', marginTop: 10 },
    emptyText: { fontSize: 17, fontWeight: '700', color: '#2c3e50', marginTop: 16, textAlign: 'center' },
    emptySubText: { fontSize: 13, color: '#95a5a6', marginTop: 6, textAlign: 'center', lineHeight: 20 },

    quickSuggestionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 20 },
    quickChip: {
        backgroundColor: '#e8f8f5', paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: 20, borderWidth: 1, borderColor: '#2ecc71',
    },
    quickChipText: { color: '#27ae60', fontWeight: '600', fontSize: 13 },

    list: { padding: 16, paddingTop: 6, gap: 12 },
    card: {
        backgroundColor: '#fff', borderRadius: 20, padding: 16,
        shadowColor: '#1b4332', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    },
    firstCard: { borderWidth: 1.5, borderColor: 'rgba(45,106,79,0.3)' },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
    commodityName: { fontSize: 17, fontWeight: '800', color: '#2c3e50' },
    varietyText: { fontSize: 12, color: '#95a5a6', marginTop: 2 },
    dateBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#f5f7fa', paddingHorizontal: 8, paddingVertical: 4,
        borderRadius: 8,
    },
    dateText: { fontSize: 11, color: '#7f8c8d', fontWeight: '500' },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 14 },
    locationText: { fontSize: 12, color: '#95a5a6', flex: 1, lineHeight: 16 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
    priceBox: { flex: 1, alignItems: 'center' },
    priceBoxModal: {
        borderLeftWidth: 1, borderRightWidth: 1,
        borderColor: '#f0f0f0', paddingHorizontal: 8,
    },
    priceLabel: { fontSize: 11, color: '#95a5a6', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
    priceValue: { fontSize: 18, fontWeight: '800' },
    modalPrice: { color: '#2c3e50', fontSize: 20 },
    perQuintal: { fontSize: 10, color: '#bdc3c7', textAlign: 'center', marginTop: 6, fontWeight: '500' },
});
