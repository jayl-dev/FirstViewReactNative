// app/settings.tsx
import React from 'react';
import {SafeAreaView, StyleSheet, Text, View} from 'react-native';
import {StatusBar} from "expo-status-bar";

export default function Settings() {


    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" backgroundColor="#ffffff"/>
            <View style={styles.container}>
                <Text style={styles.text}>Settings Screen</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, justifyContent: 'center', alignItems: 'center'},
    text: {fontSize: 20},
});