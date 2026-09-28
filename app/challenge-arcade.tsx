"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bug, Code2, Gamepad2, RotateCcw } from "lucide-react";

type GameId = "merge" | "nest" | "snake";

const PYTHON_LEVELS = [
  { icon: "💬", name: "print" },
  { icon: "🧩", name: "조건문" },
  { icon: "🔁", name: "반복문" },
  { icon: "⚙️", name: "함수" },
  { icon: "📦", name: "모듈" },
  { icon: "🗂️", name: "패키지" },
  { icon: "🎮", name: "게임" },
  { icon: "🚀", name: "로켓" },
  { icon: "🌌", name: "우주" },
] as const;

const NEST_LEVELS = [
  { icon: "🥚", name: "파이썬 알", color: "#f8fafc" },
  { icon: "🐣", name: "아기 뱀", color: "#dcfce7" },
  { icon: "🐍", name: "코딩 뱀", color: "#bbf7d0" },
  { icon: "🔁", name: "루프 뱀", color: "#86efac" },
  { icon: "🔎", name: "디버거", color: "#fde68a" },
  { icon: "⌨️", name: "코드 장인", color: "#fdba74" },
  { icon: "🤖", name: "자동화 뱀", color: "#f9a8d4" },
  { icon: "🧙", name: "파이썬 마법사", color: "#c4b5fd" },
  { icon: "🧠", name: "AI 파이썬", color: "#a5b4fc" },
  { icon: "🚀", name: "우주 파이썬", color: "#93c5fd" },
  { icon: "🌌", name: "전설의 파이썬", color: "#67e8f9" },
] as const;

export default function ChallengeArcade() {
  const [game, setGame] = useState<GameId | null>(null);
  if (game === "merge") return <ArcadeFrame title="코드 합성 2048" onBack={() => setGame(null)}><CodeMergeGame /></ArcadeFrame>;
  if (game === "nest") return <ArcadeFrame title="파이썬 둥지" onBack={() => setGame(null)}><PythonNestGame /></ArcadeFrame>;
  if (game === "snake") return <ArcadeFrame title="버그 냠냠" onBack={() => setGame(null)}><BugSnakeGame /></ArcadeFrame>;
  return <div className="arcadeMenu">
    <div className="arcadeWelcome"><span aria-hidden="true">🐍</span><div><strong>수고했어요, 빠른 해결자!</strong><p>기록은 저장되지 않아요. 마음 가는 게임을 골라 잠깐 쉬어가세요.</p></div></div>
    <div className="arcadeGameCards">
      <button type="button" onClick={() => setGame("merge")}><span className="arcadeCardIcon">🧩</span><strong>코드 합성 2048</strong><small>같은 코드 조각을 합쳐 우주까지!</small><em>방향키 · 스와이프</em></button>
      <button type="button" onClick={() => setGame("nest")}><span className="arcadeCardIcon">🥚</span><strong>파이썬 둥지</strong><small>같은 파이썬을 떨어뜨려 진화시키기</small><em>마우스 · 터치</em></button>
      <button type="button" onClick={() => setGame("snake")}><span className="arcadeCardIcon">🐛</span><strong>버그 냠냠</strong><small>버그를 먹고 자라는 디버거 뱀</small><em>방향키 · WASD</em></button>
    </div>
  </div>;
}

