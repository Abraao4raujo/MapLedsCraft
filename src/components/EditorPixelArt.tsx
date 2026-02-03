/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import { Brush, Circle, PaintBucket, Square, Trash, Triangle } from "lucide-react";
import { useRef, useState } from "react";
import traduzirBlocos from "../helpers/traduzirBlocos";

interface EditorPixelArtProps {
  blockName: string
  activeVariantColors: { [key: string]: [number, number, number] };
  allBlocks: { rgb: [number, number, number], blocks: string[] }[];
}

type Tool = 'brush' | 'bucket' | 'square' | 'circle' | 'triangle' | 'skin';

export default function EditorPixelArt({ blockName, activeVariantColors, allBlocks }: EditorPixelArtProps) {
  const GRID_SIZE = 128
  const CANVAS_DISPLAY_SIZE = 420
  const MAP_WRAPPER_SIZEX = 532
  const MAP_WRAPPER_SIZEY = 502
  const PIXEL_SIZE = CANVAS_DISPLAY_SIZE / GRID_SIZE

  const PATTERNS = {
    viniccius13: [
      [0, 0, 0, 0, 0, 0, 0, 0], // Cabelo
      [0, 0, 0, 0, 0, 0, 0, 0], // Cabelo
      [0, 1, 1, 1, 1, 1, 1, 0], // Testa
      [0, 2, 3, 1, 1, 3, 2, 0], // Olhos (Branco + Pupila)
      [1, 2, 3, 1, 1, 3, 2, 1], // Olhos (Branco + Pupila)
      [1, 1, 1, 1, 1, 1, 1, 1], // Rosto + TOPO DOS DENTES (4px) + Fone
      [1, 1, 2, 2, 2, 2, 3, 3], // Rosto + BASE DOS DENTES (4px) + Fone
      [1, 1, 2, 2, 2, 2, 1, 1], // Queixo
    ],
    davi_gamer: [
      [0, 0, 0, 0, 0, 0, 0, 0], // Cabelo (Marrom)
      [0, 0, 0, 0, 0, 0, 0, 0], // Cabelo (Marrom)
      [0, 0, 0, 0, 1, 1, 0, 0], // Cabelo (Marrom)
      [0, 1, 1, 1, 1, 1, 1, 0], // Testa (Pele)
      [1, 3, 1, 1, 1, 1, 3, 1], // Olhos "Derp" (Pupilas nas extremidades)
      [1, 1, 3, 2, 3, 3, 1, 1], // Topo da boca
      [1, 1, 1, 3, 2, 2, 1, 1], // Boca aberta + Dente (2) + Língua parte superior
      [1, 1, 1, 1, 2, 1, 1, 1] // Queixo
    ]
  };

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isPainting, setIsPainting] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<string>("normal")
  const [brushSize, setBrushSize] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [activeTool, setActiveTool] = useState<Tool>('brush');
  const [shapeStart, setShapeStart] = useState<{ x: number, y: number } | null>(null);
  const [selectedSkin, setSelectedSkin] = useState<'viniccius13' | 'davi_gamer'>('viniccius13');

  const [mousePos, setMousePos] = useState({ x: 0, y: 0, visible: false })

  const activeColor = activeVariantColors[selectedVariant] || [0, 0, 0]

  const [startPos, setStartPos] = useState<{ x: number, y: number } | null>(null)
  const [lastPos, setLastPos] = useState<{ x: number, y: number } | null>(null)
  const [inventory, setInventory] = useState<Record<string, number>>({})

  const DYNAMIC_NAMES_MAP: Record<string, string> = {
    camada_0: `${blockName} (Sombra)`,
    normal: `${blockName}`,
    camada_2: `${blockName} (Luz)`,
    camada_3: `${blockName} (Profundo)`,
  };

  function paintSkin(centerX: number, centerY: number, scale: number = 1) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pattern = PATTERNS[selectedSkin];
    const variants = ["camada_0", "normal", "camada_2", "camada_3"];

    pattern.forEach((row, yOffset) => {
      row.forEach((variantIdx, xOffset) => {
        const color = activeVariantColors[variants[variantIdx]];
        const startX = centerX + (xOffset * scale) - Math.floor((8 * scale) / 2);
        const startY = centerY + (yOffset * scale) - Math.floor((8 * scale) / 2);

        ctx.fillStyle = `rgb(${color.join(",")})`;
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            const drawX = startX + sx;
            const drawY = startY + sy;
            if (drawX >= 0 && drawX < GRID_SIZE && drawY >= 0 && drawY < GRID_SIZE) {
              ctx.fillRect(drawX * PIXEL_SIZE, drawY * PIXEL_SIZE, Math.ceil(PIXEL_SIZE), Math.ceil(PIXEL_SIZE));
            }
          }
        }
      });
    });
    updateInventory();
  }

  function updateInventory() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const counts: Record<string, number> = {};
    const colorToNameMap: Record<string, string> = {};
    allBlocks.forEach(block => {
      const baseRGB = block.rgb;
      const bName = block.blocks[0];
      const variants = {
        [bName]: [
          Math.floor(baseRGB[0] * 220 / 255),
          Math.floor(baseRGB[1] * 220 / 255),
          Math.floor(baseRGB[2] * 220 / 255)
        ],
        [`${bName} (Sombra)`]: [
          Math.floor(baseRGB[0] * 180 / 255),
          Math.floor(baseRGB[1] * 180 / 255),
          Math.floor(baseRGB[2] * 180 / 255)
        ],
        [`${bName} (Luz)`]: [
          baseRGB[0],
          baseRGB[1],
          baseRGB[2]
        ],
        [`${bName} (Profundo)`]: [
          Math.floor(baseRGB[0] * 135 / 255),
          Math.floor(baseRGB[1] * 135 / 255),
          Math.floor(baseRGB[2] * 135 / 255)
        ],
      };
      Object.entries(variants).forEach(([name, rgb]) => {
        colorToNameMap[rgb.join(",")] = name;
      });
    });

    for (let gy = 0; gy < GRID_SIZE; gy++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        const px = Math.floor(gx * PIXEL_SIZE + PIXEL_SIZE / 2);
        const py = Math.floor(gy * PIXEL_SIZE + PIXEL_SIZE / 2);

        const i = (py * canvas.width + px) * 4;

        if (imageData[i + 3] > 200) {
          const rgbKey = `${imageData[i]},${imageData[i + 1]},${imageData[i + 2]}`;
          const name = colorToNameMap[rgbKey];
          if (name) {
            counts[name] = (counts[name] || 0) + 1;
          }
        }
      }
    }
    setInventory(counts);
  }

  function paintAt(x: number, y: number) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const [r, g, b] = activeColor
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`

    const offset = Math.floor(brushSize / 2)
    for (let i = 0; i < brushSize; i++) {
      for (let j = 0; j < brushSize; j++) {
        const drawX = x + i - offset
        const drawY = y + j - offset
        if (drawX >= 0 && drawX < GRID_SIZE && drawY >= 0 && drawY < GRID_SIZE) {
          ctx.fillRect(drawX * PIXEL_SIZE, drawY * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE)
        }
      }
    }
  }

  function paintLine(x0: number, y0: number, x1: number, y1: number) {
    const dx = Math.abs(x1 - x0); const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1; const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy; let currX = x0; let currY = y0;
    while (true) {
      paintAt(currX, currY);
      if (currX === x1 && currY === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; currX += sx; }
      if (e2 < dx) { err += dx; currY += sy; }
    }
  }

  function drawSquare(x0: number, y0: number, x1: number, y1: number) {
    const left = Math.min(x0, x1); const right = Math.max(x0, x1);
    const top = Math.min(y0, y1); const bottom = Math.max(y0, y1);
    for (let x = left; x <= right; x++) { paintAt(x, top); paintAt(x, bottom); }
    for (let y = top; y <= bottom; y++) { paintAt(left, y); paintAt(right, y); }
  }

  function drawCircle(x0: number, y0: number, x1: number, y1: number) {
    const radius = Math.floor(Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2)));
    let x = radius; let y = 0; let err = 0;
    while (x >= y) {
      [[x0 + x, y0 + y], [x0 + y, y0 + x], [x0 - y, y0 + x], [x0 - x, y0 + y], [x0 - x, y0 - y], [x0 - y, y0 - x], [x0 + y, y0 - x], [x0 + x, y0 - y]].forEach(([px, py]) => paintAt(px, py));
      if (err <= 0) { y += 1; err += 2 * y + 1; }
      if (err > 0) { x -= 1; err -= 2 * x + 1; }
    }
  }

  function drawTriangle(x0: number, y0: number, x1: number, y1: number) {
    paintLine(x0, y0, x1, y1);
    paintLine(x1, y1, x0 - (x1 - x0), y1);
    paintLine(x0 - (x1 - x0), y1, x0, y0);
  }

  function floodFill(startX: number, startY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const getPixelColor = (gx: number, gy: number) => {
      const cx = Math.floor(gx * PIXEL_SIZE + PIXEL_SIZE / 2);
      const cy = Math.floor(gy * PIXEL_SIZE + PIXEL_SIZE / 2);
      const i = (cy * canvas.width + cx) * 4;
      return [data[i], data[i + 1], data[i + 2], data[i + 3]];
    };
    const [startR, startG, startB, startA] = getPixelColor(startX, startY);
    const [fillR, fillG, fillB] = activeColor;
    if (startR === fillR && startG === fillG && startB === fillB && startA === 255) return;
    const stack: [number, number][] = [[startX, startY]];
    const visited = new Uint8Array(GRID_SIZE * GRID_SIZE);
    ctx.fillStyle = `rgb(${fillR}, ${fillG}, ${fillB})`;
    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const idx = y * GRID_SIZE + x;
      if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE || visited[idx]) continue;
      const [curR, curG, curB, curA] = getPixelColor(x, y);
      if (curR === startR && curG === startG && curB === startB && curA === startA) {
        ctx.fillRect(Math.floor(x * PIXEL_SIZE), Math.floor(y * PIXEL_SIZE), Math.ceil(PIXEL_SIZE), Math.ceil(PIXEL_SIZE));
        visited[idx] = 1;
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
    }
    updateInventory();
  }

  function clearCanvas() {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setInventory({});
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    let x = Math.floor((e.clientX - rect.left) / (rect.width / GRID_SIZE));
    let y = Math.floor((e.clientY - rect.top) / (rect.height / GRID_SIZE));
    if (e.shiftKey && startPos) {
      if (Math.abs(x - startPos.x) > Math.abs(y - startPos.y)) y = startPos.y;
      else x = startPos.x;
    }
    setMousePos({ x: e.clientX, y: e.clientY, visible: true });
    if (isPainting) {
      if (lastPos) paintLine(lastPos.x, lastPos.y, x, y);
      else paintAt(x, y);
      setLastPos({ x, y });
    }
  }

  return (
    <div className="flex flex-col xl:flex-row items-center xl:items-start justify-center gap-6 w-full max-w-7xl mx-auto p-2 md:p-4 h-full">
      <div className="mt-28 w-full xl:w-64 shrink-0">
        <div className="bg-zinc-900/80 p-4 md:p-5 rounded-2xl border border-white/10 backdrop-blur-md sticky top-0">
          <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Lista de Blocos
          </h4>

          <div className="bg-black/20 rounded-xl p-3 border border-white/5 max-h-[400px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-zinc-500 border-b border-white/5">
                  <th className="pb-2 font-medium">Bloco</th>
                  <th className="pb-2 font-medium text-right">Packs</th>
                </tr>
              </thead>
              <tbody className="text-zinc-300">
                {Object.entries(inventory).map(([key, count]) => (
                  <tr key={traduzirBlocos(key)} className="border-b border-white/5 last:border-0">
                    <td className="py-2 pr-2 font-bold leading-tight">{traduzirBlocos(key)}</td>
                    <td className="py-2 text-right font-mono text-blue-400 whitespace-nowrap">
                      {Math.floor(count / 64)}pack + {count % 64}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[9px] text-zinc-500 uppercase font-bold">
            <span>Total de Blocos</span>
            <span className="text-white font-mono">{Object.values(inventory).reduce((a, b) => a + b, 0)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 md:gap-6 w-full">
        {mousePos.visible && (
          <div
            className="hidden md:block fixed pointer-events-none z-50 mix-blend-difference"
            style={{
              left: mousePos.x,
              top: mousePos.y,
              width: (activeTool === 'skin' ? 8 * brushSize : brushSize) * PIXEL_SIZE * zoom,
              height: (activeTool === 'skin' ? 8 * brushSize : brushSize) * PIXEL_SIZE * zoom,
              backgroundColor: activeTool === 'skin' ? 'rgba(255,255,255,0.1)' : `rgb(${activeColor.join(",")})`,
              border: '1px solid white',
              transform: 'translate(-50%, -50%)',
              imageRendering: 'pixelated'
            }}
          />
        )}

        <div className="text-center">
          <h3 className="text-lg md:text-xl font-mono font-bold text-white uppercase tracking-tighter">{blockName}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
          <div className="bg-zinc-800/50 p-3 rounded-xl border border-white/5 flex flex-col gap-2">
            <div className="flex justify-between text-[10px] font-bold uppercase opacity-60">
              <label>Pincel</label> <span className="text-blue-400">{brushSize * brushSize}px</span>
            </div>
            <input type="range" min="1" max="10" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-blue-500" />
          </div>
          <div className="bg-zinc-800/50 p-3 rounded-xl border border-white/5 flex flex-col gap-2">
            <div className="flex justify-between text-[10px] font-bold uppercase opacity-60">
              <label>Zoom</label> <span className="text-amber-400">{zoom}x</span>
            </div>
            <input type="range" min="1" max="4" step="0.5" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-amber-500" />
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2 md:gap-4 bg-zinc-800/30 p-3 rounded-2xl w-full">
          {Object.entries(activeVariantColors).map(([key, rgb]) => (
            <button
              key={key}
              onClick={() => setSelectedVariant(key)}
              className={`flex flex-col items-center gap-1.5 p-1.5 rounded-xl transition-all ${selectedVariant === key ? "bg-white/10 shadow-lg scale-105 ring-2 ring-blue-500" : "opacity-40 hover:opacity-100"}`}
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg border border-black/20" style={{ backgroundColor: `rgb(${rgb.join(",")})` }} />
              <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-tighter">{DYNAMIC_NAMES_MAP[key]}</span>
            </button>
          ))}
        </div>

        <div className="w-full h-[400px] md:h-[550px] overflow-auto border border-white/10 rounded-2xl bg-black/40 relative">
          <div style={{ width: MAP_WRAPPER_SIZEX * zoom, height: MAP_WRAPPER_SIZEY * zoom, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '100%', minHeight: '100%' }}>
            <div
              className="relative transition-transform duration-200 shrink-0"
              style={{
                width: MAP_WRAPPER_SIZEX, height: MAP_WRAPPER_SIZEY,
                transform: `scale(${zoom})`, transformOrigin: 'center center',
                backgroundImage: `url('/mapa/mapa.png')`, backgroundSize: '100% 100%',
                imageRendering: 'pixelated',
              }}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_DISPLAY_SIZE}
                height={CANVAS_DISPLAY_SIZE}
                className="cursor-crosshair absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 touch-none"
                style={{
                  imageRendering: 'pixelated',
                  width: CANVAS_DISPLAY_SIZE,
                  height: CANVAS_DISPLAY_SIZE,
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.1)',
                  backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), 
                      linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                  backgroundSize: `${PIXEL_SIZE}px ${PIXEL_SIZE}px`,
                }}
                onMouseDown={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.floor((e.clientX - rect.left) / (rect.width / GRID_SIZE));
                  const y = Math.floor((e.clientY - rect.top) / (rect.height / GRID_SIZE));
                  if (activeTool === 'bucket') floodFill(x, y);
                  else if (activeTool === 'skin') paintSkin(x, y, brushSize);
                  else if (['square', 'circle', 'triangle'].includes(activeTool)) setShapeStart({ x, y });
                  else { setIsPainting(true); setStartPos({ x, y }); paintAt(x, y); }
                }}
                onMouseUp={(e) => {
                  if (shapeStart) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.floor((e.clientX - rect.left) / (rect.width / GRID_SIZE));
                    const y = Math.floor((e.clientY - rect.top) / (rect.height / GRID_SIZE));
                    if (activeTool === 'square') drawSquare(shapeStart.x, shapeStart.y, x, y);
                    if (activeTool === 'circle') drawCircle(shapeStart.x, shapeStart.y, x, y);
                    if (activeTool === 'triangle') drawTriangle(shapeStart.x, shapeStart.y, x, y);
                  }
                  setIsPainting(false); setLastPos(null); setStartPos(null); setShapeStart(null);
                  updateInventory();
                }}
                onMouseMove={handleMouseMove}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 w-full max-w-md pb-8">
          {(['brush', 'bucket', 'square', 'circle', 'triangle'] as Tool[]).map((tool) => (
            <button
              key={tool}
              onClick={() => setActiveTool(tool)}
              className={`p-3 flex-1 rounded-xl flex items-center justify-center transition-all ${activeTool === tool ? 'bg-blue-600 text-white shadow-lg' : 'bg-zinc-800 text-zinc-400'}`}
            >
              {tool === 'brush' && <Brush size={18} />}
              {tool === 'bucket' && <PaintBucket size={18} />}
              {tool === 'square' && <Square size={18} />}
              {tool === 'circle' && <Circle size={18} />}
              {tool === 'triangle' && <Triangle size={18} />}
            </button>
          ))}
          <div className="flex gap-2 bg-zinc-800/50 p-2 rounded-xl border border-white/5">
            <button
              onClick={() => { setActiveTool('skin'); setSelectedSkin('viniccius13'); }}
              className={`p-2 rounded-lg text-[10px] font-bold ${selectedSkin === 'viniccius13' && activeTool === 'skin' ? 'bg-orange-500 text-white' : 'bg-black/20 text-zinc-400'}`}
            >
              VINICCIUS
            </button>
            <button
              onClick={() => { setActiveTool('skin'); setSelectedSkin('davi_gamer'); }}
              className={`p-2 rounded-lg text-[10px] font-bold ${selectedSkin === 'davi_gamer' && activeTool === 'skin' ? 'bg-red-500 text-white' : 'bg-black/20 text-zinc-400'}`}
            >
              DAVI
            </button>
          </div>

          <button onClick={clearCanvas} className="px-5 py-3 rounded-xl bg-red-900/20 text-red-500 hover:bg-red-900/40" title="Limpar tudo">
            <Trash size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}