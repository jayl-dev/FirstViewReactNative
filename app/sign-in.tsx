import React, { useState, useContext } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import {AuthContext} from "@/app/_layout";
import {useRouter} from "expo-router";

export default function SignIn() {
    const { signIn } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleLogin = async () => {
        try {
            await signIn(email, password);
            router.push('/');
        } catch (error) {
            Alert.alert('Login Failed', 'Please check your email and password.');
        }
    };

    return (
        <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
            <TextInput
                placeholder="Email"
                onChangeText={setEmail}
                value={email}
                style={{ marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#ccc' }}
            />
            <TextInput
                placeholder="Password"
                secureTextEntry
                onChangeText={setPassword}
                value={password}
                style={{ marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#ccc' }}
            />
            <Button title="Login" onPress={handleLogin} />
        </View>
    );
}