// api.ts
import axios, {AxiosInstance, InternalAxiosRequestConfig} from 'axios'
import AsyncStorage from "@react-native-async-storage/async-storage";

//#region Models

export interface LoginRequest {
    email_or_phone: string
    password: string
    remember_me: boolean
    device_name: string
    device_uid: string
}

export interface LoginResponse {
    login_token?: string
    refresh_token?: string
    message?: string
    response?: ResponseCode
}

export interface TokenRequest {
    email: string
    login_token: string
}

export interface TokenResponse {
    auth_token?: string
    expiry: number
    message?: string
    response?: ResponseCode
}

export interface EtaResponse {
    result?: Result[]
    message?: string
    response?: ResponseCode
}

export interface NotificationResponse {
    result?: Notification[]
    message?: string
    response?: ResponseCode
}

export interface Notification {
    id: number
    title?: string
    contents?: string
    created_at?: string
}

export function getStudentName(result: Result): string {
    return result.student?.first_name + ' ' + result.student?.last_name;
}

export function getStudentId(result: Result): string {
    const student = result.student;
    return (student?.id?.toString() || getStudentName(result));
}

export interface Result {
    period?: string
    pickup_or_dropoff?: string
    dispatch_type?: string
    time_zone?: string
    scheduled_time?: string
    template_scheduled_time?: string
    average_time?: string
    route_id?: string
    route?: string
    journey_id?: string
    stop?: Stop
    school?: string
    school_closed: boolean
    contractor_id: number
    valid_monday?: boolean
    valid_tuesday?: boolean
    valid_wednesday?: boolean
    valid_thursday?: boolean
    valid_friday?: boolean
    valid_saturday?: boolean
    valid_sunday?: boolean
    created_at?: string
    early_late_minutes: number
    estimated_time?: string
    estimated_time_from_now_minutes?: string
    status?: string
    type?: string
    stop_id?: string
    vehicle_location?: VehicleLocation
    student?: Student
    service_start_time?: string
    run_complete?: string
    run_code?: string
    ridership_daily_record?: string
}

export interface Student {
    id: number
    student_number?: string
    first_name?: string
    last_name?: string
    linked_activity_student?: boolean
    activity_student?: boolean
    school?: string
    district?: any
}

export interface VehicleLocation {
    lat: number
    lng: number
    bearing: number
    text?: string
    timestamp?: string
}

export interface Stop {
    name?: string
    id?: string
    lat: number
    lng: number
    time_zone?: string
    created_at?: string
}

export interface ResponseCode {
    code: number
}

//#endregion Models

//#region Storage Helpers

const PREFS = {
    getAuthToken: async () => await AsyncStorage.getItem('auth_token')??'',
    setAuthToken: (t: string) => AsyncStorage.setItem('auth_token', t),
    getLoginToken: async () => await AsyncStorage.getItem('login_token')??'',
    getEmail: async () => await AsyncStorage.getItem('email')??'',
}

//#endregion Storage Helpers

//#region JWT Utilities

function parseJwtPayload(token: string): any | null {
    try {
        const payload = token.split('.')[1]
        // base64url → base64
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
        const json = atob(base64)
        return JSON.parse(json)
    } catch {
        return null
    }
}

function getExpireTimeFromJwt(token: string): number | null {
    const payload = parseJwtPayload(token)
    if (!payload || typeof payload.exp !== 'number') return null
    // exp is in seconds
    return payload.exp * 1000
}

function isTokenExpired(token: string): boolean {
    const exp = getExpireTimeFromJwt(token)
    return !exp || Date.now() > exp
}

//#endregion JWT Utilities

//#region Auth Interceptor

async function refreshAuthToken(): Promise<string> {
    const loginToken = await PREFS.getLoginToken()
    const email = await PREFS.getEmail()
    if (!loginToken || !email) return ''

    try {
        const resp = await AuthService.getToken({ email, login_token: loginToken })
        if (resp.auth_token) {
            await PREFS.setAuthToken(resp.auth_token)
            return resp.auth_token
        }
    } catch (e) {
        console.error('Failed to refresh token', e)
    }
    return ''
}

/**
 * Axios request interceptor: ensures we have a valid auth token,
 * refreshing it if necessary, then attaches it to the Authorization header.
 */
async function authRequestInterceptor(config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
    let token = await PREFS.getAuthToken()
    if (!token || isTokenExpired(token)) {
        token = await refreshAuthToken()
    }
    if (token && config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
}

//#endregion Auth Interceptor

//#region HTTP Clients

const BASE_URL = 'https://firstviewbackend.com/api/'

// Logging interceptor: only prints if running in emulator (you define that flag)
const isEmulator = (): boolean => {
    // replace with your real check, e.g. some global flag
    return process.env.NODE_ENV === 'development'
}

function addLoggingInterceptor(client: AxiosInstance) {
    client.interceptors.request.use(cfg => {
        if (isEmulator()) console.log('[HTTP REQUEST]', cfg.method, cfg.url, cfg.data ?? '')
        return cfg
    })
    client.interceptors.response.use(res => {
        if (isEmulator()) console.log('[HTTP RESPONSE]', res.status, res.config.url, res.data)
        return res
    }, err => {
        if (isEmulator()) console.error('[HTTP ERROR]', err)
        return Promise.reject(err)
    })
}

export const AuthService = (() => {
    const client = axios.create({ baseURL: BASE_URL })
    // no auth or logging needed here

    return {
        login: async (body: LoginRequest): Promise<LoginResponse> => {
            const { data } = await client.post<LoginResponse>('v1/sign-in', body)
            return data
        },
        getToken: async (body: TokenRequest): Promise<TokenResponse> => {
            const { data } = await client.post<TokenResponse>('v1/get-token', body)
            return data
        },
    }
})()
const mock = (response: EtaResponse): void => {
    response.result?.forEach((item) => {
        if (!item.vehicle_location) {
            const mockLocation: VehicleLocation = {
                lat: 40.1252448 + Math.random() * 0.01,
                lng: -75.0385262 + Math.random() * 0.01,
                bearing: 129 + Math.floor(Math.random() * 100),
            };
            item.vehicle_location = mockLocation; // Assign the generated mock location
        }
    });
};

export const FirstViewService = (() => {
    const client = axios.create({ baseURL: BASE_URL })
    addLoggingInterceptor(client)
    // attach auth interceptor
    client.interceptors.request.use(authRequestInterceptor)

    return {
        getEta: async (): Promise<EtaResponse> => {
            const { data } = await client.get<EtaResponse>('v1/eta')
            // mock(data);
            return data
        },
        getNotifications: async (): Promise<NotificationResponse> => {
            const { data } = await client.get<NotificationResponse>('v1/notifications')
            return data
        },
    }
})()

//#endregion HTTP Clients
