import React, { useContext } from 'react'
import { Slot, Redirect } from 'expo-router'
import { AuthContext } from '../_layout'

export default function AppLayout() {
    const { userToken } = useContext(AuthContext)
    if (!userToken) {
        return <Redirect href="/sign-in" />
    }
    return <Slot />
}