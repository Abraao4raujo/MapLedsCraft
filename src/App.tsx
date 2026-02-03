"use client"
import { Blocks, Heart, HelpCircle, Info, Menu, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import EditorPixelArt from "./components/EditorPixelArt";
import TipsModal from "./components/TipsModal";
import traduzirBlocos from "./helpers/traduzirBlocos";

interface MapColorBase {
  base_id: number;
  category: string;
  rgb: [number, number, number];
  blocks: string[];
}

interface SelectedBlockInfo {
  name: string;
  baseColor: [number, number, number];
  variantColors: {
    camada_0: [number, number, number];
    normal: [number, number, number];
    camada_2: [number, number, number];
    camada_3: [number, number, number];
  };
}

const calc = (rgb: [number, number, number], m: number): [number, number, number] =>
  rgb.map(c => Math.floor((c * m) / 255)) as [number, number, number];

export default function App() {
  const [data, setData] = useState<MapColorBase[]>([]);
  const [selecionarBloco, setSelecionarBloco] = useState<SelectedBlockInfo | null>(null);
  const [filtro, setFiltro] = useState("");
  const [infoAberta, setInfoAberta] = useState<number | null>(null);
  const [sidebarMobile, setSidebarMobile] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const onSelectBlock = (name: string, rgb: [number, number, number]) => {
    handleSelect(name, rgb);
    setSidebarMobile(false);
  }

  const categoriasFiltradas = useMemo(() => {
    if (!filtro) return data;
    const term = filtro.toLowerCase();
    return data.filter(categoria =>
      categoria.category.toLowerCase().includes(term) ||
      categoria.blocks.some(b => b.toLowerCase().includes(term) ||
        categoria.blocks.some((block) => traduzirBlocos(block).toLowerCase().includes(term))
      )
    );
  }, [data, filtro]);

  const handleSelect = (blockName: string, baseRGB: [number, number, number]) => {
    setSelecionarBloco({
      name: blockName,
      baseColor: baseRGB,
      variantColors: {
        camada_0: calc(baseRGB, 180),
        normal: calc(baseRGB, 220),
        camada_2: calc(baseRGB, 255),
        camada_3: calc(baseRGB, 135)
      }
    });
  };

  useEffect(() => {
    fetch("/cores-mine.json")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("Erro ao carregar dados:", err));
  }, []);

  return (<>
    <nav className="h-16 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-6 z-40">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
          <Blocks size={18} className="text-white" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
          <h1 className="text-sm font-black uppercase tracking-tighter leading-none">Map Leds Craft</h1>
          <span className="text-[10px] text-muted-foreground hidden xs:block">
            Desenvolvido por Abraao Araujo
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={() => window.open('https://donate.stripe.com/dRm4gs5BE5tIdC71i9cjS00', '_blank')}
          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest border border-emerald-600/20"
        >
          <Heart size={14} fill="currentColor" />
          <span className="hidden lg:inline">Apoiar Projeto</span>
        </button>

        <div className="h-6 w-[1px] bg-border hidden sm:block" />

        <button
          onClick={() => setShowTips(true)}
          className="flex items-center gap-2 px-4 py-2 hover:bg-muted rounded-full transition-all text-xs font-bold uppercase tracking-widest"
        >
          <HelpCircle size={16} className="text-blue-500" />
          <span className="hidden md:inline">Dicas</span>
        </button>

        <button
          onClick={() => setSidebarMobile(!sidebarMobile)}
          className="md:hidden p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/20"
        >
          {sidebarMobile ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </nav>
    <main className="min-h-screen bg-background flex flex-col md:flex-row p-0 gap-0 h-screen overflow-hidden text-foreground">
      {showTips && <TipsModal onClose={() => setShowTips(false)} />}

      <div className="flex-1 relative flex flex-col items-center justify-center overflow-hidden bg-zinc-900">
        {/* Overlay de Textura */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `url('https://www.transparenttextures.com/patterns/carbon-fibre.png'), url('https://minecraft.wiki/images/Dirt_JE2_BE2.png?8493a')`,
            backgroundRepeat: 'repeat',
            backgroundSize: 'auto, 64px',
            imageRendering: 'pixelated',
          }}
        />

        {/* Gradiente para profundidade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

        {/* Conteúdo do Editor */}
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          {selecionarBloco ? (
            <div className="w-full h-full flex items-center justify-center p-2 md:p-6">
              <EditorPixelArt
                blockName={traduzirBlocos(selecionarBloco.name)}
                activeVariantColors={selecionarBloco.variantColors}
                allBlocks={data}
              />
            </div>
          ) : (
            <div className="text-center p-8 md:p-12 border-2 border-dashed border-white/20 bg-black/40 backdrop-blur-md rounded-2xl mx-4 shadow-2xl">
              <Blocks size={48} className="mx-auto mb-4 text-blue-500 opacity-50" />
              <p className="text-white font-bold text-lg md:text-xl tracking-tight">
                PRONTO PARA COMEÇAR?
              </p>
              <p className="text-zinc-400 text-sm mt-2">
                Selecione um bloco na biblioteca ao lado
              </p>
              <button
                onClick={() => setSidebarMobile(true)}
                className="mt-6 md:hidden px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/30"
              >
                Abrir Biblioteca
              </button>
            </div>
          )}
        </div>
      </div>

      <aside className={`
  fixed inset-0 z-30 bg-zinc-900 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:inset-auto md:w-80 border-l border-white/10 flex flex-col shadow-2xl
  ${sidebarMobile ? "translate-x-0" : "translate-x-full md:translate-x-0"}
`}>
        <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-100">Biblioteca</h2>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-[10px] text-zinc-500 font-bold uppercase">Materiais Disponíveis</p>
            </div>
          </div>
          <button className="md:hidden p-2" onClick={() => setSidebarMobile(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4 bg-muted/10">
          <input
            type="text"
            placeholder="Buscar bloco ou cor..."
            className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {categoriasFiltradas.map((cat, index) => {
            const representante = cat.blocks[0] || cat.category;
            const isSelected = selecionarBloco?.name === representante;

            return (
              <div key={index} className="group relative flex flex-col">
                <div className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${isSelected ? 'bg-blue-600/20 border border-blue-600/50' : 'hover:bg-muted'}`}>
                  <button
                    onClick={() => onSelectBlock(representante, cat.rgb)}
                    className="flex-1 flex items-center gap-3 text-left"
                  >
                    <div
                      className="w-10 h-10 rounded shadow-inner border border-black/20 shrink-0"
                      style={{ backgroundColor: `rgb(${cat.rgb.join(",")})` }}
                    />
                    <div className="flex flex-col overflow-hidden">
                      <span className={`text-sm font-bold truncate ${isSelected ? 'text-blue-400' : ''}`}>
                        {traduzirBlocos(representante)}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase">{cat.category}</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setInfoAberta(infoAberta === cat.base_id ? null : cat.base_id)}
                    className="p-2 hover:bg-white/10 rounded-full text-muted-foreground"
                  >
                    <Info size={16} />
                  </button>
                </div>

                {infoAberta === cat.base_id && (
                  <div className="mx-2 mb-2 p-3 bg-muted/50 rounded-b-lg border-x border-b border-border">
                    <p className="text-[10px] font-bold text-muted-foreground mb-2 uppercase">Equivalentes:</p>
                    <div className="flex flex-wrap gap-1">
                      {cat.blocks.slice(1).map((b, i) => (
                        <span key={i} className="text-[10px] bg-background px-2 py-1 rounded border border-border whitespace-nowrap">
                          {traduzirBlocos(b)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </main>
  </>
  );
}