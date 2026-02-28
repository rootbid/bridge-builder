import { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { CheckCircle2, Lightbulb, Circle, Clock, Heart, HeartCrack, ChevronLeft, ChevronRight } from 'lucide-react';

interface BridgeTaskCardProps {
    taskA: string;
    taskB: string;
    insight: string;
    partnerRole: 'A' | 'B';
    myTaskCompleted?: boolean;
    partnerTaskCompleted?: boolean;
    myFeedback?: 'positive' | 'negative';
    onFeedback: (feedback: 'positive' | 'negative') => void;
    onComplete: () => void;
}

export const BridgeTaskCard = ({ taskA, taskB, insight, partnerRole, myTaskCompleted, partnerTaskCompleted, myFeedback, onFeedback, onComplete }: BridgeTaskCardProps) => {
    const myTask = partnerRole === 'A' ? taskA : taskB;
    const theirTask = partnerRole === 'A' ? taskB : taskA;

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-150, 150], [-2, 2]);
    const positiveOpacity = useTransform(x, [0, 80], [0, 1]);
    const negativeOpacity = useTransform(x, [0, -80], [0, 1]);

    return (
        <div className="relative w-full">
            {/* Background feedback indicators */}
            {!myFeedback && (
                <div className="absolute inset-0 flex justify-between items-center px-4 pointer-events-none z-0">
                    <motion.div style={{ opacity: negativeOpacity }} className="flex flex-col items-center gap-2 text-hearth-clay drop-shadow-md pr-8">
                        <HeartCrack size={32} />
                        <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Didn't Feel Right</span>
                    </motion.div>
                    <motion.div style={{ opacity: positiveOpacity }} className="flex flex-col items-center gap-2 text-hearth-sage drop-shadow-md pl-8">
                        <Heart size={32} className="fill-hearth-sage/30" />
                        <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Felt Connected</span>
                    </motion.div>
                </div>
            )}

            <motion.div
                initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{ x, rotate }}
                drag={!myFeedback ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={(e, info) => {
                    if (info.offset.x > 80 && !myFeedback) {
                        onFeedback('positive');
                        animate(x, 0, { type: "spring", stiffness: 300, damping: 20 });
                    } else if (info.offset.x < -80 && !myFeedback) {
                        onFeedback('negative');
                        animate(x, 0, { type: "spring", stiffness: 300, damping: 20 });
                    } else {
                        // Snap back if they didn't swipe far enough
                        animate(x, 0, { type: "spring", stiffness: 300, damping: 20 });
                    }
                }}
                className={`glass-warm rounded-3xl p-6 relative overflow-hidden grain gradient-border z-10 touch-pan-y shadow-xl ${!myFeedback ? 'cursor-grab active:cursor-grabbing' : ''}`}
            >
                <div className="relative z-10 space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-hearth-clay/20 flex items-center justify-center">
                                <Lightbulb size={16} className="text-hearth-glow" />
                            </div>
                            <h3 className="font-serif text-xl text-hearth-paper">Your Shared Path</h3>
                        </div>

                        {/* Status Feedback Mechanism */}
                        <AnimatePresence>
                            {myFeedback ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 0.8, scale: 1 }}
                                    className="px-2 py-1 rounded-full bg-hearth-deep/50 border border-hearth-paper/5 flex items-center gap-2"
                                >
                                    {myFeedback === 'positive' ? (
                                        <Heart size={14} className="text-hearth-sage fill-hearth-sage/30" />
                                    ) : (
                                        <HeartCrack size={14} className="text-hearth-clay" />
                                    )}
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>

                    {!myFeedback && (
                        <div className="w-full flex justify-between px-2 absolute top-0 left-0 right-0 pointer-events-none opacity-20 mt-1">
                            <ChevronLeft size={16} className="text-hearth-paper animate-pulse" />
                            <ChevronRight size={16} className="text-hearth-paper animate-pulse" />
                        </div>
                    )}

                    {/* Insight */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-hearth-paper/60 text-sm italic leading-relaxed border-l-2 border-hearth-clay/30 pl-4"
                    >
                        {insight}
                    </motion.p>

                    {/* Tasks */}
                    <div className="space-y-4">
                        {/* My task — interactive */}
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className={`flex gap-4 items-start p-4 rounded-2xl transition-all duration-500 ${myTaskCompleted
                                ? 'bg-hearth-sage/10 border border-hearth-sage/20'
                                : 'bg-hearth-deep/40 border border-hearth-paper/5'
                                }`}
                        >
                            <div className="mt-0.5 flex-shrink-0">
                                {myTaskCompleted ? (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                                        <CheckCircle2 size={22} className="text-hearth-sage" />
                                    </motion.div>
                                ) : (
                                    <Circle size={22} className="text-hearth-paper/30" />
                                )}
                            </div>
                            <div>
                                <span className="text-hearth-clay text-[10px] tracking-[0.2em] uppercase block mb-1">Your path</span>
                                <p className={`text-hearth-paper text-sm leading-relaxed transition-all duration-500 ${myTaskCompleted ? 'opacity-50 line-through' : ''
                                    }`}>
                                    {myTask}
                                </p>
                            </div>
                        </motion.div>

                        {/* Partner's task — read-only, not clickable */}
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 }}
                            className={`flex gap-4 items-start p-4 rounded-2xl transition-all duration-500 ${partnerTaskCompleted
                                ? 'bg-hearth-sage/10 border border-hearth-sage/20'
                                : 'bg-hearth-deep/40 border border-hearth-paper/5'}`}
                        >
                            <div className="mt-0.5 flex-shrink-0">
                                {partnerTaskCompleted ? (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                                        <CheckCircle2 size={22} className="text-hearth-sage" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                    >
                                        <Clock size={22} className="text-hearth-paper/15" />
                                    </motion.div>
                                )}
                            </div>
                            <div>
                                <span className="text-hearth-ember text-[10px] tracking-[0.2em] uppercase block mb-1">Partner's path</span>
                                <p className={`text-hearth-paper/50 text-sm leading-relaxed ${partnerTaskCompleted ? 'opacity-50 line-through' : ''}`}>
                                    {theirTask}
                                </p>
                                {partnerTaskCompleted ? (
                                    <span className="text-hearth-sage text-[9px] tracking-wider italic mt-2 block">
                                        ✧ Partner has walked their path
                                    </span>
                                ) : (
                                    <span className="text-hearth-paper/20 text-[9px] tracking-wider italic mt-2 block">
                                        ✧ Awaiting your partner...
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Cross Together Button */}
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => {
                            if (!myTaskCompleted) onComplete();
                        }}
                        disabled={myTaskCompleted}
                        className={`w-full py-4 rounded-2xl text-sm tracking-[0.12em] uppercase transition-all duration-500 ${myTaskCompleted
                            ? 'bg-hearth-sage/10 text-hearth-sage/50 border border-hearth-sage/10 cursor-default'
                            : 'bg-hearth-sage/15 text-hearth-sage border border-hearth-sage/25 hover:bg-hearth-sage/25 active:scale-[0.98]'
                            }`}
                    >
                        {myTaskCompleted
                            ? (partnerTaskCompleted ? 'Together at last' : 'Waiting for partner...')
                            : '✦ Mark Path as Walked ✦'}
                    </motion.button>

                    {myTaskCompleted && !partnerTaskCompleted && (
                        <motion.p
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center text-hearth-paper/25 text-[10px] italic"
                        >
                            Your path is walked. When your partner finishes theirs, you cross together.
                        </motion.p>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
