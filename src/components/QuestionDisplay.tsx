import { motion } from 'framer-motion';

interface QuestionDisplayProps {
    text: string;
    category?: string;
    roundNumber?: number;
}

export const QuestionDisplay = ({ text, category, roundNumber }: QuestionDisplayProps) => (
    <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="space-y-4 relative"
    >
        {/* Category badge */}
        <div className="flex items-center gap-3">
            {roundNumber !== undefined && (
                <span className="text-hearth-paper/20 text-[10px] font-mono tracking-wider">
                    #{roundNumber.toString().padStart(2, '0')}
                </span>
            )}
            {category && (
                <span className="text-hearth-clay text-[10px] tracking-[0.2em] uppercase font-medium px-3 py-1 rounded-full bg-hearth-clay/8 border border-hearth-clay/15">
                    {category}
                </span>
            )}
        </div>

        {/* Question Text */}
        <h2 className="font-serif text-2xl text-hearth-paper leading-snug tracking-wide">
            {text}
        </h2>

        {/* Decorative line */}
        <div className="h-px bg-gradient-to-r from-hearth-clay/30 via-hearth-clay/10 to-transparent" />
    </motion.div>
);
