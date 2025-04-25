import React from "react";
import {StyleSheet} from "react-native";
import {Stack} from "expo-router";

export default function Layout() {
    return (
        <Stack screenOptions={{headerShown: false}}/>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});