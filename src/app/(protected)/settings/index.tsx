import React, {FC, useEffect, useState} from 'react';
import {
    Button,
    Modal,
    Platform,
    SafeAreaView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import {StatusBar} from "expo-status-bar";
export const KEEP_SCREEN_ON_KEY = 'pref_keep_screen_on';
export const NOTIFICATIONS_KEY = 'pref_notification';
export const HOME_MARKER_KEY = 'pref_home_marker';
const HOME_ADDRESS_KEY = 'pref_home_address';
export const HOME_LAT_KEY = 'pref_home_lat';
export const HOME_LNG_KEY = 'pref_home_lng';

// Load the API key from app.json via Expo Constants
const GEOCODING_API_KEY: string =
    (Constants.expoConfig?.extra as { GEOCODING_API_KEY?: string })
        .GEOCODING_API_KEY || '';

const Settings: FC = (): JSX.Element => {
    const [keepScreenOn, setKeepScreenOn] = useState<boolean>(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
    const [homeMarkerEnabled, setHomeMarkerEnabled] = useState<boolean>(false);
    const [homeAddress, setHomeAddress] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [tempAddress, setTempAddress] = useState<string>('');

    useEffect(() => {
        const loadSettings = async (): Promise<void> => {
            try {
                const keep = await AsyncStorage.getItem(KEEP_SCREEN_ON_KEY);
                if (keep !== null) setKeepScreenOn(JSON.parse(keep));

                const notif = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
                if (notif !== null) setNotificationsEnabled(JSON.parse(notif));

                // if (Platform.OS === 'android') {
                    const marker = await AsyncStorage.getItem(HOME_MARKER_KEY);
                    if (marker !== null) setHomeMarkerEnabled(JSON.parse(marker));

                    const address = await AsyncStorage.getItem(HOME_ADDRESS_KEY);
                    if (address !== null) setHomeAddress(address);
                // }
            } catch (error) {
                console.error('Failed to load settings', error);
            }
        };
        void loadSettings();
    }, []);

    const toggleKeepScreenOn = async (value: boolean): Promise<void> => {
        setKeepScreenOn(value);
        try {
            await AsyncStorage.setItem(KEEP_SCREEN_ON_KEY, JSON.stringify(value));
        } catch (error) {
            console.error('Failed to save keep screen on', error);
        }
    };

    const toggleNotifications = async (value: boolean): Promise<void> => {
        setNotificationsEnabled(value);
        try {
            await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(value));
        } catch (error) {
            console.error('Failed to save notifications', error);
        }
    };

    const toggleHomeMarker = async (value: boolean): Promise<void> => {
        setHomeMarkerEnabled(value);
        try {
            await AsyncStorage.setItem(HOME_MARKER_KEY, JSON.stringify(value));
        } catch (error) {
            console.error('Failed to save home marker', error);
        }
    };

    const geocodeAddress = async (address: string): Promise<boolean> => {
        try {
            if (Platform.OS === 'android') {
                // Request location permission on Android
                const {status} = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setErrorMessage('Location permission denied.');
                    return false;
                }
            }
            // Use device's built-in geocoder
            const results = await Location.geocodeAsync(address);
            if (results && results.length > 0) {
                const {latitude: lat, longitude: lng} = results[0];
                await AsyncStorage.setItem(HOME_LAT_KEY, JSON.stringify(lat));
                await AsyncStorage.setItem(HOME_LNG_KEY, JSON.stringify(lng));
                setErrorMessage(null);
                return true;
            }
            setErrorMessage('Could not geocode the provided address.');
            return false;

        } catch (error) {
            console.error('Geocoding error', error);
            setErrorMessage('Error occurred while geocoding the address.');
            return false;
        }
    };

    const handleSaveAddress = async (): Promise<void> => {
        const success = await geocodeAddress(tempAddress);
        if (success) {
            try {
                await AsyncStorage.setItem(HOME_ADDRESS_KEY, tempAddress);
                setHomeAddress(tempAddress);
                setIsModalVisible(false);
            } catch (error) {
                console.error('Failed to save home address', error);
                setErrorMessage('Failed to save home address.');
            }
        }
    };

    const openAddressModal = (): void => {
        setTempAddress(homeAddress);
        setErrorMessage(null);
        setIsModalVisible(true);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" backgroundColor="#ffffff"/>
            <View style={styles.inner}>
                <View style={styles.row}>
                    <View style={styles.labelColumn}>
                        <Text style={styles.label}>Keep screen on</Text>
                        <Text style={styles.subSummary}>turn off to save battery</Text>
                    </View>
                    <Switch value={keepScreenOn} onValueChange={toggleKeepScreenOn}/>
                </View>

                {/*<View style={styles.row}>*/}
                {/*    <View style={styles.labelColumn}>*/}
                {/*        <Text style={styles.label}>Notifications</Text>*/}
                {/*        <Text style={styles.subSummary}>turn off to save battery</Text>*/}
                {/*    </View>*/}
                {/*    <Switch*/}
                {/*        value={notificationsEnabled}*/}
                {/*        onValueChange={toggleNotifications}*/}
                {/*    />*/}
                {/*</View>*/}

                {/*{Platform.OS === 'android' && (*/}
                    <>
                        <View style={styles.row}>
                            <View style={styles.labelColumn}>
                                <Text style={styles.label}>Home marker</Text>
                                <Text style={styles.subSummary}>show home address on map</Text>
                            </View>
                            <Switch
                                value={homeMarkerEnabled}
                                onValueChange={toggleHomeMarker}
                            />
                        </View>

                        <View style={styles.rowColumn}>
                            <Text style={styles.label}>Home address</Text>
                            <Button
                                title={homeAddress || 'Set Home Address'}
                                onPress={openAddressModal}
                                disabled={!homeMarkerEnabled}
                            />
                        </View>

                        <Modal visible={isModalVisible} transparent animationType="slide">
                            <View style={styles.modalContainer}>
                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle}>Edit Home Address</Text>
                                    <TextInput
                                        style={styles.input}
                                        onChangeText={setTempAddress}
                                        value={tempAddress}
                                        placeholder="Enter your home address"
                                    />
                                    {errorMessage && (
                                        <Text style={styles.error}>{errorMessage}</Text>
                                    )}
                                    <View style={styles.modalButtons}>
                                        <Button
                                            title="Cancel"
                                            onPress={() => setIsModalVisible(false)}
                                        />
                                        <Button title="Save" onPress={handleSaveAddress}/>
                                    </View>
                                </View>
                            </View>
                        </Modal>
                    </>
                {/*)}*/}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    inner: {
        padding: 20,
    },
    header: {
        fontSize: 24,
        marginBottom: 24,
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    rowColumn: {
        flexDirection: 'column',
        marginBottom: 20,
    },
    labelColumn: {
        flexDirection: 'column',
    },
    label: {
        fontSize: 16,
        marginBottom: 2,
    },
    subSummary: {
        fontSize: 12,
        color: '#666',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        padding: 10,
        fontSize: 16,
        marginBottom: 12,
    },
    error: {
        color: 'red',
        marginBottom: 12,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        margin: 20,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 8,
    },
    modalTitle: {
        fontSize: 18,
        marginBottom: 12,
        fontWeight: '500',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
});

export default Settings;
