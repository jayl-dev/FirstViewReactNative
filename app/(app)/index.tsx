// app/(app)/index.tsx
import React, {useContext, useEffect, useRef, useState} from 'react'
import {
    View,
    Button,
    Text,
    Platform,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    FlatList,
    SafeAreaView
} from 'react-native'
import {AuthContext} from '../_layout'
import {useRouter} from 'expo-router'
import MapView, {LatLng, Marker, Region} from 'react-native-maps';
import {FirstViewService} from "@/api/FirstViewClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {MaterialIcons} from '@expo/vector-icons';

const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
};

// Convert hash to HSL color string
const getHslColor = (name: string) => {
    const hue = Math.abs(hashCode(name)) % 360;
    return `hsl(${hue}, 100%, 50%)`;
};


interface LocationMarker {
    lat: number;
    lng: number;
    studentName?: string;
    route?: string;
    bearing?: number
    text?: string,
    name?: string,
    id?: string,
}

export default function Home() {
    const {signOut} = useContext(AuthContext)
    const router = useRouter()
    const mapRef = useRef<MapView | null>(null);
    const [home, setHome] = useState(null as LocationMarker | null);
    const [showHome, setShowHome] = useState(false);
    const [stops, setStops] = useState(Array<LocationMarker>);
    const [buses, setBuses] = useState(Array<LocationMarker>);
    const [markersMap, setMarkersMap] = useState<Record<string, Array<LocationMarker>>>({});

    // Load home preferences
    useEffect(() => {
        (async () => {
            const show = await AsyncStorage.getItem('show_home');
            if (show === 'true') {
                setShowHome(true);
                const lat = await AsyncStorage.getItem('home_lat');
                const lng = await AsyncStorage.getItem('home_lng');
                const name = await AsyncStorage.getItem('home');
                if (lat && lng && name) {
                    setHome({lat: parseFloat(lat), lng: parseFloat(lng), text: name});
                }
            }
        })();
    }, []);

    const handleLogout = async () => {
        await signOut()
        router.replace('/sign-in')
    }
    const fetchEta = async () => {
        try {
            const response = await FirstViewService.getEta();
            const newStops: LocationMarker[] = [];
            const newBuses: LocationMarker[] = [];
            const newMarkersMap = {} as Record<string, LocationMarker[]>;

            response.result?.forEach((result) => {
                const first = result.student?.first_name || '';
                const last = result.student?.last_name || '';
                const studentName = `${first} ${last}`;

                if (result.stop) {
                    newStops.push({...result.stop, studentName});
                    newMarkersMap[studentName] = [...(newMarkersMap[studentName] || []), {...result.stop}];
                }
                if (result.vehicle_location) {
                    const loc = result.vehicle_location;
                    newBuses.push({...loc, studentName, route: result.route});
                    newMarkersMap[studentName] = [...(newMarkersMap[studentName] || []), {...loc}];
                }
            });

            setStops(newStops);
            setBuses(newBuses);
            setMarkersMap(newMarkersMap);

            adjustZoomToMarkers(mapRef, newStops);
        } catch (e) {
            console.warn('Failed to fetch ETA data', e);
        }
    };
    // Fetch ETA data periodically
    useEffect(() => {
        fetchEta();
        const interval = setInterval(fetchEta, 10000);
        return () => clearInterval(interval);
    }, []);


    const renderStopItem = ({item}: { item: LocationMarker }) => {
        const student = item.studentName ?? '';
        const allMarkers = (markersMap[student] || [])
        const busMarkers = allMarkers.filter(marker => marker.bearing != null);

        const onBusPress = () => {
            adjustZoomToMarkers(mapRef, busMarkers);
        };

        const onListItemPress = () => {
            adjustZoomToMarkers(mapRef, allMarkers);
        };


        return (
            <View style={styles.listItem}>
                <View style={[styles.colorIndicator, {
                    backgroundColor: getHslColor(student)
                }]}/>
                <TouchableOpacity onPress={onListItemPress}>
                    <View style={styles.textContainer}>
                        <Text style={styles.stopName}>{item.name}</Text>
                        <Text style={styles.studentName}>{student}</Text>
                    </View>
                </TouchableOpacity>

                {busMarkers.length > 0 && (
                    <TouchableOpacity onPress={onBusPress} style={{padding: 8}}>
                        <MaterialIcons size={20}>Bus</MaterialIcons>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeContainer}>
            <View style={styles.container}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    initialRegion={{
                        latitude: 39.8283,
                        longitude: -98.5795,
                        latitudeDelta: 30,
                        longitudeDelta: 30,
                    }}
                >
                    {showHome && home && (
                        <Marker
                            coordinate={{latitude: home.lat, longitude: home.lng}}
                            title={home.text}
                        />
                    )}
                    {stops.map((stop) => (
                        <Marker
                            key={stop.id}
                            coordinate={{latitude: stop.lat, longitude: stop.lng}}
                            pinColor={getHslColor(stop.studentName ?? '')}
                            title={stop.text}
                            anchor={{x: 0.5, y: 0.5}}
                        />
                    ))}
                    {buses.map((bus) => (
                        <Marker
                            key={bus.id}
                            coordinate={{latitude: bus.lat, longitude: bus.lng}}
                            rotation={bus.bearing}
                            anchor={{x: 0.5, y: 0.5}}
                            title={`${bus.studentName} (R${bus.route})`}
                        />
                    ))}
                </MapView>

                {/* Bottom List of Stops */}
                <View style={styles.listContainer}>
                    <FlatList
                        data={stops}
                        keyExtractor={(item) => item.id ?? ''}
                        renderItem={renderStopItem}
                        contentContainerStyle={styles.listContent}
                    />
                </View>

            </View>

            {/* Settings Button */}
            <TouchableOpacity style={styles.leftButton} onPress={() => router.navigate('/')}>
                <MaterialIcons name="settings" size={28}/>
            </TouchableOpacity>

            {/* Refresh Button */}
            <TouchableOpacity style={styles.rightButton} onPress={() => { /* trigger manual fetch if needed */
            }}>
                <MaterialIcons name="refresh" size={28}/>
            </TouchableOpacity>
        </SafeAreaView>
    );
}


const DEFAULT_DELTA = 0.01;       // minimum zoom span for single‐point views
const MIN_DELTA     = 0.005;      // threshold below which bounds are "too small"
const EDGE_PADDING = {top: 50, right: 50, bottom: 50, left: 50};

function adjustZoomToMarkers(
    mapRef: React.RefObject<MapView>,
    markers: Array<{ lat: number; lng: number }>
) {
    if (!mapRef.current || markers.length === 0) {
        return;
    }

    if (markers.length === 1) {
        // Single marker: animate to region with at least DEFAULT_DELTA spans
        const { lat, lng } = markers[0];
        mapRef.current.animateToRegion(
            {
                latitude:  lat,
                longitude: lng,
                latitudeDelta:  DEFAULT_DELTA,
                longitudeDelta: DEFAULT_DELTA,
            } as Region,
            500
        );  // smooth zoom-in :contentReference[oaicite:1]{index=1}
        return;
    }

    // Multiple markers: compute bounding box
    const lats = markers.map(m => m.lat);
    const lngs = markers.map(m => m.lng);

    const maxLat = Math.max(...lats);
    const minLat = Math.min(...lats);
    const maxLng = Math.max(...lngs);
    const minLng = Math.min(...lngs);

    const latDelta = maxLat - minLat;
    const lngDelta = maxLng - minLng;

    // If bounds are very small, treat like a single marker
    if (latDelta < MIN_DELTA && lngDelta < MIN_DELTA) {
        const centerLat = (maxLat + minLat) / 2;
        const centerLng = (maxLng + minLng) / 2;
        mapRef.current.animateToRegion(
            {
                latitude:  centerLat,
                longitude: centerLng,
                latitudeDelta:  DEFAULT_DELTA,
                longitudeDelta: DEFAULT_DELTA,
            } as Region,
            500
        );  // fallback zoom :contentReference[oaicite:2]{index=2}
    } else {
        // Otherwise, fit all coordinates with padding
        const coords: LatLng[] = markers.map(m => ({
            latitude:  m.lat,
            longitude: m.lng
        }));
        mapRef.current.fitToCoordinates(coords, {
            edgePadding: EDGE_PADDING,
            animated: true
        });
    }
}
const {height} = Dimensions.get('window');

const styles = StyleSheet.create({
    safeContainer: {flex: 1, backgroundColor: 'white'},
    container: {flex: 1, flexDirection: 'column'},
    map: {flex: 1},
    leftButton: {
        position: 'absolute',
        top: 10,
        left: 10,
        padding: 8,
        backgroundColor: 'white',
        borderRadius: 20,
    },
    rightButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 8,
        backgroundColor: 'white',
        borderRadius: 20,
    },
    listContainer: {
        flex: 0.8
    },
    listContent: {
        padding: 16,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    colorIndicator: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    stopName: {
        fontSize: 16,
        fontWeight: '600',
    },
    studentName: {
        fontSize: 14,
        color: '#555',
    },
});
