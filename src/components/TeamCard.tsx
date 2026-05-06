import { motion } from 'motion/react';
import { Team } from '../types';
import { Check } from 'lucide-react';

interface TeamCardProps {
  key?: string | number;
  team: Team;
  selected: boolean;
  onSelect: (id: Team['id']) => void;
  disabled: boolean;
  votedForThis: boolean;
}

export default function TeamCard({ team, selected, onSelect, disabled, votedForThis }: TeamCardProps) {
  return (
    <motion.div
      whileHover={!disabled ? { scale: 1.02, y: -4 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={() => !disabled && onSelect(team.id)}
      className={`relative overflow-hidden rounded-2xl p-6 cursor-pointer border-2 transition-all duration-300 min-h-[160px] group ${
        selected 
          ? 'border-indigo-500 shadow-lg ring-4 ring-indigo-500/20' 
          : 'border-zinc-800 hover:border-zinc-700'
      } ${disabled && !votedForThis ? 'opacity-40 grayscale cursor-not-allowed' : 'opacity-100'} bg-zinc-900 shadow-2xl`}
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={team.image} 
          alt="" 
          className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-500" 
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4">
        <div 
          className="w-20 h-20 rounded-2xl flex items-center justify-center p-2 bg-white/10 backdrop-blur-md border border-white/20 shadow-xl overflow-hidden group-hover:scale-110 transition-transform duration-500"
        >
          <img 
            src={team.logo} 
            alt={team.name} 
            className="w-full h-full object-contain filter drop-shadow-md"
            referrerPolicy="no-referrer"
          />
        </div>
        <h3 className="text-xl font-black text-white text-center tracking-tight uppercase">{team.name}</h3>
        
        {votedForThis && (
          <div className="absolute top-0 right-0 bg-green-500 rounded-full p-1.5 shadow-lg shadow-green-500/50">
            <Check size={14} className="text-white" />
          </div>
        )}
      </div>

      {selected && !disabled && (
        <motion.div 
          layoutId="glow"
          className="absolute inset-0 bg-indigo-500/20 pointer-events-none"
        />
      )}
    </motion.div>
  );
}
