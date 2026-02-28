import { motion } from 'framer-motion';
import { X, Compass, Pen, Eye, Footprints, Heart, PenLine, RotateCcw } from 'lucide-react';

const steps = [
    {
        icon: <Compass size={18} />,
        title: 'Discover',
        color: 'text-hearth-mist',
        description: 'A question appears — something real, something that matters.',
        example: '"What\'s one thing I do that makes you feel truly loved — and one thing that unintentionally hurts?"',
    },
    {
        icon: <Pen size={18} />,
        title: 'Share Your Truth',
        color: 'text-hearth-paper/70',
        description: 'Both of you answer honestly, in private. Your partner can\'t see what you write until you both finish.',
        example: 'You might write: "I feel loved when you slow down and ask about my day. I feel hurt when you scroll your phone while I\'m talking."',
    },
    {
        icon: <Eye size={18} />,
        title: 'See the Gap',
        color: 'text-hearth-ember',
        description: 'Both answers are revealed at once — like opening a gift. You see where you align and where you differ.',
        example: 'Maybe you both said "quality time" matters, but see it completely differently. That\'s the gap. That\'s where growth lives.',
    },
    {
        icon: <Footprints size={18} />,
        title: 'Lay the Bridge',
        color: 'text-hearth-clay',
        description: 'The app reads both your answers and creates a small, real-world action for each of you — a way to close the gap.',
        example: 'Your task: "Tonight, put your phone away during dinner and ask one unexpected question." Partner\'s task: "Share one thing from your day that you almost didn\'t mention."',
    },
    {
        icon: <Heart size={18} />,
        title: 'Cross Together',
        color: 'text-hearth-sage',
        description: 'Each of you walks your own path. When both are done, you\'ve crossed a bridge together — a small act of understanding.',
        example: 'After dinner, you both check your tasks done. The bridge is built. You know each other a little better than yesterday.',
    },
];

export const UserGuide = ({ onClose }: { onClose: () => void }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-hearth-dark/97 backdrop-blur-xl overflow-y-auto safe-top safe-bottom"
        >
            <div className="max-w-md mx-auto p-6 pb-16">
                {/* Header */}
                <div className="flex items-center justify-between py-4 mb-4">
                    <h2 className="font-serif text-2xl text-hearth-paper">How It Works</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-hearth-paper/40 hover:text-hearth-paper/70 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Intro */}
                <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-hearth-paper/50 text-sm leading-relaxed mb-8"
                >
                    The Bridge Builder is a shared ritual for two people who want to understand each other more deeply.
                    It's not a quiz. It's not therapy. It's a conversation tool that turns honest words into real action.
                </motion.p>

                {/* Steps */}
                <div className="space-y-1">
                    {steps.map((step, i) => (
                        <motion.div
                            key={step.title}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 + i * 0.1 }}
                            className="relative"
                        >
                            {/* Connector line */}
                            {i < steps.length - 1 && (
                                <div className="absolute left-[19px] top-[44px] bottom-0 w-px bg-hearth-paper/6" />
                            )}

                            <div className="flex gap-4 p-4">
                                <div className={`w-10 h-10 rounded-full glass flex items-center justify-center flex-shrink-0 ${step.color}`}>
                                    {step.icon}
                                </div>
                                <div className="space-y-2 flex-1 min-w-0">
                                    <h3 className={`font-serif text-base ${step.color}`}>{step.title}</h3>
                                    <p className="text-hearth-paper/60 text-sm leading-relaxed">{step.description}</p>
                                    <div className="glass rounded-xl p-3 mt-2">
                                        <p className="text-hearth-paper/35 text-xs italic leading-relaxed">{step.example}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Extra features */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-10 space-y-4"
                >
                    <h3 className="font-serif text-lg text-hearth-paper/70">Good to know</h3>

                    <div className="space-y-3">
                        <div className="flex gap-3 items-start">
                            <PenLine size={14} className="text-hearth-clay/60 mt-1 flex-shrink-0" />
                            <p className="text-hearth-paper/40 text-xs leading-relaxed">
                                <strong className="text-hearth-paper/60">Bring Your Own:</strong> Either of you can write a custom question about something specific — a conversation that felt unfinished, a moment you want to revisit.
                            </p>
                        </div>
                        <div className="flex gap-3 items-start">
                            <RotateCcw size={14} className="text-hearth-clay/60 mt-1 flex-shrink-0" />
                            <p className="text-hearth-paper/40 text-xs leading-relaxed">
                                <strong className="text-hearth-paper/60">Re-Cross a Bridge:</strong> Open your past crossings and re-do a bridge task you want to practice again. Growth isn't a one-time event.
                            </p>
                        </div>
                        <div className="flex gap-3 items-start">
                            <Heart size={14} className="text-hearth-sage/60 mt-1 flex-shrink-0" />
                            <p className="text-hearth-paper/40 text-xs leading-relaxed">
                                <strong className="text-hearth-paper/60">Your task is yours alone.</strong> You can't complete your partner's task for them. Both paths must be walked for the bridge to be crossed.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Closing */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-10 text-center space-y-3"
                >
                    <p className="text-hearth-paper/20 text-[10px] tracking-[0.2em] uppercase">
                        Not a game. A practice.
                    </p>
                    <button
                        onClick={onClose}
                        className="text-hearth-clay/60 text-xs tracking-widest uppercase hover:text-hearth-clay transition-colors"
                    >
                        Got it — Let's begin
                    </button>
                </motion.div>
            </div>
        </motion.div>
    );
};
