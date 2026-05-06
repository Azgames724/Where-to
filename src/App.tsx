/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  onSnapshot, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Trophy, Globe, CheckCircle2, Loader2, Info } from 'lucide-react';
import { db, auth, signInAnon, logout, handleFirestoreError, OperationType } from './firebase';
import { TEAMS } from './constants';
import { TeamId, Vote } from './types';
import TeamCard from './components/TeamCard';
import VotingResults from './components/VotingResults';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState<TeamId | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<TeamId | null>(null);
  const [votingInProgress, setVotingInProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [globalCounts, setGlobalCounts] = useState<Record<TeamId, number>>({
    madrid: 0,
    city: 0,
    bayern: 0,
    arsenal: 0,
    barcelona: 0,
  });
  const [totalVotes, setTotalVotes] = useState(0);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Check if user has already voted
        try {
          const voteDoc = await getDoc(doc(db, 'votes', u.uid));
          if (voteDoc.exists()) {
            setHasVoted(true);
            setUserVote(voteDoc.data().teamId as TeamId);
          }
        } catch (error) {
          console.error("Error checking vote status:", error);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-time votes listener
  useEffect(() => {
    const votesCol = collection(db, 'votes');
    const unsubscribe = onSnapshot(votesCol, (snapshot) => {
      const counts: Record<TeamId, number> = {
        madrid: 0,
        city: 0,
        bayern: 0,
        arsenal: 0,
        barcelona: 0,
      };
      
      snapshot.docs.forEach(doc => {
        const data = doc.data() as Vote;
        if (data.teamId in counts) {
          counts[data.teamId]++;
        }
      });
      
      setGlobalCounts(counts);
      setTotalVotes(snapshot.size);
    }, (error) => {
      console.error("Error listening to votes:", error);
    });

    return () => unsubscribe();
  }, []);

  const handleVote = async () => {
    if (!selectedTeam || hasVoted || votingInProgress) return;

    setVotingInProgress(true);
    setError(null);
    
    try {
      let currentUser = auth.currentUser || user;
      if (!currentUser) {
        try {
          const cred = await signInAnon();
          currentUser = cred.user;
        } catch (authError: any) {
          console.error("Auth error:", authError);
          if (authError.message?.includes('admin-restricted-operation') || authError.code === 'auth/admin-restricted-operation') {
             throw new Error("CRITICAL: Anonymous Auth is DISABLED. Please go to Firebase Console > Authentication > Sign-in method and ENABLE 'Anonymous' to allow voting.");
          }
          throw new Error("Authentication failed. Please try again.");
        }
      }

      if (!currentUser) throw new Error("User authentication failed.");

      const voteData: Vote = {
        teamId: selectedTeam,
        userId: currentUser.uid,
        votedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'votes', currentUser.uid), voteData);
      setHasVoted(true);
      setUserVote(selectedTeam);
    } catch (e: any) {
      console.error("Vote failed:", e);
      let message = "Submission failed. Please try again.";
      if (e.message && e.message.includes("permissions")) {
        message = "Permission denied. Please try refreshing.";
      } else if (e.message) {
        message = e.message;
      }
      setError(message);
    } finally {
      setVotingInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-indigo-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150 mix-blend-overlay" />
      </div>

      <header className="relative z-10 border-b border-zinc-900 bg-black/50 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 rotate-3">
              <Trophy className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight uppercase">
              Mbappé <span className="text-indigo-400">Tracker</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full border border-zinc-800 text-xs font-bold text-zinc-400 uppercase tracking-widest">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live Feed
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-16">
        {/* Stunning Hero Visual Section */}
        <div className="relative rounded-[40px] overflow-hidden mb-20 p-12 lg:p-24 border border-white/10 group shadow-3xl">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000&auto=format&fit=crop" 
              alt="Stadium" 
              className="w-full h-full object-cover opacity-40 scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
            
            {/* Mbappé Side Portrait Overlay */}
            <div className="absolute right-0 bottom-0 top-0 w-full lg:w-1/2 overflow-hidden pointer-events-none opacity-40 lg:opacity-100">
              <motion.img 
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                src="https://www.pngarts.com/files/10/Kylian-Mbappe-PNG-Photo.png" 
                alt="Kylian Mbappé Portrait" 
                className="h-full w-full object-contain object-right-bottom scale-110 grayscale-0 contrast-100"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
            <div className="text-left space-y-6 max-w-2xl flex-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-indigo-300 text-xs font-black uppercase tracking-[0.3em]"
              >
                <Globe size={14} className="animate-pulse" />
                anonymous global poll
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-6xl lg:text-8xl font-black tracking-tighter leading-[0.85] text-white"
              >
                THE <span className="text-white text-glow">TRANSFER</span> <br /> OF THE <span className="italic font-serif text-indigo-500">CENTURY</span>
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-zinc-300 text-xl font-medium max-w-xl leading-relaxed"
              >
                The king of Europe. The world's most wanted signature. Join the global prediction and cast your one-time vote.
              </motion.p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Voting Station */}
          <section className="space-y-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                <CheckCircle2 size={18} className="text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold uppercase tracking-tight">The Contenders</h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {TEAMS.map((team) => (
                <TeamCard 
                  key={team.id}
                  team={team}
                  selected={selectedTeam === team.id}
                  onSelect={(id) => setSelectedTeam(id)}
                  disabled={hasVoted}
                  votedForThis={userVote === team.id}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {hasVoted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-8 bg-indigo-500 rounded-2xl text-center shadow-2xl shadow-indigo-500/40 relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-white drop-shadow-lg" />
                  <h4 className="text-2xl font-black text-white leading-tight mb-2">VOTE REGISTERED!</h4>
                  <p className="text-indigo-100 font-medium">You predicted {TEAMS.find(t => t.id === userVote)?.name} for Mbappé's next chapter.</p>
                  
                  {/* Decorative Elements */}
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <button 
                    disabled={!selectedTeam || votingInProgress}
                    onClick={handleVote}
                    className={`w-full py-5 rounded-2xl font-black text-xl transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 ${
                      selectedTeam && !votingInProgress
                        ? 'bg-white text-black hover:bg-zinc-200' 
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                    }`}
                  >
                    {votingInProgress ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      'SUBMIT PREDICTION'
                    )}
                  </button>
                  
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold uppercase text-center"
                    >
                      {error}
                    </motion.div>
                  )}
                  
                  <div className="flex items-start gap-3 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                    <Info size={16} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-zinc-500 leading-relaxed uppercase tracking-wider">
                      We use anonymous device IDs to prevent multiple votes. No personal data or email is collected.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Results Station */}
          <VotingResults counts={globalCounts} total={totalVotes} />
        </div>
      </main>

      <footer className="relative z-10 border-t border-zinc-900 bg-black/80 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center text-zinc-500 space-y-4">
          <p className="text-sm font-medium tracking-wide uppercase">© 2026 WORLDWIDE MBAPPÉ COUNTER. BUILT FOR THE FANS.</p>
          <div className="flex justify-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all cursor-default">
             <Trophy size={18} />
             <div className="w-px h-5 bg-zinc-800 self-center" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Madrid • City • Bayern • Arsenal • Barca</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
