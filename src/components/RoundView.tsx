import { useState, useEffect, useCallback, useRef } from 'react';
import { useMachine } from '@xstate/react';
import { bridgeMachine } from '../machine/bridgeMachine';
import { AnswerCard } from './AnswerCard';
import { BridgeTaskCard } from './BridgeTaskCard';
import { QuestionDisplay } from './QuestionDisplay';
import { StatusIndicator } from './StatusIndicator';
import { TypingPulse } from './TypingPulse';
import { RoundHistory } from './RoundHistory';
import { JourneyButton } from './JourneyButton';
import { UserGuide } from './UserGuide';
import { getRandomQuestion, HIGH_FRICTION_QUESTIONS, type Question } from '../data/questions';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo, animate } from 'framer-motion';
import { Send, RefreshCw, BookOpen, LogOut, Compass, Eye, Footprints, PenLine, HelpCircle, Share2, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useCouple } from '../context/CoupleContext';
import { getDeviceFingerprint } from '../utils/fingerprint';

export const RoundView = () => {
  const { coupleId, partnerRole, sessionToken, inviteCode, clearCoupleData } = useCouple();
  const [state, send] = useMachine(bridgeMachine);
  const [inputText, setInputText] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [questionMode, setQuestionMode] = useState<'discover' | 'custom'>('discover');
  const [customQuestion, setCustomQuestion] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deviceFingerprint, setDeviceFingerprint] = useState<string>('');
  const [proposedQuestion, setProposedQuestion] = useState<Question | null>(null);
  const dragX = useMotionValue(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const typedCoupleId = coupleId as Id<'couples'>;

  // Convex Hooks
  const latestRound = useQuery(api.rounds.getLatestRound, sessionToken ? { coupleId: typedCoupleId, sessionToken } : 'skip');
  const roundHistory = useQuery(api.rounds.getHistory, sessionToken ? { coupleId: typedCoupleId, sessionToken } : 'skip');
  const usedQuestionIds = useQuery(api.rounds.getUsedQuestionIds, sessionToken ? { coupleId: typedCoupleId, sessionToken } : 'skip');
  const partnerPresence = useQuery(api.presence.getPartnerPresence, sessionToken ? {
    coupleId: typedCoupleId,
    sessionToken,
  } : 'skip');

  const startRoundMutation = useMutation(api.rounds.startRound);
  const submitAnswerMutation = useMutation(api.rounds.submitAnswer);
  const revealAnswersMutation = useMutation(api.rounds.revealAnswers);
  const analyzeBridgeAction = useAction(api.ai.analyzeBridge);
  const completeBridgeTaskMutation = useMutation(api.rounds.completeBridgeTask);
  const submitBridgeFeedbackMutation = useMutation(api.rounds.submitBridgeFeedback);
  const setTypingMutation = useMutation(api.presence.setTyping);
  const reCrossRoundMutation = useMutation(api.rounds.reCrossRound);

  // Fetch device fingerprint on mount (required for rate limiting logic when Laying Bridge)
  useEffect(() => {
    getDeviceFingerprint().then(fingerprint => {
      setDeviceFingerprint(fingerprint);
    }).catch(console.error);
  }, []);

  // Rate limit query
  const rateLimit = useQuery(
    api.rateLimits.checkLimit,
    deviceFingerprint ? { fingerprint: deviceFingerprint } : 'skip'
  );

  // Compute device fingerprint on mount
  useEffect(() => {
    getDeviceFingerprint().then(setDeviceFingerprint);
  }, []);

  // Pair the machine on mount
  useEffect(() => {
    if (coupleId && partnerRole && !state.matches('waiting') && !state.matches('answering')) {
      send({ type: 'PAIR', coupleId, partnerRole });
    }
  }, [coupleId, partnerRole]);

  // Start from waiting if round already exists
  useEffect(() => {
    if (latestRound && latestRound.status !== 'completed' && state.matches('waiting')) {
      send({
        type: 'START',
        roundId: latestRound._id,
        roundNumber: latestRound.roundNumber,
        question: latestRound.questionText,
        questionCategory: latestRound.questionCategory,
      });
    }
  }, [latestRound, state]);

  // Auto-show share modal if they are the creator, have an invite code, and haven't started yet
  useEffect(() => {
    if (inviteCode && partnerRole === 'A' && roundHistory?.length === 0) {
      const timer = setTimeout(() => setShowShareModal(true), 600);
      return () => clearTimeout(timer);
    }
  }, [inviteCode, partnerRole, roundHistory]);

  const copyTextToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => console.error("Clipboard failed:", err));
    } else {
      // Fallback for insecure contexts (like LAN testing)
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        if (document.execCommand('copy')) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const copyCode = () => {
    if (!inviteCode) return;
    copyTextToClipboard(inviteCode);
  };

  const copyFullMessage = () => {
    if (!inviteCode) return;
    copyTextToClipboard(`Join me on The Bridge Builder. Our journey code is: ${inviteCode}`);
  };

  const shareCode = async () => {
    if (!inviteCode) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'The Bridge Builder',
          text: `Join me on The Bridge Builder. Our journey code is: ${inviteCode}`
        });
      } catch (err) {
        console.log("Native share failed");
      }
    }
  };

  // Sync XState with Convex State
  useEffect(() => {
    if (latestRound && (state.matches('answering') || state.matches('all_submitted') || state.matches('revealing') || state.matches('bridging'))) {
      const myAnswer = partnerRole === 'A'
        ? (latestRound.partnerAAnswer || null)
        : (latestRound.partnerBAnswer || null);
      const partnerSubmitted = partnerRole === 'A'
        ? latestRound.partnerBSubmitted
        : latestRound.partnerASubmitted;
      const isRevealed = ['revealing', 'bridging', 'completed'].includes(latestRound.status);
      const partnerAnswer = isRevealed
        ? (partnerRole === 'A' ? (latestRound.partnerBAnswer || null) : (latestRound.partnerAAnswer || null))
        : null;

      send({ type: 'SYNC_STATE', myAnswer, partnerSubmitted, partnerAnswer, status: latestRound.status });

      if (latestRound.status === 'revealing' && state.matches('all_submitted') && partnerAnswer) {
        setIsRevealing(true);
        send({ type: 'REVEAL', partnerAnswer });
      }

      if (latestRound.bridgeTask && !state.context.bridgeTask) {
        setIsGenerating(false);
        send({
          type: 'BRIDGE_TASK_READY',
          taskA: latestRound.bridgeTask.taskA,
          taskB: latestRound.bridgeTask.taskB,
          insight: latestRound.bridgeTask.insight,
        });
      }

      if (latestRound.status === 'completed' && state.matches('bridging')) {
        send({ type: 'COMPLETE' });
        if (!showReflection) setShowReflection(true);
      }
    }
  }, [latestRound, send, partnerRole, state, showReflection]);

  // Typing presence
  const handleTyping = useCallback((text: string) => {
    setInputText(text);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (sessionToken) {
      setTypingMutation({
        coupleId: typedCoupleId,
        sessionToken,
        isTyping: true,
      });

      typingTimeoutRef.current = setTimeout(() => {
        setTypingMutation({
          coupleId: typedCoupleId,
          sessionToken,
          isTyping: false,
        });
      }, 2000);
    }
  }, [typedCoupleId, sessionToken, setTypingMutation]);

  useEffect(() => {
    if (questionMode === 'discover' && !proposedQuestion && usedQuestionIds !== undefined) {
      setProposedQuestion(getRandomQuestion(usedQuestionIds || []));
    }
  }, [questionMode, proposedQuestion, usedQuestionIds]);

  const handleNextQuestion = useCallback(() => {
    if (!proposedQuestion) return;
    let nextQ = getRandomQuestion(usedQuestionIds || []);
    let attempts = 0;
    while (nextQ.id === proposedQuestion.id && attempts < 10) {
      // Fallback to random question from full list to guarantee a change
      const pool = HIGH_FRICTION_QUESTIONS.filter(q => q.id !== proposedQuestion.id);
      nextQ = pool[Math.floor(Math.random() * pool.length)];
      attempts++;
    }
    setProposedQuestion(nextQ);
  }, [proposedQuestion, usedQuestionIds]);

  const handleStartProposed = async () => {
    if (!proposedQuestion || !sessionToken) return;
    const roundId = await startRoundMutation({
      coupleId: typedCoupleId,
      questionId: proposedQuestion.id,
      questionText: proposedQuestion.text,
      questionCategory: proposedQuestion.category,
      sessionToken: sessionToken,
    });
    const count = (roundHistory?.length || 0) + 1;
    send({ type: 'START', roundId, roundNumber: count, question: proposedQuestion.text, questionCategory: proposedQuestion.category });
  };

  const handleStartCustom = async () => {
    if (!customQuestion.trim()) return;
    const customId = 'custom_' + Date.now().toString(36);
    const roundId = await startRoundMutation({
      coupleId: typedCoupleId,
      questionId: customId,
      questionText: customQuestion.trim(),
      questionCategory: 'Custom',
      sessionToken: sessionToken!,
    });
    const count = (roundHistory?.length || 0) + 1;
    send({ type: 'START', roundId, roundNumber: count, question: customQuestion.trim(), questionCategory: 'Custom' });
    setCustomQuestion('');
    setQuestionMode('discover');
  };

  const handleSubmit = async () => {
    if (inputText.trim() && latestRound && sessionToken) {
      setTypingMutation({ coupleId: typedCoupleId, sessionToken, isTyping: false });
      await submitAnswerMutation({
        roundId: latestRound._id,
        sessionToken,
        answer: inputText,
      });
      send({ type: 'SUBMIT_ANSWER', answer: inputText });
      setInputText('');
    }
  };

  const handleReveal = async () => {
    if (latestRound && sessionToken) {
      await revealAnswersMutation({ roundId: latestRound._id, sessionToken });
      setIsRevealing(true);
      const pAnswer = partnerRole === 'A'
        ? (latestRound.partnerBAnswer || '')
        : (latestRound.partnerAAnswer || '');
      send({ type: 'REVEAL', partnerAnswer: pAnswer });
    }
  };

  const handleLayBridge = async () => {
    if (latestRound && latestRound.partnerAAnswer && latestRound.partnerBAnswer) {
      if (!deviceFingerprint) return;
      setIsGenerating(true);
      try {
        await analyzeBridgeAction({
          roundId: latestRound._id,
          question: latestRound.questionText,
          partnerAAnswer: latestRound.partnerAAnswer,
          partnerBAnswer: latestRound.partnerBAnswer,
          deviceFingerprint,
        });
      } catch (err: any) {
        setIsGenerating(false);
        // Show rate limit error to user
        if (err?.message?.includes('Daily limit')) {
          alert(err.message);
        }
      }
    }
  };

  const handleCompleteTask = async () => {
    if (latestRound && sessionToken) {
      await completeBridgeTaskMutation({ roundId: latestRound._id, sessionToken });
    }
  };

  const handleFeedback = async (feedback: 'positive' | 'negative') => {
    if (latestRound && sessionToken) {
      await submitBridgeFeedbackMutation({ roundId: latestRound._id, sessionToken, feedback });
    }
  };

  const handleNewRound = () => {
    setShowReflection(false);
    send({ type: 'NEW_ROUND' });
    setInputText('');
    setIsRevealing(false);
    setIsGenerating(false);
  };

  const handleReCross = async (roundId: string) => {
    setShowHistory(false);
    if (sessionToken) {
      await reCrossRoundMutation({
        coupleId: typedCoupleId,
        originalRoundId: roundId as Id<'rounds'>,
        sessionToken,
      });
    }
    // The Convex subscription will auto-sync the new round
  };

  const mySubmitted = partnerRole === 'A'
    ? latestRound?.partnerASubmitted
    : latestRound?.partnerBSubmitted;
  const myAnswer = partnerRole === 'A'
    ? latestRound?.partnerAAnswer
    : latestRound?.partnerBAnswer;
  const partnerSubmitted = partnerRole === 'A'
    ? latestRound?.partnerBSubmitted
    : latestRound?.partnerASubmitted;
  const partnerAnswer = partnerRole === 'A'
    ? latestRound?.partnerBAnswer
    : latestRound?.partnerAAnswer;

  const roundStatus = latestRound?.status || 'waiting';
  const completedCount = roundHistory?.filter(r => r.status === 'completed').length || 0;

  return (
    <div className="min-h-screen flex flex-col p-6 max-w-md mx-auto relative safe-top safe-bottom">
      {/* Header */}
      <header className="flex justify-between items-center py-4">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-xl text-hearth-paper tracking-wide">The Bridge</h1>
          {latestRound && latestRound.status !== 'completed' && (
            <StatusIndicator status={roundStatus as any} />
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Partner presence dot */}
          {partnerPresence && (
            <div className="flex items-center gap-1.5 mr-1" title={partnerPresence.isOnline ? 'Partner is here' : 'Partner away'}>
              <div
                className={`w-2 h-2 rounded-full transition-colors duration-500 ${partnerPresence.isOnline ? 'bg-hearth-sage/80' : 'bg-hearth-stone/40'
                  }`}
              />
              <span className="text-hearth-paper/15 text-[8px] tracking-wider hidden sm:block">
                {partnerPresence.isOnline ? 'here' : 'away'}
              </span>
            </div>
          )}
          {inviteCode && (
            <button
              onClick={() => setShowShareModal(true)}
              className="p-2 text-hearth-clay/80 hover:text-hearth-clay transition-colors"
              title="Share Invite"
            >
              <Share2 size={18} />
            </button>
          )}
          <button
            onClick={() => setShowHistory(true)}
            className="p-2 text-hearth-stone hover:text-hearth-ember transition-colors"
            title="Past Crossings"
          >
            <BookOpen size={18} />
          </button>
          <button
            onClick={() => setShowGuide(true)}
            className="p-2 text-hearth-stone hover:text-hearth-glow transition-colors"
            title="How It Works"
          >
            <HelpCircle size={18} />
          </button>
          <button
            onClick={clearCoupleData}
            className="p-2 text-hearth-stone hover:text-hearth-paper/50 transition-colors"
            title="Leave Bridge"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-6 mt-4">
        <AnimatePresence mode="wait">
          {/* ── Idle / Ready to Discover ── */}
          {(!latestRound || latestRound.status === 'completed') && !showReflection && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center flex-1 gap-8"
            >
              <div className="text-center space-y-4">
                <motion.div
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <h2 className="font-serif text-3xl text-hearth-paper">Ready to discover?</h2>
                </motion.div>
                <p className="text-hearth-paper/50 text-sm max-w-xs leading-relaxed">
                  A question waits between you. Share your truths. See the gap. Build the bridge. Cross it together.
                </p>
              </div>

              {/* Mode tabs */}
              <div className="flex gap-1 p-1 rounded-xl glass max-w-xs w-full">
                <button
                  onClick={() => setQuestionMode('discover')}
                  className={`flex-1 py-2.5 rounded-lg text-[10px] tracking-[0.15em] uppercase transition-all duration-300 flex items-center justify-center gap-2 ${questionMode === 'discover'
                    ? 'bg-hearth-clay/15 text-hearth-paper/80 border border-hearth-clay/20'
                    : 'text-hearth-paper/30 hover:text-hearth-paper/50'
                    }`}
                >
                  <Compass size={12} />
                  Discover
                </button>
                <button
                  onClick={() => setQuestionMode('custom')}
                  className={`flex-1 py-2.5 rounded-lg text-[10px] tracking-[0.15em] uppercase transition-all duration-300 flex items-center justify-center gap-2 ${questionMode === 'custom'
                    ? 'bg-hearth-clay/15 text-hearth-paper/80 border border-hearth-clay/20'
                    : 'text-hearth-paper/30 hover:text-hearth-paper/50'
                    }`}
                >
                  <PenLine size={12} />
                  Bring Your Own
                </button>
              </div>

              <AnimatePresence mode="wait">
                {questionMode === 'discover' ? (
                  <motion.div
                    key="discover-mode"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="max-w-xs w-full flex flex-col items-center gap-6"
                  >
                    {proposedQuestion && (
                      <div className="relative w-full">
                        <motion.div
                          drag="x"
                          dragConstraints={{ left: 0, right: 0 }}
                          dragElastic={0.4}
                          onDragEnd={(e, info) => {
                            if (Math.abs(info.offset.x) > 50) {
                              handleNextQuestion();
                              animate(dragX, 0, { type: "spring", stiffness: 300, damping: 20 });
                            } else {
                              animate(dragX, 0, { type: "spring", stiffness: 300, damping: 20 });
                            }
                          }}
                          style={{ x: dragX }}
                          className="glass-warm p-6 rounded-3xl min-h-[160px] flex flex-col justify-center border border-hearth-paper/10 relative z-10 touch-pan-y cursor-grab active:cursor-grabbing backdrop-blur-xl"
                        >
                          <p className="text-hearth-paper font-serif text-lg leading-snug tracking-wide text-center pointer-events-none">
                            {proposedQuestion.text}
                          </p>
                          <div className="absolute top-4 left-0 w-full flex justify-between px-4 opacity-30 pointer-events-none">
                            <ChevronLeft size={16} />
                            <ChevronRight size={16} />
                          </div>
                        </motion.div>
                        <div className="text-center mt-3 flex items-center justify-center gap-2 text-hearth-paper/30 text-[10px] uppercase tracking-widest">
                          <RefreshCw size={10} /> Swipe to change
                        </div>
                      </div>
                    )}
                    <JourneyButton
                      label="Select Crossing"
                      sublabel={proposedQuestion?.category || 'A curated question'}
                      icon={<Compass size={16} />}
                      onClick={handleStartProposed}
                      variant="primary"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="custom-mode"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="max-w-xs w-full space-y-4"
                  >
                    <div className="glass rounded-2xl p-4 transition-all focus-within:ring-4 focus-within:ring-hearth-clay/15 focus-within:border-hearth-clay/30">
                      <textarea
                        value={customQuestion}
                        onChange={(e) => setCustomQuestion(e.target.value)}
                        placeholder="What situation is on your mind?&#10;&#10;e.g. 'When I brought up moving closer to my family last week, I felt like you shut down. What were you feeling?'"
                        className="bg-transparent text-hearth-paper font-serif text-sm resize-none outline-none min-h-[100px] w-full placeholder:text-hearth-paper/15 leading-relaxed"
                      />
                    </div>
                    <JourneyButton
                      label="Start This Crossing"
                      sublabel="Both of you will answer this"
                      icon={<PenLine size={16} />}
                      onClick={handleStartCustom}
                      disabled={!customQuestion.trim()}
                      variant="primary"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {completedCount > 0 && (
                <p className="text-hearth-paper/25 text-xs">
                  {completedCount} crossing{completedCount !== 1 ? 's' : ''} made together
                </p>
              )}
            </motion.div>
          )}

          {/* ── Reflection Moment (after completing a bridge) ── */}
          {showReflection && (
            <motion.div
              key="reflection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center justify-center flex-1 gap-10"
            >
              <motion.div
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="text-center space-y-6 max-w-xs"
              >
                <div className="w-14 h-14 rounded-full glass-warm flex items-center justify-center mx-auto">
                  <span className="text-2xl">🌉</span>
                </div>
                <h2 className="font-serif text-2xl text-hearth-paper leading-snug">
                  You crossed together.
                </h2>
                <p className="text-hearth-paper/40 text-sm italic leading-relaxed">
                  Before you move on — take a breath.<br />
                  What did you notice about your partner that you didn't before?
                </p>
              </motion.div>
              <JourneyButton
                label="Discover Another Crossing"
                sublabel="When you're ready"
                icon={<Compass size={16} />}
                onClick={handleNewRound}
                variant="ghost"
                className="max-w-xs"
              />
            </motion.div>
          )}

          {/* ── Active Round ── */}
          {latestRound && latestRound.status !== 'completed' && (
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Question */}
              <QuestionDisplay
                text={latestRound.questionText}
                category={latestRound.questionCategory}
                roundNumber={latestRound.roundNumber}
              />

              {/* Answers Section */}
              <div className="space-y-4">
                {/* My Answer */}
                {mySubmitted ? (
                  <AnswerCard text={myAnswer} author="You" isHidden={false} />
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-3xl p-5 flex flex-col transition-all focus-within:ring-4 focus-within:ring-hearth-clay/15 focus-within:border-hearth-clay/30"
                  >
                    <textarea
                      value={inputText}
                      onChange={(e) => handleTyping(e.target.value)}
                      placeholder="Speak your truth..."
                      className="bg-transparent text-hearth-paper font-serif text-lg resize-none outline-none min-h-[120px] placeholder:text-hearth-paper/20 leading-relaxed"
                    />
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-hearth-paper/15 text-[10px] font-mono">
                        {inputText.length > 0 ? `${inputText.length} chars` : ''}
                      </span>
                      <button
                        onClick={handleSubmit}
                        disabled={!inputText.trim()}
                        className="bg-hearth-clay p-3 rounded-xl text-hearth-paper disabled:opacity-30 disabled:bg-hearth-stone hover:bg-hearth-clay/80 transition-all hover:scale-105 active:scale-95"
                        title="Share your truth"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Partner typing indicator */}
                <AnimatePresence>
                  {partnerPresence?.isTyping && !partnerSubmitted && (
                    <TypingPulse isTyping={true} />
                  )}
                </AnimatePresence>

                {/* Partner Answer */}
                {(mySubmitted || partnerSubmitted) && (
                  <AnswerCard
                    text={(['revealing', 'bridging'].includes(latestRound.status)) ? partnerAnswer : undefined}
                    author="Partner"
                    isHidden={['answering', 'all_submitted'].includes(latestRound.status)}
                    isRevealing={isRevealing}
                  />
                )}
              </div>

              {/* Journey Action Buttons */}
              <div className="space-y-3 pt-4">
                {latestRound.status === 'all_submitted' && (
                  <JourneyButton
                    label="See the Gap Between Us"
                    icon={<Eye size={16} />}
                    onClick={handleReveal}
                    variant="warm"
                  />
                )}
                {latestRound.status === 'revealing' && !latestRound.bridgeTask && (
                  <JourneyButton
                    label="Lay the Bridge"
                    icon={<Footprints size={16} />}
                    onClick={handleLayBridge}
                    loading={isGenerating}
                    loadingLabel="Laying the bridge..."
                    variant="primary"
                  />
                )}

                {/* Waiting for partner hint */}
                {latestRound.status === 'answering' && mySubmitted && !partnerSubmitted && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-hearth-paper/20 text-[10px] tracking-wider italic py-2"
                  >
                    Waiting for your partner to share their truth...
                  </motion.p>
                )}
              </div>

              {/* Bridge Task Card */}
              {latestRound.status === 'bridging' && latestRound.bridgeTask && (
                <div className="mt-4">
                  <BridgeTaskCard
                    taskA={latestRound.bridgeTask.taskA}
                    taskB={latestRound.bridgeTask.taskB}
                    insight={latestRound.bridgeTask.insight}
                    partnerRole={partnerRole || 'A'}
                    myTaskCompleted={partnerRole === 'A' ? latestRound.partnerATaskCompleted : latestRound.partnerBTaskCompleted}
                    partnerTaskCompleted={partnerRole === 'A' ? latestRound.partnerBTaskCompleted : latestRound.partnerATaskCompleted}
                    myFeedback={partnerRole === 'A' ? latestRound.partnerAFeedback : latestRound.partnerBFeedback}
                    onFeedback={handleFeedback}
                    onComplete={handleCompleteTask}
                  />
                </div>
              )}
            </motion.div>
          )}
          {/* Share Fallback Modal */}
          <AnimatePresence>
            {showShareModal && inviteCode && (
              <motion.div
                key="share-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-hearth-dark/80 backdrop-blur-sm"
                onClick={() => setShowShareModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="glass-deep rounded-3xl p-8 max-w-sm w-full space-y-6 text-center border overflow-hidden relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mx-auto w-12 h-12 rounded-full bg-hearth-clay/20 flex flex-col items-center justify-center mb-2">
                    <Share2 className="text-hearth-clay w-6 h-6" />
                  </div>

                  <h3 className="font-serif text-2xl text-hearth-paper">Share Invite</h3>
                  <p className="text-hearth-paper/60 text-sm leading-relaxed">
                    Copy this message and send it to your partner to begin your journey together.
                  </p>

                  <div className="bg-hearth-dark/60 rounded-xl p-4 border border-hearth-clay/10 text-left relative group">
                    <p className="text-hearth-paper font-serif text-sm italic leading-relaxed">
                      "Join me on The Bridge Builder. Our journey code is: <span className="text-hearth-clay font-mono font-bold">{inviteCode}</span>"
                    </p>
                  </div>

                  <button
                    onClick={copyFullMessage}
                    className="w-full py-4 rounded-xl bg-hearth-clay text-hearth-paper font-sans text-sm tracking-widest uppercase hover:bg-hearth-clay/80 transition-all flex items-center justify-center gap-3"
                  >
                    {copied ? 'Copied to Clipboard!' : 'Copy Full Message'}
                  </button>

                  <button
                    onClick={() => setShowShareModal(false)}
                    className="text-hearth-paper/40 text-xs tracking-widest uppercase hover:text-hearth-paper/80 transition-colors mt-2"
                  >
                    Close
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </AnimatePresence>
      </main>

      {/* Overlays */}
      <AnimatePresence>
        {showHistory && (
          <RoundHistory
            rounds={(roundHistory || []) as any}
            onClose={() => setShowHistory(false)}
            onReCross={handleReCross}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGuide && (
          <UserGuide onClose={() => setShowGuide(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};
