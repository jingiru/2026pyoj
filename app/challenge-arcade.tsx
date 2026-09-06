"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bug, Code2, Gamepad2, RotateCcw } from "lucide-react";

type GameId = "merge" | "nest" | "snake";

const PYTHON_LEVELS = [
  { icon: "💬", name: "print", code: 'print("Hi")' },
  { icon: "🧩", name: "조건문", code: "if ready:" },
  { icon: "🔁", name: "반복문", code: "for item in data:" },
  { icon: "⚙️", name: "함수", code: "def solve():" },
  { icon: "📦", name: "모듈", code: "import tools" },
  { icon: "🗂️", name: "패키지", code: "from app import *" },
  { icon: "🎮", name: "게임", code: "run(game)" },
  { icon: "🚀", name: "로켓", code: "launch()" },
  { icon: "🌌", name: "우주", code: "import universe" },
] as const;

const NEST_LEVELS = [
  { icon: "🥚", name: "파이썬 알", color: "#f8fafc" },
  { icon: "🐣", name: "아기 뱀", color: "#dcfce7" },
  { icon: "🐍", name: "코딩 뱀", color: "#bbf7d0" },
  { icon: "🔁", name: "루프 뱀", color: "#86efac" },
  { icon: "🔎", name: "디버거", color: "#fde68a" },
  { icon: "🧙", name: "파이썬 마법사", color: "#c4b5fd" },
  { icon: "🚀", name: "우주 파이썬", color: "#93c5fd" },
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

function emptyMergeGrid() { return Array<number>(16).fill(0); }
function addMergeTile(grid: number[]) {
  const empty = grid.map((value, index) => value === 0 ? index : -1).filter(index => index >= 0);
  if (!empty.length) return grid;
  const next = [...grid]; next[empty[Math.floor(Math.random() * empty.length)]] = Math.random() < .86 ? 1 : 2; return next;
}
function startMergeGrid() { return addMergeTile(addMergeTile(emptyMergeGrid())); }
function moveMergeGrid(grid: number[], direction: Direction) {
  const next = Array<number>(16).fill(0); let gained = 0;
  const indexAt = (line: number, spot: number) => direction === "left" ? line * 4 + spot : direction === "right" ? line * 4 + (3 - spot) : direction === "up" ? spot * 4 + line : (3 - spot) * 4 + line;
  for (let line = 0; line < 4; line++) {
    const values = Array.from({ length: 4 }, (_, spot) => grid[indexAt(line, spot)]).filter(Boolean);
    const merged: number[] = [];
    for (let spot = 0; spot < values.length; spot++) {
      if (values[spot] === values[spot + 1]) { const level = Math.min(PYTHON_LEVELS.length, values[spot] + 1); merged.push(level); gained += 2 ** level; spot++; }
      else merged.push(values[spot]);
    }
    merged.forEach((value, spot) => { next[indexAt(line, spot)] = value; });
  }
  const changed = next.some((value, index) => value !== grid[index]);
  return { grid: changed ? addMergeTile(next) : grid, gained, changed };
}
function canMoveMerge(grid: number[]) {
  if (grid.includes(0)) return true;
  return grid.some((value, index) => (index % 4 < 3 && value === grid[index + 1]) || (index < 12 && value === grid[index + 4]));
}

function CodeMergeGame() {
  const [grid, setGrid] = useState(startMergeGrid); const [score, setScore] = useState(0); const touch = useRef<{ x: number; y: number } | null>(null);
  const move = useCallback((direction: Direction) => setGrid(current => { const result = moveMergeGrid(current, direction); if (result.gained) setScore(value => value + result.gained); return result.grid; }), []);
  useEffect(() => { const key = (event: KeyboardEvent) => { const direction = ({ ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" } as Record<string, Direction>)[event.key]; if (direction) { event.preventDefault(); move(direction); } }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }, [move]);
  const reset = () => { setGrid(startMergeGrid()); setScore(0); };
  const gameOver = !canMoveMerge(grid); const highest = Math.max(...grid);
  return <div className="mergeGame"><div className="arcadeScoreRow"><div><small>점수</small><strong>{score}</strong></div><div><small>최고 단계</small><strong>{PYTHON_LEVELS[Math.max(0, highest - 1)]?.name ?? "print"}</strong></div><button type="button" className="ghostButton" onClick={reset}><RotateCcw size={16} /> 새 게임</button></div>
    <div className="mergeBoard" role="application" aria-label="코드 합성 2048 게임판" tabIndex={0} onTouchStart={event => { const point = event.touches[0]; touch.current = { x: point.clientX, y: point.clientY }; }} onTouchEnd={event => { if (!touch.current) return; const point = event.changedTouches[0], dx = point.clientX - touch.current.x, dy = point.clientY - touch.current.y; touch.current = null; if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return; move(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? "right" : "left" : dy > 0 ? "down" : "up"); }}>
      {grid.map((level, index) => <div key={index} className={`mergeTile level${level}`}>{level > 0 && <><span>{PYTHON_LEVELS[level - 1]?.icon}</span><strong>{PYTHON_LEVELS[level - 1]?.name}</strong><small>{PYTHON_LEVELS[level - 1]?.code}</small></>}</div>)}
      {gameOver && <div className="arcadeGameOver"><strong>Memory Full!</strong><span>더 합칠 코드가 없어요.</span><button type="button" onClick={reset}>다시 시작</button></div>}
    </div><DirectionPad onMove={move} /><p className="arcadeTip"><Code2 size={16} /> 같은 코드 조각끼리 합치면 더 큰 프로그램으로 진화해요.</p></div>;
}

function DirectionPad({ onMove, drop = false }: { onMove: (direction: Direction) => void; drop?: boolean }) {
  return <div className="directionPad" aria-label="게임 방향 조작"><span /><button type="button" aria-label="위" onClick={() => onMove("up")}><ArrowUp /></button><span /><button type="button" aria-label="왼쪽" onClick={() => onMove("left")}><ArrowLeft /></button><button type="button" aria-label={drop ? "떨어뜨리기" : "아래"} onClick={() => onMove("down")}><ArrowDown /></button><button type="button" aria-label="오른쪽" onClick={() => onMove("right")}><ArrowRight /></button></div>;
}

type NestBall = { id: number; x: number; y: number; vx: number; vy: number; level: number; radius: number; born: number };
const NEST_RADII = [17, 22, 28, 35, 43, 52, 62];

function PythonNestGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null); const ballsRef = useRef<NestBall[]>([]); const previewRef = useRef(210); const nextRef = useRef(0); const idRef = useRef(1); const runningRef = useRef(true); const cooldownRef = useRef(false);
  const [score, setScore] = useState(0); const [next, setNext] = useState(0); const [gameOver, setGameOver] = useState(false); const [resetKey, setResetKey] = useState(0);
  const reset = () => { ballsRef.current = []; previewRef.current = 210; nextRef.current = 0; idRef.current = 1; runningRef.current = true; cooldownRef.current = false; setScore(0); setNext(0); setGameOver(false); setResetKey(value => value + 1); };
  const drop = useCallback(() => { if (!runningRef.current || cooldownRef.current) return; const level = nextRef.current; ballsRef.current.push({ id: idRef.current++, x: previewRef.current, y: 27, vx: 0, vy: 0, level, radius: NEST_RADII[level], born: performance.now() }); const upcoming = Math.random() < .72 ? 0 : 1; nextRef.current = upcoming; setNext(upcoming); cooldownRef.current = true; window.setTimeout(() => { cooldownRef.current = false; }, 330); }, []);
  const nudge = (direction: Direction) => { if (direction === "left") previewRef.current = Math.max(18, previewRef.current - 28); if (direction === "right") previewRef.current = Math.min(402, previewRef.current + 28); if (direction === "down") drop(); };
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return; const context = canvas.getContext("2d"); if (!context) return; let frame = 0; let previous = performance.now(); runningRef.current = true;
    const draw = (time: number) => {
      const dt = Math.min(.025, (time - previous) / 1000); previous = time; const balls = ballsRef.current;
      for (let step = 0; step < 2; step++) {
        for (const ball of balls) { ball.vy += 820 * dt / 2; ball.x += ball.vx * dt / 2; ball.y += ball.vy * dt / 2; ball.vx *= .996; if (ball.x - ball.radius < 5) { ball.x = 5 + ball.radius; ball.vx = Math.abs(ball.vx) * .35; } if (ball.x + ball.radius > 415) { ball.x = 415 - ball.radius; ball.vx = -Math.abs(ball.vx) * .35; } if (ball.y + ball.radius > 515) { ball.y = 515 - ball.radius; ball.vy = -Math.abs(ball.vy) * .22; if (Math.abs(ball.vy) < 18) ball.vy = 0; } }
        const removed = new Set<number>(); const additions: NestBall[] = [];
        for (let a = 0; a < balls.length; a++) for (let b = a + 1; b < balls.length; b++) {
          const first = balls[a], second = balls[b]; if (removed.has(first.id) || removed.has(second.id)) continue; const dx = second.x - first.x, dy = second.y - first.y, distance = Math.max(.1, Math.hypot(dx, dy)), overlap = first.radius + second.radius - distance; if (overlap <= 0) continue;
          if (first.level === second.level && first.level < NEST_LEVELS.length - 1 && time - first.born > 120 && time - second.born > 120) { const level = first.level + 1; removed.add(first.id); removed.add(second.id); additions.push({ id: idRef.current++, x: (first.x + second.x) / 2, y: (first.y + second.y) / 2, vx: (first.vx + second.vx) / 2, vy: -80, level, radius: NEST_RADII[level], born: time }); setScore(value => value + 2 ** (level + 1)); continue; }
          const nx = dx / distance, ny = dy / distance, push = overlap * .48; first.x -= nx * push; first.y -= ny * push; second.x += nx * push; second.y += ny * push; const relative = (second.vx - first.vx) * nx + (second.vy - first.vy) * ny; if (relative < 0) { const impulse = -relative * .42; first.vx -= impulse * nx; first.vy -= impulse * ny; second.vx += impulse * nx; second.vy += impulse * ny; }
        }
        if (removed.size) ballsRef.current = ballsRef.current.filter(ball => !removed.has(ball.id)).concat(additions);
      }
      const settledOverTop = ballsRef.current.some(ball => time - ball.born > 1400 && ball.y - ball.radius < 67 && Math.abs(ball.vy) < 35); if (settledOverTop) { runningRef.current = false; setGameOver(true); }
      context.clearRect(0, 0, 420, 520); context.fillStyle = "#f8fafc"; context.fillRect(0, 0, 420, 520); context.strokeStyle = "#fb7185"; context.setLineDash([8, 7]); context.beginPath(); context.moveTo(0, 66); context.lineTo(420, 66); context.stroke(); context.setLineDash([]);
      if (runningRef.current && !cooldownRef.current) { const level = nextRef.current; context.globalAlpha = .58; drawNestBall(context, { x: previewRef.current, y: 27, radius: NEST_RADII[level], level } as NestBall); context.globalAlpha = 1; }
      ballsRef.current.forEach(ball => drawNestBall(context, ball)); if (runningRef.current) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw); return () => { cancelAnimationFrame(frame); runningRef.current = false; };
  }, [resetKey]);
  const point = (event: React.PointerEvent<HTMLCanvasElement>) => { const rect = event.currentTarget.getBoundingClientRect(); previewRef.current = Math.max(18, Math.min(402, (event.clientX - rect.left) * 420 / rect.width)); };
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
