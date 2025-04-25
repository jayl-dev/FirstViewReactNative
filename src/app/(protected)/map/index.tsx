import React, {useEffect, useMemo, useRef, useState} from 'react'
import {
    Dimensions,
    FlatList,
    Image,
    ListRenderItemInfo,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import {useNavigation} from 'expo-router'
import MapView, {LatLng, Marker, Region} from 'react-native-maps';
import {EtaResponse, FirstViewService, getStudentId, getStudentName, Result} from "@/api/FirstViewClient";
import {getHslColor} from "@/ui/Color";
import {StatusBar} from "expo-status-bar";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {DrawerActions} from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";


export default function Map() {
    const mapRef = useRef<MapView | null>(null);
    const [showHome, setShowHome] = useState(false); //todo

    const [etaResponse, setEtaResponse] = useState<EtaResponse | null>(null);

    const zoomAdjusted = useRef(false);
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();


    const fetchEta = async () => {
        try {
            const response = await FirstViewService.getEta();
            setEtaResponse(response);
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

    if (!zoomAdjusted.current && etaResponse) {
        const coords: Array<{ lat: number; lng: number }> = getAllCoords(etaResponse.result);
        if (coords.length > 0 && mapRef?.current) {
            adjustZoomToMarkers(mapRef, coords);
            zoomAdjusted.current = true;
        }
    }

    const groupedData = useMemo(() => {
        const groups: { [studentId: string]: Result[] } = {};

        if (!etaResponse?.result) return groups;

        etaResponse.result.forEach((entry: Result) => {
            const student = entry.student;
            if (student) {
                const studentId = getStudentId(entry);

                if (!groups[studentId]) {
                    groups[studentId] = [];
                }

                groups[studentId].push(entry);
            }
        });

        return Object.fromEntries(
            Object.entries(groups).filter(([, entries]) => entries.length > 0)
        ) as { [studentId: string]: Result[] };
    }, [etaResponse]);

    const initialRegion = {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    };
    const renderStudentItem = ({item: studentId}: ListRenderItemInfo<string>) => {
        const entries = groupedData[studentId];

        const onListItemPress = () => {
            adjustZoomToMarkers(mapRef, getAllCoords(entries));
        };
        const onBusPress = (entry: Result) => {
            const { vehicle_location: v } = entry;
            if (v?.lat != null && v?.lng != null) {
                adjustZoomToMarkers(mapRef, [{ lat: v.lat, lng: v.lng }]);
            }
        };
        return (
            <TouchableOpacity onPress={onListItemPress}>
                <View style={styles.listItem}>
                    <View style={[styles.colorIndicator, {
                        backgroundColor: getHslColor(getStudentName(entries[0])),
                    }]}/>

                    <View style={styles.studentContainer}>
                        <Text style={styles.studentName}>
                            {getStudentName(entries[0])}
                        </Text>
                        {entries.map((entry, idx) => (
                            <View key={idx} style={styles.entryContainer}>
                                <Text style={styles.entryText}>
                                    Route: {entry.route} {entry.period} {entry.pickup_or_dropoff}
                                </Text>
                                <Text style={styles.entryText}>
                                    Stop: {entry.stop?.name}
                                </Text>

                                {entry.vehicle_location?.lat != null && entry.vehicle_location?.lng != null && (
                                    <TouchableOpacity onPress={() => onBusPress(entry)}>
                                        <View style={styles.trackBusContainer}>
                                            <Image
                                                source={require('../../../../assets/icons/school-bus.png')}
                                                style={[styles.busIcon, { tintColor: getHslColor(getStudentName(entry)) },
                                                    { transform: [{ rotate: '90deg' }] },]}
                                            />
                                            <Text style={[styles.trackBusText, { color:  getHslColor(getStudentName(entry)) }]}>
                                                Track bus
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </View>

                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" backgroundColor="#ffffff"/>
            <View style={styles.container}>
                <MapView
                    ref={mapRef}
                    style={styles.map} initialRegion={initialRegion}>
                    {(etaResponse?.result ?? [])
                        .filter((item: Result) => item.vehicle_location)
                        .map((item: Result, index: number) => (
                            <Marker
                                key={`${index}`}
                                coordinate={{
                                    latitude: item.vehicle_location?.lat ?? 0,
                                    longitude: item.vehicle_location?.lng ?? 0,
                                }}
                                rotation={item.vehicle_location?.bearing ?? 0}
                                anchor={{x: 0.5, y: 0.5}}
                                title={`${getStudentName(item)} (R${item.route})`}
                            >
                                <Image
                                    source={require('../../../../assets/icons/school-bus.png')}
                                    style={[styles.markerImage, {tintColor: getHslColor(getStudentName(item))}]}
                                />
                            </Marker>
                        ))}

                    {/* Stop markers for each stop */}
                    {(etaResponse?.result ?? [])
                        .filter((item: Result) => item.stop)
                        .map((item: Result, index: number) => (
                            <Marker
                                key={`${index}`}
                                coordinate={{
                                    latitude: item.stop?.lat ?? 0,
                                    longitude: item.stop?.lng ?? 0,
                                }}
                                pinColor={getHslColor(getStudentName(item))}
                                title={item.stop?.name}
                            />
                        ))}
                </MapView>

                {/* List view grouped by student */}
                <FlatList
                    style={styles.list}
                    data={Object.keys(groupedData)}
                    keyExtractor={(studentId) => studentId}
                    renderItem={renderStudentItem}          // <-- use the extracted function
                />
                <TouchableOpacity
                    onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                    style={[
                        styles.leftButton,
                        {top: insets.top + 10}
                    ]}
                >
                    <MaterialIcons name="menu" size={24}/>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}


// Extract stop coordinates
function getStopCoords(results: Result[] = []) {
    return results
        .filter((item) => item.stop?.lat && item.stop?.lng)
        .map((item) => ({
            lat: item.stop!.lat,
            lng: item.stop!.lng,
        }));
}

// Extract vehicle coordinates
function getVehicleCoords(results: Result[] = []) {
    return results
        .filter((item) => item.vehicle_location?.lat && item.vehicle_location?.lng)
        .map((item) => ({
            lat: item.vehicle_location!.lat,
            lng: item.vehicle_location!.lng,
        }));
}

// Combine all coords
function getAllCoords(results: Result[] = []) {
    return [...getStopCoords(results), ...getVehicleCoords(results)];
}

const DEFAULT_DELTA = 0.01;       // minimum zoom span for single‐point views
const MIN_DELTA = 0.005;      // threshold below which bounds are "too small"
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
        const {lat, lng} = markers[0];
        mapRef.current.animateToRegion(
            {
                latitude: lat,
                longitude: lng,
                latitudeDelta: DEFAULT_DELTA,
                longitudeDelta: DEFAULT_DELTA,
            } as Region,
            500
        );
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
                latitude: centerLat,
                longitude: centerLng,
                latitudeDelta: DEFAULT_DELTA,
                longitudeDelta: DEFAULT_DELTA,
            } as Region,
            500
        );
    } else {
        // Otherwise, fit all coordinates with padding
        const coords: LatLng[] = markers.map(m => ({
            latitude: m.lat,
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
        left: 10,
        padding: 8,
        backgroundColor: 'white',
        borderRadius: 20,
    },
    rightButton: {
        position: 'absolute',
        right: 10,
        padding: 8,
        backgroundColor: 'white',
        borderRadius: 20,
    },
    markerImage: {
        width: 25,
        height: 25,
    },
    list: {
        flex: 1
    },
    listItem: {
        flexDirection: 'row',
        borderBottomWidth: 2,
        borderBottomColor: '#ddd',
    },

    // The colored bar on the left
    colorIndicator: {
        width: 6,
        borderRadius: 2,
        marginRight: 8,

    },

    // Container for all student info—fills remaining space
    studentContainer: {
        flex: 1,
        padding: 4
    },

    // Student name styling
    studentName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },

    // Each result entry block
    entryContainer: {
        marginTop: 6,
        paddingLeft: 4,
    },

    // Text for route/stop/vehicle lines
    entryText: {
        fontSize: 14,
        lineHeight: 18,
    },
    // New container for icon + text
    trackBusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        // backgroundColor: 'red',
        alignSelf: 'flex-start',
        paddingVertical: 2,       // added vertical padding
        paddingHorizontal: 2,    // added horizontal padding
    },

    // Icon styling
    busIcon: {
        width: 16,
        height: 16,
        marginRight: 6,
    },

    // “Track bus” text
    trackBusText: {
        fontSize: 14,
        fontWeight: '500',
    },
});
