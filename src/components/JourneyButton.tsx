import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface JourneyButtonProps {
    label: string;
    sublabel?: string;
    icon?: ReactNode;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    loadingLabel?: string;
    variant?: 'primary' | 'warm' | 'sage' | 'ghost';
    className?: string;
}

export const JourneyButton = ({
    label,
    sublabel,
    icon,
    onClick,
    disabled = false,
    loading = false,
    loadingLabel,
    variant = 'primary',
    className = '',
}: JourneyButtonProps) => {
    const baseClasses = 'relative w-full py-4 rounded-2xl text-sm tracking-[0.12em] uppercase transition-all duration-500 flex items-center justify-center gap-3 overflow-hidden';

    const variantClasses = {
        primary: disabled
            ? 'bg-hearth-stone/30 text-hearth-paper/25 cursor-not-allowed'
            : 'bg-hearth-clay text-hearth-paper hover:bg-hearth-clay/85 active:scale-[0.98]',
        warm: disabled
            ? 'glass text-hearth-paper/25 cursor-not-allowed'
            : 'glass-warm text-hearth-paper/80 hover:bg-hearth-clay/15 active:scale-[0.98]',
        sage: disabled
            ? 'bg-hearth-stone/20 text-hearth-paper/25 border border-hearth-paper/5 cursor-not-allowed'
            : 'bg-hearth-sage/15 text-hearth-sage border border-hearth-sage/25 hover:bg-hearth-sage/25 active:scale-[0.98]',
        ghost: disabled
            ? 'text-hearth-paper/15 cursor-not-allowed'
            : 'text-hearth-paper/50 hover:text-hearth-paper/80 hover:bg-hearth-stone/20 active:scale-[0.98]',
    };

    return (
        <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => !disabled && !loading && onClick()}
            disabled={disabled || loading}
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        >
            {/* Shimmer loading animation */}
            {loading && (
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(242,232,218,0.06) 50%, transparent 100%)',
                        backgroundSize: '200% 100%',
                    }}
                    animate={{ backgroundPosition: ['200% center', '-200% center'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
            )}

            {/* Pulse glow border when ready (not disabled, not loading) */}
            {!disabled && !loading && (
                <motion.div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    animate={{
                        boxShadow: [
                            '0 0 0px rgba(217,93,57,0)',
                            '0 0 12px rgba(217,93,57,0.15)',
                            '0 0 0px rgba(217,93,57,0)',
                        ],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
            )}

            {/* Content */}
            <span className="relative z-10 flex items-center gap-3">
                {loading ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>{loadingLabel || 'Working...'}</span>
                    </>
                ) : (
                    <>
                        {icon}
                        <span className="flex flex-col items-center">
                            <span>{label}</span>
                            {sublabel && (
                                <span className="text-[9px] tracking-[0.15em] opacity-50 font-normal normal-case mt-0.5">
                                    {sublabel}
                                </span>
                            )}
                        </span>
                    </>
                )}
            </span>
        </motion.button>
    );
};