function ArcadeFrame({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  return <div className="arcadeGame"><div className="arcadeGameHeader"><button type="button" className="ghostButton" onClick={onBack}>← 게임 선택</button><strong>{title}</strong><span><Gamepad2 size={17} /> 쉬는 시간</span></div>{children}</div>;
}

type Direction = "left" | "right" | "up" | "down";

type MergeTile = { id: number; level: number; index: number; effect?: "spawn" | "merge" };
type MergeGroup = { sources: MergeTile[]; level: number; index: number };

function addMergeTile(tiles: MergeTile[], nextId: () => number): MergeTile[] {
  const occupied = new Set(tiles.map(tile => tile.index)); const empty = Array.from({ length: 16 }, (_, index) => index).filter(index => !occupied.has(index));
  if (!empty.length) return tiles;
  return [...tiles, { id: nextId(), index: empty[Math.floor(Math.random() * empty.length)], level: Math.random() < .86 ? 1 : 2, effect: "spawn" as const }];
}
function moveMergeTiles(tiles: MergeTile[], direction: Direction) {
  const moving: MergeTile[] = []; const groups: MergeGroup[] = []; let gained = 0;
  const indexAt = (line: number, spot: number) => direction === "left" ? line * 4 + spot : direction === "right" ? line * 4 + (3 - spot) : direction === "up" ? spot * 4 + line : (3 - spot) * 4 + line;
  for (let line = 0; line < 4; line++) {
    const lineTiles = Array.from({ length: 4 }, (_, spot) => tiles.find(tile => tile.index === indexAt(line, spot))).filter((tile): tile is MergeTile => Boolean(tile));
    const lineGroups: MergeGroup[] = [];
    for (const tile of lineTiles) {
      const previous = lineGroups.at(-1);
      if (previous && previous.sources.length === 1 && previous.level === tile.level) {
        previous.sources.push(tile); previous.level = Math.min(PYTHON_LEVELS.length, tile.level + 1); gained += 2 ** previous.level;
      } else lineGroups.push({ sources: [tile], level: tile.level, index: indexAt(line, lineGroups.length) });
    }
    groups.push(...lineGroups);
  }
  for (const group of groups) for (const tile of group.sources) moving.push({ ...tile, index: group.index, effect: undefined });
  const final = groups.map(group => ({ id: group.sources[0].id, level: group.level, index: group.index, effect: group.sources.length > 1 ? "merge" as const : undefined }));
  const changed = moving.some(tile => tile.index !== tiles.find(item => item.id === tile.id)?.index) || final.length !== tiles.length;
  return { moving, final, gained, changed };
}
function canMoveMerge(tiles: MergeTile[]) {
  if (tiles.length < 16) return true; const levels = new Map(tiles.map(tile => [tile.index, tile.level]));
  return tiles.some(tile => (tile.index % 4 < 3 && tile.level === levels.get(tile.index + 1)) || (tile.index < 12 && tile.level === levels.get(tile.index + 4)));
}

function CodeMergeGame() {
  const idRef = useRef(1); const timerRef = useRef<number | null>(null); const lockedRef = useRef(false); const nextId = () => idRef.current++;
  const makeStart = () => addMergeTile(addMergeTile([], nextId), nextId);
  const [tiles, setTiles] = useState<MergeTile[]>(makeStart); const [score, setScore] = useState(0); const [animating, setAnimating] = useState(false); const touch = useRef<{ x: number; y: number } | null>(null);
  const move = useCallback((direction: Direction) => { if (lockedRef.current) return; const result = moveMergeTiles(tiles, direction); if (!result.changed) return; lockedRef.current = true; setAnimating(true); setTiles(result.moving); if (result.gained) setScore(value => value + result.gained); timerRef.current = window.setTimeout(() => { setTiles(addMergeTile(result.final, nextId)); setAnimating(false); lockedRef.current = false; }, 175); }, [tiles]);
  useEffect(() => { const key = (event: KeyboardEvent) => { const direction = ({ ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" } as Record<string, Direction>)[event.key]; if (direction) { event.preventDefault(); move(direction); } }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }, [move]);
  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current); }, []);
  const reset = () => { if (timerRef.current) window.clearTimeout(timerRef.current); lockedRef.current = false; setAnimating(false); idRef.current = 1; setTiles(makeStart()); setScore(0); };
  const gameOver = !animating && !canMoveMerge(tiles); const highest = Math.max(1, ...tiles.map(tile => tile.level));
  return <div className="mergeGame"><div className="arcadeScoreRow"><div><small>점수</small><strong>{score}</strong></div><div><small>최고 단계</small><strong>{PYTHON_LEVELS[Math.max(0, highest - 1)]?.name ?? "print"}</strong></div><button type="button" className="ghostButton" onClick={reset}><RotateCcw size={16} /> 새 게임</button></div>
    <div className="mergeBoard" role="application" aria-label="코드 합성 2048 게임판" tabIndex={0} onTouchStart={event => { const point = event.touches[0]; touch.current = { x: point.clientX, y: point.clientY }; }} onTouchEnd={event => { if (!touch.current) return; const point = event.changedTouches[0], dx = point.clientX - touch.current.x, dy = point.clientY - touch.current.y; touch.current = null; if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return; move(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? "right" : "left" : dy > 0 ? "down" : "up"); }}>
      <div className="mergeGrid">{Array.from({ length: 16 }, (_, index) => <div className="mergeCell" key={index} />)}{tiles.map(tile => { const row = Math.floor(tile.index / 4), column = tile.index % 4; return <div key={tile.id} style={{ left: `calc(${column * 25}% + ${column * 2}px)`, top: `calc(${row * 25}% + ${row * 2}px)` }} className={`mergeTile level${tile.level} ${tile.effect ?? ""}`}><span>{PYTHON_LEVELS[tile.level - 1]?.icon}</span><strong>{PYTHON_LEVELS[tile.level - 1]?.name}</strong></div>; })}</div>
      {gameOver && <div className="arcadeGameOver"><strong>Memory Full!</strong><span>더 합칠 코드가 없어요.</span><button type="button" onClick={reset}>다시 시작</button></div>}
    </div><DirectionPad onMove={move} /><p className="arcadeTip"><Code2 size={16} /> 같은 코드 조각끼리 합치면 더 큰 프로그램으로 진화해요.</p></div>;
}

function DirectionPad({ onMove, drop = false }: { onMove: (direction: Direction) => void; drop?: boolean }) {
  return <div className="directionPad" aria-label="게임 방향 조작"><span /><button type="button" aria-label="위" onClick={() => onMove("up")}><ArrowUp /></button><span /><button type="button" aria-label="왼쪽" onClick={() => onMove("left")}><ArrowLeft /></button><button type="button" aria-label={drop ? "떨어뜨리기" : "아래"} onClick={() => onMove("down")}><ArrowDown /></button><button type="button" aria-label="오른쪽" onClick={() => onMove("right")}><ArrowRight /></button></div>;
}

type NestBall = { id: number; x: number; y: number; vx: number; vy: number; level: number; radius: number; born: number };
const NEST_RADII = [13, 17, 21, 26, 32, 39, 47, 56, 65, 74, 84];
const NEST_LEFT = 12, NEST_RIGHT = 408, NEST_FLOOR = 515, NEST_LINE = 92;
function randomNestLevel() { const roll = Math.random(); return roll < .56 ? 0 : roll < .84 ? 1 : roll < .96 ? 2 : 3; }

function PythonNestGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null); const ballsRef = useRef<NestBall[]>([]); const previewRef = useRef(210); const nextRef = useRef(0); const idRef = useRef(1); const runningRef = useRef(true); const cooldownRef = useRef(false);
  const [score, setScore] = useState(0); const [next, setNext] = useState(0); const [gameOver, setGameOver] = useState(false); const [resetKey, setResetKey] = useState(0);
  const reset = () => { ballsRef.current = []; previewRef.current = 210; nextRef.current = randomNestLevel(); idRef.current = 1; runningRef.current = true; cooldownRef.current = false; setScore(0); setNext(nextRef.current); setGameOver(false); setResetKey(value => value + 1); };
  const clampPreview = (x: number, level = nextRef.current) => Math.max(NEST_LEFT + NEST_RADII[level], Math.min(NEST_RIGHT - NEST_RADII[level], x));
  const drop = useCallback(() => { if (!runningRef.current || cooldownRef.current) return; const level = nextRef.current; const radius = NEST_RADII[level]; ballsRef.current.push({ id: idRef.current++, x: clampPreview(previewRef.current, level), y: 42, vx: 0, vy: 0, level, radius, born: performance.now() }); const upcoming = randomNestLevel(); nextRef.current = upcoming; previewRef.current = clampPreview(previewRef.current, upcoming); setNext(upcoming); cooldownRef.current = true; window.setTimeout(() => { cooldownRef.current = false; }, 420); }, []);
  const nudge = (direction: Direction) => { if (direction === "left") previewRef.current = clampPreview(previewRef.current - 25); if (direction === "right") previewRef.current = clampPreview(previewRef.current + 25); if (direction === "down") drop(); };
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return; const context = canvas.getContext("2d"); if (!context) return; let frame = 0; let previous = performance.now(); runningRef.current = true;
    const draw = (time: number) => {
      const dt = Math.min(.022, (time - previous) / 1000); previous = time;
      for (let step = 0; step < 3; step++) {
        let balls = ballsRef.current;
        for (const ball of balls) { ball.vy += 980 * dt / 3; ball.x += ball.vx * dt / 3; ball.y += ball.vy * dt / 3; ball.vx *= .992; if (ball.x - ball.radius < NEST_LEFT) { ball.x = NEST_LEFT + ball.radius; ball.vx = Math.abs(ball.vx) * .28; } if (ball.x + ball.radius > NEST_RIGHT) { ball.x = NEST_RIGHT - ball.radius; ball.vx = -Math.abs(ball.vx) * .28; } if (ball.y + ball.radius > NEST_FLOOR) { ball.y = NEST_FLOOR - ball.radius; ball.vy = -Math.abs(ball.vy) * .13; if (Math.abs(ball.vy) < 12) ball.vy = 0; } }
        const removed = new Set<number>(); const additions: NestBall[] = [];
        for (let a = 0; a < balls.length; a++) for (let b = a + 1; b < balls.length; b++) {
          const first = balls[a], second = balls[b]; if (removed.has(first.id) || removed.has(second.id)) continue; const dx = second.x - first.x, dy = second.y - first.y, distance = Math.max(.1, Math.hypot(dx, dy)), overlap = first.radius + second.radius - distance; if (overlap <= 0) continue;
          if (first.level === second.level && first.level < NEST_LEVELS.length - 1 && time - first.born > 150 && time - second.born > 150) { const level = first.level + 1; removed.add(first.id); removed.add(second.id); additions.push({ id: idRef.current++, x: (first.x + second.x) / 2, y: (first.y + second.y) / 2, vx: (first.vx + second.vx) / 2, vy: -58, level, radius: NEST_RADII[level], born: time }); setScore(value => value + 2 ** (level + 1)); continue; }
          const nx = dx / distance, ny = dy / distance, push = overlap * .49; first.x -= nx * push; first.y -= ny * push; second.x += nx * push; second.y += ny * push; const relative = (second.vx - first.vx) * nx + (second.vy - first.vy) * ny; if (relative < 0) { const impulse = -relative * .31; first.vx -= impulse * nx; first.vy -= impulse * ny; second.vx += impulse * nx; second.vy += impulse * ny; }
        }
        if (removed.size) ballsRef.current = ballsRef.current.filter(ball => !removed.has(ball.id)).concat(additions);
      }
      const settledOverTop = ballsRef.current.some(ball => time - ball.born > 850 && ball.y - ball.radius < NEST_LINE && Math.hypot(ball.vx, ball.vy) < 55); if (settledOverTop) { runningRef.current = false; setGameOver(true); }
      context.clearRect(0, 0, 420, 520); context.fillStyle = "#f8fafc"; context.fillRect(0, 0, 420, 520); context.fillStyle = "#e2e8f0"; context.fillRect(0, 0, NEST_LEFT, 520); context.fillRect(NEST_RIGHT, 0, 420 - NEST_RIGHT, 520); context.strokeStyle = "#fb7185"; context.setLineDash([8, 7]); context.beginPath(); context.moveTo(NEST_LEFT, NEST_LINE); context.lineTo(NEST_RIGHT, NEST_LINE); context.stroke(); context.setLineDash([]);
      if (runningRef.current && !cooldownRef.current) { const level = nextRef.current; context.globalAlpha = .58; drawNestBall(context, { x: previewRef.current, y: 42, radius: NEST_RADII[level], level } as NestBall); context.globalAlpha = 1; }
      ballsRef.current.forEach(ball => drawNestBall(context, ball)); if (runningRef.current) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw); return () => { cancelAnimationFrame(frame); runningRef.current = false; };
  }, [resetKey]);
  const point = (event: React.PointerEvent<HTMLCanvasElement>) => { const rect = event.currentTarget.getBoundingClientRect(); previewRef.current = clampPreview((event.clientX - rect.left) * 420 / rect.width); };
  return <div className="nestGame"><div className="arcadeScoreRow"><div><small>점수</small><strong>{score}</strong></div><div><small>다음 파이썬</small><strong>{NEST_LEVELS[next].icon} {NEST_LEVELS[next].name}</strong></div><button type="button" className="ghostButton" onClick={reset}><RotateCcw size={16} /> 새 게임</button></div><div className="nestCanvasWrap"><canvas ref={canvasRef} width={420} height={520} aria-label="파이썬 둥지 게임판" onPointerMove={point} onPointerDown={event => { point(event); drop(); }} />{gameOver && <div className="arcadeGameOver"><strong>Indentation Overflow!</strong><span>파이썬 둥지가 가득 찼어요.</span><button type="button" onClick={reset}>다시 시작</button></div>}</div><DirectionPad onMove={nudge} drop /><p className="arcadeTip">같은 파이썬끼리 닿으면 한 단계 더 멋진 파이썬으로 진화해요.</p></div>;
}

