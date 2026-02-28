import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

export const TypingPulse = ({ isTyping }: { isTyping: boolean }) => {
    if (!isTyping) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 px-4 py-3"
        >
            <motion.div
                animate={{ scale: [1, 1.2, 0.9, 1.15, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                className="text-hearth-clay/60"
            >
                <Heart size={14} fill="currentColor" />
            </motion.div>
            <span className="text-hearth-paper/40 text-xs tracking-wider italic">
                Your partner is composing
            </span>
            <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                    <motion.span
                        key={i}
                        className="w-1 h-1 rounded-full bg-hearth-clay/40"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                ))}
            </div>
        </motion.div>
    );
};
