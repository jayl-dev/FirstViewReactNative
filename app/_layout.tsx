// app/_layout.tsx
import React, { useState, useEffect, createContext } from 'react'
import { Slot } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {AuthService} from "@/api/FirstViewClient";
import * as Device from 'expo-device';

export const AuthContext = createContext({
  userToken: null as string | null,
  signIn: async (_: string, __: string) => {},
  signOut: async () => {},
})

export default function RootLayout() {
  const [userToken, setUserToken] = useState<string | null>(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    AsyncStorage.getItem('login_token')
        .then(token => setUserToken(token))
        .finally(() => setLoading(false))
  }, [])

  const authContext = {
    userToken,
    signIn: async (email: string, pass: string) => {
      // call your API, store token...
      const resp = await AuthService.login({
        email_or_phone: email,
        password: pass,
        remember_me: true,
        device_name: 'android',
        device_uid: Device.osInternalBuildId?? 'noid'
      })
      if (resp.login_token) {
        await AsyncStorage.setItem('login_token', resp.login_token)
        await AsyncStorage.setItem('email', email)
        setUserToken(resp.login_token)
      }
    },
    signOut: async () => {
      await AsyncStorage.removeItem('login_token')
      await AsyncStorage.removeItem('email')
      setUserToken(null)
    },
  }

  if (loading) return null

  return (
      <AuthContext.Provider value={authContext}>
        <Slot />
      </AuthContext.Provider>
  )
}
