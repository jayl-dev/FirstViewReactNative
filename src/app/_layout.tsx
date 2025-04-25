import {Stack} from "expo-router";
import "../../global.css"
import React from "react";
import {StatusBar} from "expo-status-bar";
import {AuthProvider} from "@/utils/authContext";
import {SafeAreaView, StyleSheet} from "react-native";

export const unstable_settings = {
    initialRouteName: '(protected)',
};

export default function RootLayout() {
    return (
        <AuthProvider>
            <SafeAreaView style={styles.safeArea}>
                <StatusBar style="dark" backgroundColor="#ffffff" />
                <Stack>
                    <Stack.Screen
                        name="(protected)"
                        options={{
                            headerShown: false,
                            animation: "none",
                        }}
                    />
                    <Stack.Screen
                        name="sign-in"
                        options={{
                            animation: "none",
                            headerShown: false,
                        }}
                    />
                </Stack>
            </SafeAreaView>

        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    content: {
        flex: 1,
        // Additional styling can go here
        justifyContent: 'center',
        alignItems: 'center'
    },
    text: {
        fontSize: 18
    }
});
