import React, {useEffect} from "react";
import {SafeAreaView, StyleSheet, TouchableOpacity} from "react-native";
import { StatusBar } from "expo-status-bar";
import {Stack, useNavigation} from "expo-router";
import {Ionicons} from "@expo/vector-icons";

export default function Layout() {

    const navigation = useNavigation();

    useEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ paddingHorizontal: 16, paddingVertical: 8 }}
                >
                    <Ionicons name="arrow-back" size={24} />
                </TouchableOpacity>
            ),
            title: 'Settings'
        });
    }, [navigation]);

    return (
            <Stack screenOptions={{ headerShown: false }} />
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});