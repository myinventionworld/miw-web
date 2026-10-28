import type { ArchEdge, ArchNode } from "@/data/projects";

/**
 * Architecture diagrams are laid out on a declared grid, not force-directed.
 * A diagram that moves its own boxes between renders is a diagram nobody can
 * point at in a meeting.
 */

const PAD = 16;
const COL_W = 178;
const NODE_W = 152;
const NODE_H = 46;
const ROW_GAP = 80;

/**
 * Colours are the page's own variables, so the same drawing reads on the dark
 * flight deck and on the light case-study pages. Services and streams take the
 * link colour; stores and models a strong neutral; entry points stay quiet.
 */
const mix = (v: string, pct: number) =>
  `color-mix(in srgb, var(${v}) ${pct}%, transparent)`;

const KIND: Record<ArchNode["kind"], { stroke: string; text: string }> = {
  entry: { stroke: mix("--color-zinc", 45), text: "var(--color-zinc)" },
  service: { stroke: mix("--color-comet", 70), text: "var(--color-white)" },
  store: { stroke: mix("--color-white", 45), text: "var(--color-white)" },
  stream: { stroke: mix("--color-comet", 70), text: "var(--color-white)" },
  model: { stroke: mix("--color-white", 45), text: "var(--color-white)" },
};

/**
 * Labels arrive resolved. The grid is this component's, the language is the
 * caller's — an edge with no annotation is an empty string here, not a flag in
 * the data that someone has to keep in sync with the copy.
 */
export function ArchDiagram({
  nodes,
  edges,
  label,
}: {
  nodes: (ArchNode & { label: string })[];
  edges: (ArchEdge & { label?: string })[];
  label: string;
}) {
  const maxCol = Math.max(...nodes.map((n) => n.col));
  const width = PAD * 2 + maxCol * COL_W + NODE_W;

  // Each column is centred on the band independently, so a column with one
  // node sits level with the middle of a column with three.
  const rowsIn = new Map<number, number>();
  for (const n of nodes) rowsIn.set(n.col, Math.max(rowsIn.get(n.col) ?? 0, n.row + 1));
  const maxRows = Math.max(...rowsIn.values());
  const height = PAD * 2 + (maxRows - 1) * ROW_GAP + NODE_H;
  const mid = height / 2;

  const pos = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    const count = rowsIn.get(n.col) ?? 1;
    pos.set(n.id, {
      x: PAD + n.col * COL_W,
      y: mid - NODE_H / 2 + (n.row - (count - 1) / 2) * ROW_GAP,
    });
  }

  return (
    <div className="thin-scroll -mx-6 overflow-x-auto px-6 md:mx-0 md:px-0">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        className="h-auto max-w-full min-w-[640px]"
        role="img"
        aria-label={label}
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,1 L7,4 L0,7 z" style={{ fill: mix("--color-white", 50) }} />
          </marker>
        </defs>

        {edges.map((e) => {
          const a = pos.get(e.from);
          const b = pos.get(e.to);
          if (!a || !b) return null;

          const x1 = a.x + NODE_W;
          const y1 = a.y + NODE_H / 2;
          const x2 = b.x;
          const y2 = b.y + NODE_H / 2;
          const cx = (x1 + x2) / 2;

          return (
            <g key={`${e.from}-${e.to}`}>
              <path
                d={`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`}
                fill="none"
                style={{ stroke: mix("--color-white", 28) }}
                strokeWidth="1.2"
                markerEnd="url(#arrow)"
              />
              {e.label && (
                <text
                  x={cx}
                  y={(y1 + y2) / 2 - 7}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontFamily="ui-monospace, SFMono-Regular, monospace"
                  letterSpacing="0.1em"
                  style={{ fill: "var(--color-zinc)", stroke: "var(--color-void)" }}
                  strokeWidth="4"
                  paintOrder="stroke"
                >
                  {e.label}
                </text>
              )}
            </g>
          );
        })}

        {nodes.map((n) => {
          const p = pos.get(n.id)!;
          const tone = KIND[n.kind];
          return (
            <g key={n.id}>
              <rect
                x={p.x}
                y={p.y}
                width={NODE_W}
                height={NODE_H}
                rx="6"
                style={{ fill: "var(--color-void)", stroke: tone.stroke }}
                strokeWidth="1"
              />
              <text
                x={p.x + NODE_W / 2}
                y={p.y + NODE_H / 2 + 4}
                textAnchor="middle"
                fontSize="12"
                fontWeight="500"
                fontFamily="Onest Variable, ui-sans-serif, system-ui, sans-serif"
                style={{ fill: tone.text }}
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
