import { useCallback, useRef, useState } from 'react';
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { BTN_RESET } from './palette';

/**
 * The app's shared drawing board.
 *
 * React Native has no <canvas>, so the board is a react-native-svg <Path> per stroke.
 * Each stroke is a list of normalised 0..1 points, which is exactly the shape the server
 * already speaks (`Stroke = { points, color, size }`) — so the local board and the online
 * board are the same component with different owners.
 *
 * One finger draws. The path is rebuilt from points on every move, which is fine at this
 * size: a round is a few dozen strokes of a few hundred points.
 */

export type Stroke = { points: number[]; color: string; size: number };

const COLORS = [
  '#FFFFFF', '#111827', '#6B7280', '#F87171', '#FB923C',
  '#FBBF24', '#4ADE80', '#34D399', '#60A5FA', '#A78BFA', '#F472B6', '#B45309',
] as const;

const SIZES = [
  { id: 'fine', value: 3 },
  { id: 'medium', value: 7 },
  { id: 'bold', value: 14 },
] as const;

const BOARD_BG = '#171029';

/** Turn a flat [x0,y0,x1,y1,…] list into a smooth SVG path in board pixels. */
function toPath(points: number[], width: number, height: number): string {
  if (points.length < 2) return '';
  const px = (v: number) => (v * width).toFixed(1);
  const py = (v: number) => (v * height).toFixed(1);
  let d = `M ${px(points[0]!)} ${py(points[1]!)}`;
  if (points.length === 2) {
    // a tap leaves a dot: a zero-length line with a round cap renders as a circle
    d += ` L ${px(points[0]!)} ${py(points[1]!)}`;
    return d;
  }
  for (let i = 2; i < points.length; i += 2) {
    d += ` L ${px(points[i]!)} ${py(points[i + 1]!)}`;
  }
  return d;
}

