/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import { useRef, useState } from "react"

interface EditorPixelArtProps {
  blockName: string
  colors: {
    camada_0: [number, number, number]
    normal: [number, number, number]
    camada_2: [number, number, number]
    camada_3: [number, number, number]
  }
}

const BLOCK_NAMES_MAP: Record<string, string> = {
  camada_0: "CAMADA 0",
  normal: "Normal",
  camada_2: "CAMADA 2",
  camada_3: "CAMADA 3",
}

type Tool = 'brush' | 'bucket';

export default function EditorPixelArt({ blockName, colors }: EditorPixelArtProps) {
  const GRID_SIZE = 128
  const CANVAS_DISPLAY_SIZE = 420
  const MAP_WRAPPER_SIZEX = 532
  const MAP_WRAPPER_SIZEY = 502
  const PIXEL_SIZE = CANVAS_DISPLAY_SIZE / GRID_SIZE

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isPainting, setIsPainting] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<keyof typeof colors>("normal")
  const [brushSize, setBrushSize] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [activeTool, setActiveTool] = useState<Tool>('brush');

  const [mousePos, setMousePos] = useState({ x: 0, y: 0, visible: false })
  const activeColor = colors[selectedVariant]

  const [startPos, setStartPos] = useState<{ x: number, y: number } | null>(null)
  const [lastPos, setLastPos] = useState<{ x: number, y: number } | null>(null)

  const [inventory, setInventory] = useState<Record<string, number>>({})
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

        ctx.fillRect(
          Math.floor(x * PIXEL_SIZE),
          Math.floor(y * PIXEL_SIZE),
          Math.ceil(PIXEL_SIZE),
          Math.ceil(PIXEL_SIZE)
        );

        visited[idx] = 1;
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
    }
    updateInventory();
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    setInventory({})
  }

  function updateInventory() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    const counts: Record<string, number> = {}

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const pxX = Math.floor(x * (canvas.width / GRID_SIZE) + (canvas.width / GRID_SIZE) / 2)
        const pxY = Math.floor(y * (canvas.height / GRID_SIZE) + (canvas.height / GRID_SIZE) / 2)
        const index = (pxY * canvas.width + pxX) * 4

        const r = imageData[index]
        const g = imageData[index + 1]
        const b = imageData[index + 2]
        const a = imageData[index + 3]

        if (a > 200) {
          const rgbKey = `${r},${g},${b}`
          const variantEntry = Object.entries(colors).find(([_, val]) => val.join(",") === rgbKey)
          if (variantEntry) {
            const name = variantEntry[0]
            counts[name] = (counts[name] || 0) + 1
          }
        }
      }
    }
    setInventory(counts)
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
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let currX = x0;
    let currY = y0;

    while (true) {
      paintAt(currX, currY);
      if (currX === x1 && currY === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; currX += sx; }
      if (e2 < dx) { err += dx; currY += sy; }
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
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

  function fillAll() {
    const canvas = canvasRef.current
    if (!canvas || !canvas.getContext("2d")) return
    const ctx = canvas.getContext("2d")!
    const [r, g, b] = activeColor
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
    ctx.fillRect(0, 0, CANVAS_DISPLAY_SIZE, CANVAS_DISPLAY_SIZE)
    updateInventory();
  }

  return (
    <div className="flex flex-col xl:flex-row items-center xl:items-start justify-center gap-6 w-full max-w-7xl mx-auto p-2 md:p-4 h-full overflow-y-auto xl:overflow-visible custom-scrollbar">

      <div className="mt-28 w-full xl:w-64 shrink-0">
        <div className="bg-zinc-900/80 p-4 md:p-5 rounded-2xl border border-white/10 backdrop-blur-md sticky top-0">
          <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Materiais
          </h4>

          <div className="grid grid-cols-2 xl:grid-cols-1 gap-4 xl:gap-5">
            {Object.keys(colors).map((key) => {
              const count = inventory[key] || 0;
              const colorArr = colors[key as keyof typeof colors];
              return (
                <div key={key} className="flex flex-col gap-1">
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] md:text-[11px] font-bold text-zinc-300 uppercase truncate pr-2">
                      {BLOCK_NAMES_MAP[key]}
                    </span>
                    <span className="text-xs font-mono font-bold text-white whitespace-nowrap">
                      {count}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${Math.min((count / 16384) * 100 * 5, 100)}%`,
                        backgroundColor: `rgb(${colorArr.join(",")})`
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[9px] text-zinc-500 uppercase font-bold">
            <span>Total</span>
            <span className="text-white font-mono">{Object.values(inventory).reduce((a, b) => a + b, 0)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 md:gap-6 w-full">
        {mousePos.visible && (
          <div
            className="hidden md:block fixed pointer-events-none z-50 border border-white/50 mix-blend-difference"
            style={{
              left: mousePos.x,
              top: mousePos.y,
              width: brushSize * PIXEL_SIZE * zoom,
              height: brushSize * PIXEL_SIZE * zoom,
              backgroundColor: `rgb(${activeColor.join(",")})`,
              transform: 'translate(-50%, -50%)',
              imageRendering: 'pixelated'
            }}
          />
        )}

        <div className="text-center">
          <h3 className="text-lg md:text-xl font-mono font-bold text-white uppercase tracking-tighter">{blockName}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-md">
          <div className="bg-zinc-800/50 p-3 rounded-xl border border-white/5 flex flex-col gap-2">
            <div className="flex justify-between text-[10px] font-bold uppercase opacity-60">
              <label>Pincel</label>
              <span className="text-blue-400">{brushSize}px</span>
            </div>
            <input type="range" min="1" max="10" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-blue-500" />
          </div>

          <div className="bg-zinc-800/50 p-3 rounded-xl border border-white/5 flex flex-col gap-2">
            <div className="flex justify-between text-[10px] font-bold uppercase opacity-60">
              <label>Zoom</label>
              <span className="text-amber-400">{zoom}x</span>
            </div>
            <input type="range" min="1" max="4" step="0.5" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-amber-500" />
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2 md:gap-4 bg-zinc-800/30 p-3 rounded-2xl w-full max-w-md">
          {(Object.entries(colors) as [keyof typeof colors, [number, number, number]][]).map(([key, rgb]) => (
            <button
              key={key}
              onClick={() => setSelectedVariant(key)}
              className={`flex flex-col items-center gap-1.5 p-1.5 rounded-xl transition-all ${selectedVariant === key ? "bg-white/10 shadow-lg scale-105 ring-2 ring-blue-500" : "opacity-40 hover:opacity-100"}`}
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg border border-black/20" style={{ backgroundColor: `rgb(${rgb.join(",")})` }} />
              <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-tighter">{BLOCK_NAMES_MAP[key]}</span>
            </button>
          ))}
        </div>

        <div className="w-full h-[400px] md:h-[550px] overflow-auto border border-white/10 rounded-2xl bg-black/40 custom-scrollbar relative">
          <div style={{ width: MAP_WRAPPER_SIZEX * zoom, height: MAP_WRAPPER_SIZEY * zoom, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '100%', minHeight: '100%', maxWidth: "798px" }}>
            <div
              className="relative transition-transform duration-200 ease-out shrink-0"
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
                className="cursor-crosshair bg-transparent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 touch-none"
                style={{ imageRendering: 'pixelated', width: CANVAS_DISPLAY_SIZE, height: CANVAS_DISPLAY_SIZE }}
                onMouseDown={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.floor((e.clientX - rect.left) / (rect.width / GRID_SIZE));
                  const y = Math.floor((e.clientY - rect.top) / (rect.height / GRID_SIZE));

                  if (activeTool === 'bucket') {
                    floodFill(x, y);
                  } else {
                    setIsPainting(true);
                    setStartPos({ x, y });
                    paintAt(x, y);
                  }
                }}
                onMouseUp={() => { setIsPainting(false); setLastPos(null); setStartPos(null); updateInventory(); }}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => { setIsPainting(false); setMousePos(prev => ({ ...prev, visible: false })); }}
                onMouseEnter={() => setMousePos(prev => ({ ...prev, visible: true }))}
              />
              <div className="absolute pointer-events-none opacity-[0.05] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ width: CANVAS_DISPLAY_SIZE, height: CANVAS_DISPLAY_SIZE, backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`, backgroundSize: `${PIXEL_SIZE}px ${PIXEL_SIZE}px` }}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 w-full max-w-md pb-8">
          <button
            onClick={() => setActiveTool('brush')}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${activeTool === 'brush' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-zinc-800 text-zinc-400'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19 7-7 3 3-7 7-3-3Z" /><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5Z" /><path d="m2 2 5 5" /><path d="m5 21 1.03-1.03" /></svg>
            Pincel
          </button>

          <button
            onClick={() => setActiveTool('bucket')}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${activeTool === 'bucket' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-zinc-800 text-zinc-400'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z" /><path d="m5 2 5 5" /><path d="M2 13h15" /><path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z" /></svg>
            Balde
          </button>

          <button
            onClick={clearCanvas}
            className="px-5 py-3 rounded-xl bg-red-900/20 text-red-500 hover:bg-red-900/40 transition-all"
            title="Limpar tudo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
          </button>
        </div>
      </div>
    </div>
  )
}