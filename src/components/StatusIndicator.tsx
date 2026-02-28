import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Pen, Eye, CheckCheck, Clock, Footprints } from 'lucide-react';

type RoundStatus = 'waiting' | 'answering' | 'all_submitted' | 'revealing' | 'bridging' | 'completed';

const STATUS_CONFIG: Record<RoundStatus, { label: string; icon: ReactNode; color: string }> = {
    waiting: {
        label: 'Preparing',
        icon: <Clock size={12} />,
        color: 'text-hearth-mist',
    },
    answering: {
        label: 'Sharing truths',
        icon: <Pen size={12} />,
        color: 'text-hearth-paper/60',
    },
    all_submitted: {
        label: 'Gap discovered',
        icon: <Eye size={12} />,
        color: 'text-hearth-glow',
    },
    revealing: {
        label: 'Seeing the gap',
        icon: <Eye size={12} />,
        color: 'text-hearth-ember',
    },
    bridging: {
        label: 'Walking the bridge',
        icon: <Footprints size={12} />,
        color: 'text-hearth-clay',
    },
    completed: {
        label: 'Crossed together',
        icon: <CheckCheck size={12} />,
        color: 'text-hearth-sage',
    },
};

export const StatusIndicator = ({ status }: { status: RoundStatus }) => {
    const config = STATUS_CONFIG[status];

    return (
        <motion.div
            key={status}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-2 ${config.color}`}
        >
            <span className="flex items-center">{config.icon}</span>
            <span className="text-[10px] tracking-[0.2em] uppercase font-medium">{config.label}</span>
            {(status === 'answering' || status === 'revealing' || status === 'bridging') && (
                <div className="flex gap-0.5 ml-1">
                    {[0, 1, 2].map((i) => (
                        <motion.span
                            key={i}
                            className="w-0.5 h-0.5 rounded-full bg-current"
                            animate={{ opacity: [0.2, 1, 0.2] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    );
};
