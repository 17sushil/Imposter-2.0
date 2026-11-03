'use client';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { DrawingTools, BACKGROUND, COLORS } from '@/components/drawing/DrawingTools';
import { floodFill, paintStroke, pointerPoint, repaint, type Stroke } from '@/components/drawing/canvas';
import styles from '@/components/drawing/drawing.module.css';

type Action = { type: 'stroke'; stroke: Stroke } | { type: 'fill'; color: string; point: number[] };
export function DrawingPad({ disabled = false, className = '', turnLabel }: { accent: 'violet' | 'orange'; disabled?: boolean; className?: string; keepContent?: boolean; turnLabel?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null); const actions = useRef<Action[]>([]);
  const current = useRef<Stroke | null>(null); const pointer = useRef<number | null>(null);
  const [filling, setFilling] = useState(false); const [drawingNow, setDrawingNow] = useState(false); const [color, setColor] = useState<string>(COLORS[0]); const [size, setSize] = useState(6); const [eraser, setEraser] = useState(false); const [count, setCount] = useState(0);
  function redraw() {
    const board = canvas.current; if (!board) return;
    repaint(board, []); const ctx = board.getContext('2d'); const rect = board.getBoundingClientRect();
    if (!ctx || !rect.width || !rect.height) return;
    for (const action of actions.current) {
      if (action.type === 'fill') floodFill(board, action.point, action.color);
      else paintStroke(board, action.stroke);
    }
    if (current.current) paintStroke(board, current.current);
  }
  useEffect(() => { const board = canvas.current; if (!board) return; const observer = new ResizeObserver(redraw); observer.observe(board); redraw(); return () => observer.disconnect(); }, []);
  function down(e: PointerEvent<HTMLCanvasElement>) {
    if (disabled || pointer.current !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    if (filling) { const point = pointerPoint(e, e.currentTarget); if (floodFill(e.currentTarget, point, color)) { actions.current.push({ type: 'fill', color, point }); setCount(actions.current.length); } return; }
    setDrawingNow(true); e.currentTarget.setPointerCapture(e.pointerId); pointer.current = e.pointerId;
    const p = pointerPoint(e, e.currentTarget); const stroke = { points: [...p, ...p], color: eraser ? BACKGROUND : color, size };
    current.current = stroke; paintStroke(e.currentTarget, stroke);
  }
  function move(e: PointerEvent<HTMLCanvasElement>) {
    if (pointer.current !== e.pointerId || !current.current || disabled) return;
    const events = e.nativeEvent.getCoalescedEvents?.() || [e.nativeEvent];
    for (const ev of events.length ? events : [e.nativeEvent]) { const p = pointerPoint(ev, e.currentTarget); const pts = current.current.points; paintStroke(e.currentTarget, { ...current.current, points: [...pts.slice(-2), ...p] }); pts.push(...p); }
  }
  function end(e: PointerEvent<HTMLCanvasElement>) { if (pointer.current !== e.pointerId || !current.current) return; actions.current.push({ type: 'stroke', stroke: current.current }); setDrawingNow(false); current.current = null; pointer.current = null; setCount(actions.current.length); }
  function undo() { actions.current.pop(); setCount(actions.current.length); redraw(); }
  function clear() { if (!window.confirm('Clear the whole drawing?')) return; actions.current = []; setCount(0); redraw(); }
  function fill() { setFilling(true); setEraser(false); }
  return <div className={`${styles.board} ${styles.localBoard} ${className}`}><div className={styles.heading}><span>Drawing board</span><small>{turnLabel || 'Draw together'}</small></div><div className={styles.surface}><canvas ref={canvas} className={styles.canvas} onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end} aria-label="Drawing board, draw with touch, pen or mouse" />{count === 0 && !drawingNow && <span className={styles.hint}>Draw something here ✨</span>}</div><DrawingTools color={color} setColor={setColor} size={size} setSize={setSize} eraser={eraser} setEraser={value => { setEraser(value); setFilling(false); }} disabled={disabled} undo={undo} canUndo={count > 0} fill={fill} filling={filling} clear={clear}/><p className={styles.note}>{filling ? 'Tap a closed area to fill it. Gaps in the outline let color escape.' : 'Use a finger, stylus or mouse. Select Fill, then tap an area.'}</p></div>;
}
