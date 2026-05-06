import { motion } from 'motion/react';
import { TEAMS } from '../constants';
import { TeamId } from '../types';

interface VotingResultsProps {
  counts: Record<TeamId, number>;
  total: number;
}

export default function VotingResults({ counts, total }: VotingResultsProps) {
  const sortedTeams = [...TEAMS].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));

  return (
    <div className="space-y-6 w-full max-w-2xl mx-auto p-8 bg-zinc-900/50 backdrop-blur-md rounded-3xl border border-zinc-800">
      <div className="flex justify-between items-end mb-4">
        <h2 className="text-2xl font-bold text-white">Live Real-time Stats</h2>
        <span className="text-zinc-400 font-mono text-sm">{total.toLocaleString()} total votes</span>
      </div>
      
      <div className="space-y-4">
        {sortedTeams.map((team) => {
          const count = counts[team.id] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          
          return (
            <div key={team.id} className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: team.color }}></span>
                  {team.name}
                </span>
                <span className="text-zinc-400">
                  {count.toLocaleString()} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: team.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
