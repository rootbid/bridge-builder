/**
 * Device fingerprint generator — creates a stable hash from browser characteristics.
 * Not cryptographically strong, but sufficient for rate-limiting abuse prevention
 * without requiring authentication.
 */

async function hashString(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function collectSignals(): string {
    const signals: string[] = [];

    // Screen geometry
    signals.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
    signals.push(`${window.devicePixelRatio}`);

    // Timezone
    signals.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

    // Language
    signals.push(navigator.language);
    signals.push((navigator.languages || []).join(","));

    // Platform
    signals.push(navigator.platform || "");
    signals.push(`${navigator.hardwareConcurrency || 0}`);
    signals.push(`${(navigator as any).deviceMemory || 0}`);

    // User agent
    signals.push(navigator.userAgent);

    // Canvas fingerprint
    try {
        const canvas = document.createElement("canvas");
        canvas.width = 200;
        canvas.height = 50;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.textBaseline = "top";
            ctx.font = '14px "Arial"';
            ctx.fillStyle = "#f60";
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = "#069";
            ctx.fillText("bridge-fp", 2, 15);
            ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
            ctx.fillText("bridge-fp", 4, 17);
            signals.push(canvas.toDataURL());
        }
    } catch {
        signals.push("canvas-unavailable");
    }

    // WebGL renderer
    try {
        const gl = document.createElement("canvas").getContext("webgl");
        if (gl) {
            const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
            if (debugInfo) {
                signals.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "");
                signals.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || "");
            }
        }
    } catch {
        signals.push("webgl-unavailable");
    }

    return signals.join("|");
}

let cachedFingerprint: string | null = null;

export async function getDeviceFingerprint(): Promise<string> {
    if (cachedFingerprint) return cachedFingerprint;

    const signals = collectSignals();
    const hash = await hashString(signals);
    // Take first 16 hex chars (64 bits) — sufficient for rate limiting
    cachedFingerprint = "dfp_" + hash.substring(0, 16);
    return cachedFingerprint;
}
