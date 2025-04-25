// components/CustomDrawerContent.tsx
import { useContext } from 'react';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Text, View } from 'react-native';

import {usePathname, useRouter} from 'expo-router';
import {AuthContext} from "@/utils/authContext";

export default function CustomDrawerContent(props: any) {
    const { email, signOut } = useContext(AuthContext);
    const router = useRouter();
    const pathname = usePathname(); // ✅ current path

    return (
        <DrawerContentScrollView {...props}>
            {/* Display user email */}
            <View style={{ padding: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
                    {email}
                </Text>
            </View>
            <DrawerItem
                label="Settings"
                onPress={() => {
                    if (pathname !== '/settings') {
                        router.push('/settings');
                    }else {
                        props.navigation.closeDrawer();
                    }
                }}
            />
            <DrawerItem
                label="Map"
                onPress={() => {
                    if (pathname !== '/map') {
                        router.replace('/map');
                    }else {
                        props.navigation.closeDrawer();
                    }
                }}
            />
            <DrawerItem
                label="Sign Out"
                onPress={() => {
                    signOut();
                }}
            />
        </DrawerContentScrollView>
    );
}
