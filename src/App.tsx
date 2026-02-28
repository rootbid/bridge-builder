import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { RoundView } from './components/RoundView';
import { WelcomeScreen } from './components/WelcomeScreen';
import { CoupleProvider, useCouple } from './context/CoupleContext';

const convexUrl = import.meta.env.VITE_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

function AppContent() {
  const { isOnboarded } = useCouple();

  if (!isOnboarded) {
    return <WelcomeScreen />;
  }

  return (
    <div className="bg-hearth-dark min-h-screen selection:bg-hearth-clay/30">
      <RoundView />
    </div>
  );
}

export default function App() {
  if (!convex) {
    return (
      <div className="bg-hearth-dark min-h-screen flex items-center justify-center p-6">
        <div className="glass rounded-3xl p-8 max-w-md text-center">
          <h1 className="font-serif text-2xl text-hearth-paper mb-4">Configuration Required</h1>
          <p className="text-hearth-paper/60 mb-6 text-sm leading-relaxed">
            To run "The Bridge Builder", set your Convex URL in environment variables.
          </p>
          <div className="bg-hearth-deep/50 p-4 rounded-xl text-left font-mono text-xs text-hearth-paper/40 mb-6">
            VITE_CONVEX_URL="https://your-project.convex.cloud"
          </div>
          <p className="text-hearth-paper/30 text-xs">
            Run <code className="text-hearth-clay/60">npx convex dev</code> to get your URL.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ConvexProvider client={convex}>
      <CoupleProvider>
        <AppContent />
      </CoupleProvider>
    </ConvexProvider>
  );
}
