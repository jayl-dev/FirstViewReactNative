import {AuthContext} from "@/utils/authContext";
import {Redirect} from "expo-router";
import React, {useContext} from "react";
import {StyleSheet} from "react-native";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {Drawer} from "expo-router/drawer";
import DrawerMenu from "@/components/DrawerMenu";


export default function ProtectedLayout() {
    const authState = useContext(AuthContext);

    if (!authState.isReady) {
        return null;
    }

    if (!authState?.email?.trim() || !authState?.loginToken?.trim()) {
        return <Redirect href="/sign-in"/>;
    }

    return (
            <GestureHandlerRootView style={{flex: 1}}>
                    <Drawer
                        drawerContent={(props) => <DrawerMenu {...props} />}
                        screenOptions={{headerShown: true}}
                    >
                        {/* Drawer.Screen names must match the route file names */}
                        <Drawer.Screen
                            name="map"
                            options={{drawerLabel: 'Map', title: 'Map', headerShown: false}}
                        />
                        <Drawer.Screen
                            name="settings"
                            options={{drawerLabel: 'Settings', title: 'Settings'}}
                        />
                    </Drawer>
            </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    text: {
        fontSize: 18
    }
});
