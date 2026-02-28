import { setup, assign } from 'xstate';

export interface BridgeContext {
  coupleId: string | null;
  partnerRole: 'A' | 'B' | null;
  roundId: string | null;
  roundNumber: number;
  question: string | null;
  questionCategory: string | null;
  myAnswer: string | null;
  partnerAnswer: string | null;
  partnerSubmitted: boolean;
  partnerTyping: boolean;
  bridgeTask: {
    taskA: string;
    taskB: string;
    insight: string;
  } | null;
}

export type BridgeEvent =
  | { type: 'PAIR'; coupleId: string; partnerRole: 'A' | 'B' }
  | { type: 'START'; roundId: string; roundNumber: number; question: string; questionCategory?: string }
  | { type: 'SUBMIT_ANSWER'; answer: string }
  | { type: 'PARTNER_SUBMITTED' }
  | { type: 'PARTNER_TYPING'; isTyping: boolean }
  | { type: 'SYNC_STATE'; myAnswer: string | null; partnerSubmitted: boolean; partnerAnswer: string | null; status?: string }
  | { type: 'REVEAL'; partnerAnswer: string }
  | { type: 'BRIDGE_TASK_READY'; taskA: string; taskB: string; insight: string }
  | { type: 'COMPLETE' }
  | { type: 'NEW_ROUND' }
  | { type: 'RESET' }
  | { type: 'UNPAIR' };

const initialContext: BridgeContext = {
  coupleId: null,
  partnerRole: null,
  roundId: null,
  roundNumber: 0,
  question: null,
  questionCategory: null,
  myAnswer: null,
  partnerAnswer: null,
  partnerSubmitted: false,
  partnerTyping: false,
  bridgeTask: null,
};

export const bridgeMachine = setup({
  types: {
    context: {} as BridgeContext,
    events: {} as BridgeEvent,
  },
  actions: {
    setPairing: assign({
      coupleId: ({ event }) => (event.type === 'PAIR' ? event.coupleId : null),
      partnerRole: ({ event }) => (event.type === 'PAIR' ? event.partnerRole : null),
    }),
    setInitialRound: assign({
      roundId: ({ event }) => (event.type === 'START' ? event.roundId : null),
      roundNumber: ({ event }) => (event.type === 'START' ? event.roundNumber : 0),
      question: ({ event }) => (event.type === 'START' ? event.question : null),
      questionCategory: ({ event }) => (event.type === 'START' ? (event.questionCategory || null) : null),
      myAnswer: null,
      partnerAnswer: null,
      partnerSubmitted: false,
      partnerTyping: false,
      bridgeTask: null,
    }),
    setMyAnswer: assign({
      myAnswer: ({ event }) => (event.type === 'SUBMIT_ANSWER' ? event.answer : null),
    }),
    setPartnerSubmitted: assign({
      partnerSubmitted: true,
    }),
    setPartnerTyping: assign({
      partnerTyping: ({ event }) => (event.type === 'PARTNER_TYPING' ? event.isTyping : false),
    }),
    setReveal: assign({
      partnerAnswer: ({ event }) => (event.type === 'REVEAL' ? event.partnerAnswer : null),
    }),
    setBridgeTask: assign({
      bridgeTask: ({ event }) =>
        event.type === 'BRIDGE_TASK_READY'
          ? { taskA: event.taskA, taskB: event.taskB, insight: event.insight }
          : null,
    }),
    syncState: assign({
      myAnswer: ({ event }) => (event.type === 'SYNC_STATE' ? event.myAnswer : null),
      partnerSubmitted: ({ event }) => (event.type === 'SYNC_STATE' ? event.partnerSubmitted : false),
      partnerAnswer: ({ event }) => (event.type === 'SYNC_STATE' ? event.partnerAnswer : null),
    }),
    resetRound: assign({
      roundId: null,
      roundNumber: 0,
      question: null,
      questionCategory: null,
      myAnswer: null,
      partnerAnswer: null,
      partnerSubmitted: false,
      partnerTyping: false,
      bridgeTask: null,
    }),
    clearAll: assign({ ...initialContext }),
  },
  guards: {
    bothSubmitted: ({ context }) => context.myAnswer !== null && context.partnerSubmitted,
    isPaired: ({ context }) => context.coupleId !== null,
  },
}).createMachine({
  id: 'bridge',
  initial: 'unpaired',
  context: { ...initialContext },
  states: {
    unpaired: {
      on: {
        PAIR: {
          target: 'waiting',
          actions: 'setPairing',
        },
      },
    },
    waiting: {
      on: {
        START: {
          target: 'answering',
          actions: 'setInitialRound',
        },
        UNPAIR: {
          target: 'unpaired',
          actions: 'clearAll',
        },
      },
    },
    answering: {
      always: [
        {
          guard: 'bothSubmitted',
          target: 'all_submitted',
        },
      ],
      on: {
        SUBMIT_ANSWER: {
          actions: 'setMyAnswer',
        },
        PARTNER_SUBMITTED: {
          actions: 'setPartnerSubmitted',
        },
        PARTNER_TYPING: {
          actions: 'setPartnerTyping',
        },
        SYNC_STATE: {
          actions: 'syncState',
        },
        RESET: {
          target: 'waiting',
          actions: 'resetRound',
        },
      },
    },
    all_submitted: {
      on: {
        REVEAL: {
          target: 'revealing',
          actions: 'setReveal',
        },
        SYNC_STATE: {
          actions: 'syncState',
        },
      },
    },
    revealing: {
      on: {
        BRIDGE_TASK_READY: {
          target: 'bridging',
          actions: 'setBridgeTask',
        },
        SYNC_STATE: {
          actions: 'syncState',
        },
      },
    },
    bridging: {
      on: {
        COMPLETE: {
          target: 'completed',
        },
        SYNC_STATE: {
          actions: 'syncState',
        },
      },
    },
    completed: {
      on: {
        NEW_ROUND: {
          target: 'waiting',
          actions: 'resetRound',
        },
        RESET: {
          target: 'waiting',
          actions: 'resetRound',
        },
      },
    },
  },
});
