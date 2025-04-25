import AsyncStorage from "@react-native-async-storage/async-storage";
import { SplashScreen, useRouter } from "expo-router";
import { createContext, PropsWithChildren, useEffect, useState } from "react";
import {AuthService} from "@/api/FirstViewClient";
import * as Device from "expo-device";

SplashScreen.preventAutoHideAsync();

type AuthState = {
    isReady: boolean;
    email: string;
    loginToken: string;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthState>({
    isReady: false,
    email: '',
    loginToken: '',
    signIn: async (email: string, password: string) => {},
    signOut: async () => {},
});

export function AuthProvider({ children }: PropsWithChildren) {
    const [isReady, setIsReady] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loginToken, setLoginToken] = useState('');
    const [email, setEmail] = useState('');
    const router = useRouter();


    const signIn = async (email: string, password: string) => {
        const resp = await AuthService.login({
            email_or_phone: email,
            password,
            remember_me: true,
            device_name: 'android',
            device_uid: Device.osInternalBuildId ?? 'noid',
        });
        if (resp.login_token) {
            await AsyncStorage.setItem('login_token', resp.login_token);
            await AsyncStorage.setItem('email', email);
            setIsLoggedIn(true);
            setEmail(email);
            setLoginToken(resp.login_token);
            router.replace("/(protected)");
        }
    };
    const signOut = async () => {
        await AsyncStorage.removeItem('login_token');
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('email');
        setIsLoggedIn(false);
        router.replace("/sign-in");
    };

    useEffect(() => {
        const getAuthFromStorage = async () => {
            try {
                const loginToken = await AsyncStorage.getItem('login_token')??'';
                const email = await AsyncStorage.getItem('email')??'';
                if (loginToken !== null) {
                    setIsLoggedIn(true);
                    setLoginToken(loginToken);
                    setEmail(email);
                }else{
                    setIsLoggedIn(false);
                    setLoginToken('');
                    setEmail('');
                }
            } catch (error) {
                console.log("Error fetching from storage", error);
            }
            setIsReady(true);
        };
        getAuthFromStorage();
    }, []);

    useEffect(() => {
        if (isReady) {
            SplashScreen.hideAsync();
        }
    }, [isReady]);

    return (
        <AuthContext.Provider
            value={{
                isReady,
                loginToken,
                email,
                signIn,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}