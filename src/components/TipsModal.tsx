import { HelpCircle, Info, MousePointer2, X, Zap } from "lucide-react";

interface TipsModalProps {
  onClose: () => void;
}

function TipsModal({ onClose }: TipsModalProps) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">

      <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-[32px] shadow-2xl overflow-hidden shadow-black/50">

        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
          <h2 className="text-white font-black uppercase tracking-tighter flex items-center gap-2">
            <HelpCircle size={18} className="text-blue-500" />
            Dicas de Uso
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400 shrink-0">
              <Zap size={24} />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm uppercase italic tracking-wide">Linhas de Precisão</h4>
              <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">
                Mantenha <kbd className="bg-zinc-800 border border-zinc-600 px-1.5 py-0.5 rounded text-[10px] text-white font-mono">SHIFT</kbd> pressionado para travar o pincel em linha reta.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-400 shrink-0">
              <Info size={24} />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm uppercase italic tracking-wide">Entendendo o Relevo</h4>
              <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">
                As 4 cores representam as variações de altura no Minecraft que geram sombras no mapa oficial.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400 shrink-0">
              <MousePointer2 size={24} />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm uppercase italic tracking-wide">Pintura Fluida</h4>
              <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">
                Clique e deslize livremente! O rastro é preenchido automaticamente, sem deixar falhas.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-zinc-950/50">
          <button
            onClick={onClose}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
          >
            Entendido, vamos lá!
          </button>
        </div>
      </div>
    </div>
  );
}

export default TipsModal;