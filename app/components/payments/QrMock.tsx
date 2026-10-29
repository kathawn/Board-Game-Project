function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFrom(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** QR giả (FR-TTGV-06 là mock, CLAUDE.md quy tắc 5): ô ngẫu nhiên theo nội dung mã + 3 ô định vị
 * ở góc. Không quét được — chỉ để minh hoạ. */
export function QrMock({ value }: { value: string }) {
  const N = 29;
  const rand = mulberry32(seedFrom(value));
  const rects: React.ReactNode[] = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const zone = (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8);
      let on: boolean;
      if (zone) {
        const lx = x < 8 ? x : x - (N - 8);
        const ly = y < 8 ? y : y - (N - 8);
        on =
          lx < 7 &&
          ly < 7 &&
          (lx === 0 || lx === 6 || ly === 0 || ly === 6 || (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4));
      } else {
        on = rand() > 0.52;
      }
      if (on) rects.push(<rect key={`${x}-${y}`} x={x + 2} y={y + 2} width={1} height={1} />);
    }
  }
  return (
    <svg
      viewBox={`0 0 ${N + 4} ${N + 4}`}
      className="h-full w-full"
      fill="#2a1f1a"
      shapeRendering="crispEdges"
      role="img"
      aria-label="Mã QR thanh toán MoMo (minh hoạ)"
    >
      <rect width={N + 4} height={N + 4} fill="#fffdf8" />
      {rects}
    </svg>
  );
}
