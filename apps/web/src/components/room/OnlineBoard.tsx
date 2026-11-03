'use client';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { DrawingTools, BACKGROUND, COLORS } from '@/components/drawing/DrawingTools';
import { floodFill, paintStroke, pointerPoint, repaint, type Stroke } from '@/components/drawing/canvas';
import styles from '@/components/drawing/drawing.module.css';
import { getSocket, send } from '@/lib/rooms/socket';
import type { RoomState } from '@shared/contract';

export function OnlineBoard({ state, canDraw }: { state: RoomState; canDraw: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null); const snapshot = useRef<Stroke[]>(state.strokes);
  const current = useRef<Stroke | null>(null); const pointer = useRef<number | null>(null);
  const livePending = useRef<number[]>([]); const lastSent = useRef(0);
  const [filling, setFilling] = useState(false); const [drawingNow, setDrawingNow] = useState(false); const [color, setColor] = useState<string>(COLORS[0]); const [size, setSize] = useState(6); const [eraser, setEraser] = useState(false); const [error, setError] = useState('');
  function redraw() { if (!canvas.current) return; repaint(canvas.current, snapshot.current); if (current.current) paintStroke(canvas.current, current.current); }
  useEffect(() => { snapshot.current = state.strokes; redraw(); }, [state.strokes]);
  useEffect(() => { const board = canvas.current; if (!board) return; const observer = new ResizeObserver(redraw); observer.observe(board); redraw(); return () => observer.disconnect(); }, []);
  useEffect(() => {
    const socket = getSocket();
    const onLive = (stroke: Stroke) => { if (canvas.current) paintStroke(canvas.current, stroke); };
    const onClear = () => { snapshot.current = []; if (canvas.current) repaint(canvas.current, []); };
    socket.on('draw:live', onLive); socket.on('draw:clear', onClear);
    return () => { socket.off('draw:live', onLive); socket.off('draw:clear', onClear); };
  }, []);
  function flushLive() {
    const stroke = current.current; const pts = livePending.current;
    if (!stroke || pts.length < 4) return;
    getSocket().emit('draw:live', { points: pts, color: stroke.color, size: stroke.size });
    livePending.current = pts.slice(-2); lastSent.current = Date.now();
  }
  function commit(stroke: Stroke) {
    void send('draw:stroke', stroke).then(result => { if (!result.ok) { setError(result.error || 'Stroke could not be saved.'); redraw(); } });
  }
  function down(e: PointerEvent<HTMLCanvasElement>) {
    if (!canDraw || pointer.current !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault(); setError('');
    if (filling) { const point = pointerPoint(e, e.currentTarget); if (floodFill(e.currentTarget, point, color)) commit({ kind: 'fill', points: point, color, size }); return; }
    setDrawingNow(true); e.currentTarget.setPointerCapture(e.pointerId); pointer.current = e.pointerId;
    const p = pointerPoint(e, e.currentTarget); current.current = { points: [...p, ...p], color: eraser ? BACKGROUND : color, size }; livePending.current = [...p, ...p]; paintStroke(e.currentTarget, current.current); flushLive();
  }
  function move(e: PointerEvent<HTMLCanvasElement>) {
    if (pointer.current !== e.pointerId || !current.current || !canDraw) return;
    const events = e.nativeEvent.getCoalescedEvents?.() || [e.nativeEvent];
    for (const ev of events.length ? events : [e.nativeEvent]) {
      const stroke: Stroke = current.current; const p = pointerPoint(ev, e.currentTarget);
      paintStroke(e.currentTarget, { ...stroke, points: [...stroke.points.slice(-2), ...p] }); stroke.points.push(...p); livePending.current.push(...p);
      if (stroke.points.length >= 1800) { flushLive(); commit(stroke); current.current = { ...stroke, points: stroke.points.slice(-2) }; }
    }
    if (Date.now() - lastSent.current >= 40) flushLive();
  }
  function end(e: PointerEvent<HTMLCanvasElement>) {
    if (pointer.current !== e.pointerId || !current.current) return;
    flushLive(); const stroke = current.current; setDrawingNow(false); pointer.current = null; current.current = null; livePending.current = [];
    if (stroke.points.length >= 4) commit(stroke);
  }
  return <div className={styles.board}><div className={styles.heading}><span>{canDraw ? 'Your turn to draw' : 'Shared drawing board'}</span><small>{state.strokes.length} strokes</small></div><div className={styles.surface}><canvas ref={canvas} className={styles.canvas} onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end} aria-label="Shared drawing board, draw with touch, pen or mouse" />{state.strokes.length === 0 && !drawingNow && <span className={styles.hint}>{canDraw ? 'Draw something here ✨' : 'Waiting for the first stroke…'}</span>}</div>{canDraw ? <><DrawingTools color={color} setColor={setColor} size={size} setSize={setSize} eraser={eraser} setEraser={value => { setEraser(value); setFilling(false); }} fill={() => { setFilling(true); setEraser(false); }} filling={filling}/><p className={styles.note}>{filling ? 'Tap a closed area to fill it. Gaps in the outline let color escape.' : 'Use a finger, stylus or mouse. Select Fill, then tap an area.'}</p></> : <p className={styles.note}>Watch the shared picture grow while you wait for your turn.</p>}{error && <p className={styles.error} role="alert">{error}</p>}</div>;
}