function drawNestBall(context: CanvasRenderingContext2D, ball: NestBall) {
  const level = NEST_LEVELS[ball.level]; context.beginPath(); context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); context.fillStyle = level.color; context.fill(); context.lineWidth = 2; context.strokeStyle = "#334155"; context.stroke(); context.font = `${Math.max(18, ball.radius * .8)}px sans-serif`; context.textAlign = "center"; context.textBaseline = "middle"; context.fillStyle = "#0f172a"; context.fillText(level.icon, ball.x, ball.y + 1);
}

type SnakePoint = { x: number; y: number };
const SNAKE_SIZE = 18;
function randomFood(snake: SnakePoint[]) { const free: SnakePoint[] = []; for (let y = 0; y < SNAKE_SIZE; y++) for (let x = 0; x < SNAKE_SIZE; x++) if (!snake.some(point => point.x === x && point.y === y)) free.push({ x, y }); return free[Math.floor(Math.random() * free.length)] ?? { x: 2, y: 2 }; }

function BugSnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null); const snakeRef = useRef<SnakePoint[]>([]); const directionRef = useRef<Direction>("right"); const queuedRef = useRef<Direction>("right"); const foodRef = useRef<SnakePoint>({ x: 13, y: 9 }); const coffeeRef = useRef<SnakePoint | null>(null); const runningRef = useRef(true);
  const [score, setScore] = useState(0); const [gameOver, setGameOver] = useState(false); const [resetKey, setResetKey] = useState(0);
  const reset = () => { snakeRef.current = [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }]; directionRef.current = "right"; queuedRef.current = "right"; foodRef.current = { x: 13, y: 9 }; coffeeRef.current = null; runningRef.current = true; setScore(0); setGameOver(false); setResetKey(value => value + 1); };
  const turn = useCallback((next: Direction) => { const current = directionRef.current; if ((current === "left" && next === "right") || (current === "right" && next === "left") || (current === "up" && next === "down") || (current === "down" && next === "up")) return; queuedRef.current = next; }, []);
  useEffect(() => { reset(); }, []);
  useEffect(() => { const key = (event: KeyboardEvent) => { const direction = ({ ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right", ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down" } as Record<string, Direction>)[event.key]; if (direction) { event.preventDefault(); turn(direction); } }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }, [turn]);
  useEffect(() => {
    const canvas = canvasRef.current, context = canvas?.getContext("2d"); if (!canvas || !context) return; runningRef.current = true; const draw = () => { context.fillStyle = "#07111f"; context.fillRect(0, 0, 396, 396); context.strokeStyle = "rgba(148,163,184,.1)"; for (let i = 0; i <= SNAKE_SIZE; i++) { context.beginPath(); context.moveTo(i * 22, 0); context.lineTo(i * 22, 396); context.stroke(); context.beginPath(); context.moveTo(0, i * 22); context.lineTo(396, i * 22); context.stroke(); } snakeRef.current.forEach((point, index) => { context.fillStyle = index === 0 ? "#facc15" : `hsl(${140 + Math.min(45, index * 2)} 70% ${index % 2 ? 48 : 42}%)`; roundRect(context, point.x * 22 + 2, point.y * 22 + 2, 18, 18, 5); context.fill(); }); context.font = "17px sans-serif"; context.textAlign = "center"; context.textBaseline = "middle"; context.fillText("🐛", foodRef.current.x * 22 + 11, foodRef.current.y * 22 + 11); if (coffeeRef.current) context.fillText("☕", coffeeRef.current.x * 22 + 11, coffeeRef.current.y * 22 + 11); };
    draw(); const timer = window.setInterval(() => { if (!runningRef.current) return; directionRef.current = queuedRef.current; const vector = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[directionRef.current]; const snake = snakeRef.current, head = { x: snake[0].x + vector[0], y: snake[0].y + vector[1] }; if (head.x < 0 || head.y < 0 || head.x >= SNAKE_SIZE || head.y >= SNAKE_SIZE || snake.some(point => point.x === head.x && point.y === head.y)) { runningRef.current = false; setGameOver(true); draw(); return; } const ateBug = head.x === foodRef.current.x && head.y === foodRef.current.y; const ateCoffee = coffeeRef.current && head.x === coffeeRef.current.x && head.y === coffeeRef.current.y; const nextSnake = [head, ...snake]; if (!ateBug && !ateCoffee) nextSnake.pop(); if (ateBug) { setScore(value => { const updated = value + 1; if (updated % 5 === 0) coffeeRef.current = randomFood(nextSnake); return updated; }); foodRef.current = randomFood(nextSnake); } if (ateCoffee) { coffeeRef.current = null; setScore(value => value + 3); } snakeRef.current = nextSnake; draw(); }, 115); return () => window.clearInterval(timer);
  }, [resetKey]);
  return <div className="snakeGame"><div className="arcadeScoreRow"><div><small>해결한 버그</small><strong>{score}</strong></div><div><small>상태</small><strong>{gameOver ? "Runtime Error" : "디버깅 중"}</strong></div><button type="button" className="ghostButton" onClick={reset}><RotateCcw size={16} /> 새 게임</button></div><div className="snakeCanvasWrap"><canvas ref={canvasRef} width={396} height={396} aria-label="버그 냠냠 게임판" />{gameOver && <div className="arcadeGameOver"><strong>CollisionError!</strong><span>벽이나 내 몸과 충돌했어요.</span><button type="button" onClick={reset}>다시 시작</button></div>}</div><DirectionPad onMove={turn} /><p className="arcadeTip"><Bug size={16} /> 버그를 잡아먹고, 다섯 마리마다 나타나는 커피로 보너스를 받아요.</p></div>;
}

function roundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) { context.beginPath(); context.roundRect(x, y, width, height, radius); }
