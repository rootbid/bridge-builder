import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronDown, RotateCcw, Footprints, Lightbulb } from 'lucide-react';

interface Round {
    _id: string;
    roundNumber: number;
    questionText: string;
    questionCategory?: string;
    partnerAAnswer?: string;
    partnerBAnswer?: string;
    status: string;
    bridgeTask?: {
        observation?: string;
        taskA: string;
        taskB: string;
        insight: string;
    };
    createdAt: number;
}

interface RoundHistoryProps {
    rounds: Round[];
    onClose: () => void;
    onReCross: (roundId: string) => void;
}

const HistoryCard = ({ round, index, onReCross }: { round: Round; index: number; onReCross: (roundId: string) => void; key?: string }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="glass rounded-2xl overflow-hidden"
        >
            {/* Card header — always visible */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full p-5 text-left flex flex-col gap-3 hover:bg-hearth-paper/[0.02] transition-colors"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-hearth-paper/20 text-[10px] font-mono">
                            #{round.roundNumber.toString().padStart(2, '0')}
                        </span>
                        {round.questionCategory && (
                            <span className="text-hearth-clay/50 text-[9px] tracking-[0.15em] uppercase">
                                {round.questionCategory}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-hearth-paper/20 text-[10px]">
                            {new Date(round.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                            })}
                        </span>
                        <motion.div
                            animate={{ rotate: expanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronDown size={14} className="text-hearth-paper/20" />
                        </motion.div>
                    </div>
                </div>

                <p className="font-serif text-sm text-hearth-paper/80 leading-relaxed">
                    {round.questionText}
                </p>

                {round.bridgeTask && !expanded && (
                    <p className="text-hearth-paper/30 text-[10px] italic truncate">
                        ✧ {round.bridgeTask.insight}
                    </p>
                )}
            </button>

            {/* Expanded details */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 space-y-4 border-t border-hearth-paper/5 pt-4">
                            {/* Answers */}
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <span className="text-hearth-clay text-[9px] tracking-[0.2em] uppercase">Partner A</span>
                                    <p className="text-hearth-paper/60 text-sm leading-relaxed font-serif">
                                        {round.partnerAAnswer || '—'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-hearth-ember text-[9px] tracking-[0.2em] uppercase">Partner B</span>
                                    <p className="text-hearth-paper/60 text-sm leading-relaxed font-serif">
                                        {round.partnerBAnswer || '—'}
                                    </p>
                                </div>
                            </div>

                            {/* Bridge Task Details */}
                            {round.bridgeTask && (
                                <div className="glass-warm rounded-xl p-4 space-y-3">
                                    {round.bridgeTask.observation && (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <Lightbulb size={12} className="text-hearth-glow" />
                                                <span className="text-hearth-glow text-[9px] tracking-[0.2em] uppercase">Observation</span>
                                            </div>
                                            <p className="text-hearth-paper/70 text-sm leading-relaxed mb-4">
                                                {round.bridgeTask.observation}
                                            </p>
                                        </>
                                    )}

                                    <div className="space-y-2 pt-2">
                                        <div className="flex gap-2 items-start">
                                            <Footprints size={12} className="text-hearth-clay/50 mt-0.5 flex-shrink-0" />
                                            <p className="text-hearth-paper/40 text-xs">{round.bridgeTask.taskA}</p>
                                        </div>
                                        <div className="flex gap-2 items-start">
                                            <Footprints size={12} className="text-hearth-ember/50 mt-0.5 flex-shrink-0" />
                                            <p className="text-hearth-paper/40 text-xs">{round.bridgeTask.taskB}</p>
                                        </div>
                                    </div>

                                    <div className="pt-2 text-center">
                                        <p className="text-hearth-glow/80 text-xs italic font-serif">
                                            "{round.bridgeTask.insight}"
                                        </p>
                                    </div>

                                    {/* Re-Cross Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onReCross(round._id);
                                        }}
                                        className="w-full mt-2 py-3 rounded-xl text-hearth-clay/70 text-[10px] tracking-[0.15em] uppercase border border-hearth-clay/15 hover:bg-hearth-clay/8 hover:text-hearth-clay transition-all flex items-center justify-center gap-2"
                                    >
                                        <RotateCcw size={12} />
                                        Re-Cross This Bridge
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export const RoundHistory = ({ rounds, onClose, onReCross }: RoundHistoryProps) => {
    const completedRounds = rounds.filter((r) => r.status === 'completed');

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-hearth-dark/95 backdrop-blur-lg overflow-y-auto safe-top safe-bottom"
        >
            <div className="max-w-md mx-auto p-6 space-y-4">
                <div className="flex items-center justify-between py-4">
                    <div>
                        <h2 className="font-serif text-2xl text-hearth-paper">Past Crossings</h2>
                        {completedRounds.length > 0 && (
                            <p className="text-hearth-paper/25 text-[10px] mt-1">
                                {completedRounds.length} bridge{completedRounds.length !== 1 ? 's' : ''} crossed together
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-hearth-paper/40 text-xs tracking-widest uppercase hover:text-hearth-paper/70 transition-colors"
                    >
                        Close
                    </button>
                </div>

                {completedRounds.length === 0 ? (
                    <div className="text-center py-20 space-y-4">
                        <Clock size={32} className="text-hearth-stone mx-auto" />
                        <p className="text-hearth-paper/40 text-sm">No crossings yet.</p>
                        <p className="text-hearth-paper/25 text-xs">Begin your first round to start building bridges.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {completedRounds.map((round, i) => (
                            <HistoryCard
                                key={round._id}
                                round={round}
                                index={i}
                                onReCross={onReCross}
                            />
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};
