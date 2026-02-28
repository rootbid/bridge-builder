import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

interface AnswerCardProps {
  text?: string;
  author: string;
  isHidden: boolean;
  isRevealing?: boolean;
}

export const AnswerCard = ({ text, author, isHidden, isRevealing }: AnswerCardProps) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="glass rounded-3xl p-6 relative overflow-hidden"
  >
    {/* Grain overlay */}
    <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20256%20256%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22n%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.9%22%20numOctaves%3D%224%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23n)%22%2F%3E%3C%2Fsvg%3E')]" />

    <div className="relative z-10">
      <div className="text-hearth-paper/40 text-[10px] tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
        {author}
        {isHidden && <Lock size={10} className="text-hearth-paper/20" />}
      </div>

      {isHidden ? (
        <motion.div
          animate={{ scale: [1, 1.02, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="h-20 rounded-xl bg-hearth-paper/[0.03] flex items-center justify-center border border-hearth-paper/5"
        >
          <span className="text-hearth-paper/15 text-xs italic tracking-wider">Sealed</span>
        </motion.div>
      ) : (
        <motion.div
          initial={isRevealing ? { filter: 'blur(20px)', opacity: 0, scale: 0.92 } : false}
          animate={{ filter: 'blur(0px)', opacity: 1, scale: 1 }}
          transition={isRevealing ? { duration: 1.2, ease: [0.16, 1, 0.3, 1] } : undefined}
          className="text-hearth-paper text-lg font-serif leading-relaxed"
        >
          {text}
        </motion.div>
      )}
    </div>
  </motion.div>
);