export function DrawingBoard({
  onDone,
  nextLabel,
  canDraw = true,
  strokes: remote = [],
  onStroke,
}: {
  /** Called by Done. The screen decides whether that ends the round. */
  onDone?: () => void;
  /** Who draws next, shown on the Done button. */
  nextLabel?: string;
  canDraw?: boolean;
  /** Strokes already committed (online). Local mode keeps its own list. */
  strokes?: Stroke[];
  /** Online: report a finished stroke to the owner of the board. */
  onStroke?: (stroke: Stroke) => void;
}) {
  const [mine, setMine] = useState<Stroke[]>([]);
  const [current, setCurrent] = useState<number[]>([]);
  const [color, setColor] = useState<string>('#FFFFFF');
  const [size, setSize] = useState<number>(7);
  const [erasing, setErasing] = useState(false);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const points = useRef<number[]>([]);

  const strokes = onStroke ? remote : mine;

  const toNorm = useCallback(
    (event: GestureResponderEvent): [number, number] => {
      const { locationX, locationY } = event.nativeEvent;
      const x = box.width > 0 ? Math.min(1, Math.max(0, locationX / box.width)) : 0;
      const y = box.height > 0 ? Math.min(1, Math.max(0, locationY / box.height)) : 0;
      return [x, y];
    },
    [box.width, box.height],
  );

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => canDraw,
      onMoveShouldSetPanResponder: () => canDraw,
      onPanResponderGrant: (event) => {
        const [x, y] = toNorm(event);
        points.current = [x, y];
        setCurrent([x, y]);
      },
      onPanResponderMove: (event) => {
        const [x, y] = toNorm(event);
        const list = points.current;
        const lastX = list[list.length - 2] ?? 0;
        const lastY = list[list.length - 1] ?? 0;
        // thin out: skip points closer than ~1% of the board
        if (Math.abs(x - lastX) < 0.006 && Math.abs(y - lastY) < 0.006) return;
        list.push(x, y);
        setCurrent([...list]);
      },
      onPanResponderRelease: () => {
        const list = points.current;
        points.current = [];
        setCurrent([]);
        if (list.length < 2) return;
        const stroke: Stroke = {
          points: list,
          color: erasing ? BOARD_BG : color,
          size,
        };
        if (onStroke) onStroke(stroke);
        else setMine((existing) => [...existing, stroke]);
      },
      onPanResponderTerminate: () => {
        points.current = [];
        setCurrent([]);
      },
    }),
  ).current;

  const livePath = toPath(current, box.width, box.height);

  return (
    <View style={styles.root}>
      {/* ---- board ---- */}
      <View
        style={styles.board}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setBox({ width, height });
        }}
        {...responder.panHandlers}
      >
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          {strokes.map((stroke, index) => (
            <Path
              key={index}
              d={toPath(stroke.points, box.width, box.height)}
              stroke={stroke.color}
              strokeWidth={stroke.size}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
          {livePath ? (
            <Path
              d={livePath}
              stroke={erasing ? BOARD_BG : color}
              strokeWidth={size}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ) : null}
        </Svg>

        {strokes.length === 0 && !livePath && canDraw ? (
          <View pointerEvents="none" style={styles.hintWrap}>
            <Text style={styles.hint}>Draw here</Text>
            <Text style={styles.hintSub}>Everyone adds to one picture</Text>
          </View>
        ) : null}
        {!canDraw ? (
          <View pointerEvents="none" style={styles.blocked}>
            <Text style={styles.blockedText}>Watch the board</Text>
          </View>
        ) : null}
      </View>

      {/* ---- palette ---- */}
      <View style={styles.palette}>
        <View style={styles.swatches}>
          {COLORS.map((hex) => {
            const active = !erasing && hex === color;
            return (
              <Pressable
                key={hex}
                onPress={() => {
                  setColor(hex);
                  setErasing(false);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Colour ${hex}`}
                accessibilityState={{ selected: active }}
                style={[
                  styles.swatch,
                  { backgroundColor: hex },
                  active && styles.swatchActive,
                ]}
              />
            );
          })}
        </View>

        <View style={styles.tools}>
          {SIZES.map((option) => {
            const active = !erasing && size === option.value;
            return (
              <Pressable
                key={option.id}
                onPress={() => {
                  setSize(option.value);
                  setErasing(false);
                }}
                accessibilityRole="button"
                accessibilityLabel={`${option.id} brush`}
                accessibilityState={{ selected: active }}
                style={[BTN_RESET, styles.tool, active && styles.toolActive]}
              >
                <View
                  style={{
                    width: Math.min(15, option.value),
                    height: Math.min(15, option.value),
                    borderRadius: 99,
                    backgroundColor: '#FFFFFF',
                  }}
                />
              </Pressable>
            );
          })}

          <Pressable
            onPress={() => setErasing((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel="Eraser"
            accessibilityState={{ selected: erasing }}
            style={[BTN_RESET, styles.tool, erasing && styles.toolActive]}
          >
            <Text style={styles.toolGlyph}>⌫</Text>
          </Pressable>

          <Pressable
            onPress={() => (onStroke ? undefined : setMine([]))}
            disabled={Boolean(onStroke) || (!onStroke && strokes.length === 0)}
            accessibilityRole="button"
            accessibilityLabel="Clear"
            style={[
              BTN_RESET,
              styles.tool,
              (onStroke || strokes.length === 0) && styles.disabled,
            ]}
          >
            <Text style={styles.toolGlyph}>✕</Text>
          </Pressable>

          {onDone ? (
            <Pressable
              onPress={onDone}
              accessibilityRole="button"
              accessibilityLabel="Done drawing"
              style={[BTN_RESET, styles.done]}
            >
              <Text style={styles.doneText}>{nextLabel ? `Done · ${nextLabel}` : 'Done'}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  board: {
    height: 260,
    borderRadius: 16,
    backgroundColor: BOARD_BG,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },
  hintWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 3 },
  hint: { fontSize: 11, fontWeight: '800', letterSpacing: 2, color: 'rgba(255,255,255,0.28)' },
  hintSub: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.18)' },
  blocked: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  blockedText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4, color: 'rgba(255,255,255,0.35)' },

  palette: {
    borderRadius: 14,
    backgroundColor: 'rgba(11,6,24,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 8,
    gap: 8,
  },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: 99,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  swatchActive: { borderColor: '#FFFFFF', transform: [{ scale: 1.12 }] },

  tools: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  tool: {
    height: 32,
    width: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  toolActive: { backgroundColor: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.4)' },
  toolGlyph: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  disabled: { opacity: 0.35 },
  done: {
    marginLeft: 'auto',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#EA580C',
  },
  doneText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, color: '#FFFFFF' },
});
