import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowRight, Copy, Check, Sparkles, Share2, CornerUpLeft } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useCouple } from '../context/CoupleContext';

export const WelcomeScreen = () => {
    const [mode, setMode] = useState<'home' | 'join'>('home');
    const [inviteInput, setInviteInput] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { sessionToken, setCoupleData, refreshSession } = useCouple();
    const createCouple = useMutation(api.couples.createCouple);
    const joinCouple = useMutation(api.couples.joinCouple);

    const handleCreate = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await createCouple({ sessionToken: sessionToken! });
            setCoupleData(result.coupleId, 'A', result.inviteCode);
        } catch (e: any) {
            console.error('[Bridge] createCouple failed:', e);
            // Auto-recover from stale/invalid session tokens
            if (e.message?.toLowerCase().includes('session token')) {
                refreshSession();
                setError('Session refreshed — please try again.');
            } else {
                setError(e.message || 'Something went wrong');
            }
        }
        setLoading(false);
    };

    const handleJoin = async () => {
        if (!inviteInput.trim()) return;
        setLoading(true);
        setError('');
        try {
            const result = await joinCouple({
                inviteCode: inviteInput.trim().toUpperCase(),
                sessionToken: sessionToken!,
            });
            setCoupleData(result.coupleId, 'B');
        } catch (e: any) {
            if (e.message?.toLowerCase().includes('session token')) {
                refreshSession();
                setError('Session refreshed — please try again.');
            } else {
                setError(e.message || 'Invalid invite code');
            }
        }
        setLoading(false);
    };



    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden safe-top safe-bottom">
            {/* Background particles */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 rounded-full bg-hearth-clay/20"
                        animate={{
                            y: [0, -30, 0],
                            x: [0, Math.sin(i * 1.5) * 20, 0],
                            opacity: [0.2, 0.5, 0.2],
                        }}
                        transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.7 }}
                        style={{ left: `${15 + i * 18}%`, top: `${40 + i * 8}%` }}
                    />
                ))}
            </div>

            <AnimatePresence mode="wait">
                {mode === 'home' && (
                    <motion.div
                        key="home"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center gap-10 max-w-sm w-full"
                    >
                        {/* Logo / Title */}
                        <div className="flex flex-col items-center gap-6">
                            <motion.div
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                className="w-20 h-20 rounded-full glass-warm flex items-center justify-center"
                            >
                                <Heart className="text-hearth-clay" size={32} strokeWidth={1.5} />
                            </motion.div>
                            <div className="text-center space-y-3">
                                <h1 className="font-serif text-4xl text-hearth-paper tracking-wide">The Bridge</h1>
                                <p className="text-hearth-mist text-sm tracking-widest uppercase">Builder</p>
                            </div>
                            <p className="text-hearth-paper/50 text-center text-sm leading-relaxed max-w-xs">
                                A space where two people can cross the gap between their worlds — one question at a time.
                            </p>
                        </div>

                        {/* Error display */}
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-hearth-clay text-xs text-center"
                            >
                                {error}
                            </motion.p>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col gap-4 w-full">
                            <button
                                onClick={handleCreate}
                                disabled={loading}
                                className="w-full py-4 rounded-2xl bg-hearth-clay text-hearth-paper font-sans text-sm tracking-widest uppercase hover:bg-hearth-clay/80 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            className="w-4 h-4 border-2 border-hearth-paper/30 border-t-hearth-paper rounded-full"
                                        />
                                        Starting...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={16} />
                                        Begin a Journey
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setMode('join')}
                                className="w-full py-4 rounded-2xl glass text-hearth-paper/70 font-sans text-sm tracking-widest uppercase hover:bg-hearth-stone/40 transition-all flex items-center justify-center gap-3"
                            >
                                Join a Journey
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}



                {mode === 'join' && (
                    <motion.div
                        key="join"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col items-center gap-8 max-w-sm w-full"
                    >
                        <div className="text-center space-y-3">
                            <h2 className="font-serif text-2xl text-hearth-paper">Join a Journey</h2>
                            <p className="text-hearth-paper/50 text-sm">Enter the code your partner shared with you.</p>
                        </div>

                        <div className="w-full space-y-4">
                            <input
                                type="text"
                                value={inviteInput}
                                onChange={(e) => {
                                    setInviteInput(e.target.value.toUpperCase());
                                    setError('');
                                }}
                                placeholder="XXXXXXXX"
                                maxLength={8}
                                className="w-full bg-transparent text-center text-3xl font-mono text-hearth-paper tracking-[0.4em] py-4 px-6 rounded-2xl glass outline-none placeholder:text-hearth-paper/15 focus:border-hearth-clay/30 transition-all focus:ring-4 focus:ring-hearth-clay/15"
                            />

                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-hearth-clay text-xs text-center"
                                >
                                    {error}
                                </motion.p>
                            )}

                            <button
                                onClick={handleJoin}
                                disabled={inviteInput.length !== 8 || loading}
                                className="w-full py-4 rounded-2xl bg-hearth-clay text-hearth-paper font-sans text-sm tracking-widest uppercase hover:bg-hearth-clay/80 transition-all disabled:opacity-50 disabled:bg-hearth-stone/50 flex items-center justify-center gap-3"
                            >
                                Step Onto the Bridge
                                <ArrowRight size={16} />
                            </button>
                        </div>

                        <button
                            onClick={() => { setMode('home'); setError(''); setInviteInput(''); }}
                            className="text-hearth-paper/30 text-xs flex items-center gap-2 tracking-widest uppercase hover:text-hearth-paper/60 transition-colors"
                        >
                            <CornerUpLeft size={14} /> Back
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
