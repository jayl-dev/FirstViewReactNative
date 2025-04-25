export const hsvToHex = (h: number, s: number, v: number): string => {
    const f = (n: number): string => {
        const k = (n + h / 60) % 6;
        const color = v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
        return Math.round(color * 255).toString(16).padStart(2, '0');
    };
    const r = f(5);
    const g = f(3);
    const b = f(1);
    return `#${r}${g}${b}`.toUpperCase();
};

const hashCode = (str: string) => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return hash >>> 0; // Ensure the hash is non-negative
};

export const getHslColorHex = (name: string) => {
    const hue = Math.abs(hashCode(name)%1000) % 360;
    return hsvToHex(hue, 1, 0.5);
};

// Convert hash to HSL color string
export const getHslColor = (name: string) => {
    const hue = Math.abs(hashCode(name)%1000) % 360;
    return `hsl(${hue}, 100%, 50%)`;
};
