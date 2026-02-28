import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface CoupleState {
    coupleId: string | null;
    partnerRole: 'A' | 'B' | null;
    sessionToken: string | null;
    isOnboarded: boolean;
    inviteCode: string | null;
}

interface CoupleContextValue extends CoupleState {
    setCoupleData: (coupleId: string, partnerRole: 'A' | 'B', inviteCode?: string) => void;
    clearCoupleData: () => void;
    refreshSession: () => void;
}

const STORAGE_KEY = 'bridge-builder-couple';

function loadState(): CoupleState {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return {
                coupleId: parsed.coupleId || null,
                partnerRole: parsed.partnerRole || null,
                sessionToken: parsed.sessionToken || null,
                isOnboarded: parsed.isOnboarded || false,
                inviteCode: parsed.inviteCode || null,
            };
        }
    } catch { }
    return {
        coupleId: null,
        partnerRole: null,
        sessionToken: null,
        isOnboarded: false,
        inviteCode: null,
    };
}

const CoupleContext = createContext<CoupleContextValue | null>(null);

export function CoupleProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<CoupleState>(loadState);
    const createSession = useMutation(api.auth.createSession);
    const fetchingSessionRef = useRef(false);

    // Fetch session token if we don't have one
    useEffect(() => {
        if (!state.sessionToken && !fetchingSessionRef.current) {
            fetchingSessionRef.current = true;
            createSession().then((result) => {
                setState((prev) => {
                    const nextState = { ...prev, sessionToken: result.token };
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
                    return nextState;
                });
            }).catch((err) => {
                console.error('[Bridge] Session creation failed:', err);
                fetchingSessionRef.current = false; // Allow retry
            });
        }
    }, [state.sessionToken, createSession]);

    // sync state changes to localStorage
    useEffect(() => {
        if (state.sessionToken) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
    }, [state]);

    const setCoupleData = (coupleId: string, partnerRole: 'A' | 'B', inviteCode?: string) => {
        setState(prev => ({
            ...prev,
            coupleId,
            partnerRole,
            isOnboarded: true,
            inviteCode: inviteCode || null,
        }));
    };

    const clearCoupleData = () => {
        setState(prev => ({
            ...prev,
            coupleId: null,
            partnerRole: null,
            isOnboarded: false,
            inviteCode: null,
        }));
    };

    // Force-refresh the session token (e.g. when the backend says it's invalid/expired)
    const refreshSession = () => {
        fetchingSessionRef.current = false;
        setState(prev => {
            const nextState = { ...prev, sessionToken: null, coupleId: null, partnerRole: null, isOnboarded: false, inviteCode: null };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
            return nextState;
        });
    };

    // If we're still waiting for a native session token, render nothing to avoid unauth requests
    if (!state.sessionToken) {
        return null;
    }

    return (
        <CoupleContext.Provider value={{ ...state, setCoupleData, clearCoupleData, refreshSession }}>
            {children}
        </CoupleContext.Provider>
    );
}

export function useCouple(): CoupleContextValue {
    const ctx = useContext(CoupleContext);
    if (!ctx) throw new Error('useCouple must be used within a CoupleProvider');
    return ctx;
}
