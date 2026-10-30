/** Ashima 3D simplex noise + fbm, shared by the planet and cloud shaders. */
export const NOISE_GLSL = /* glsl */ `
vec3 mod289(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float fbm(vec3 p, int octaves) {
  float amp = 0.5;
  float freq = 1.0;
  float sum = 0.0;
  for (int i = 0; i < 6; i++) {
    if (i >= octaves) break;
    sum += amp * snoise(p * freq);
    freq *= 2.03;
    amp *= 0.5;
  }
  return sum;
}
`;

/**
 * Shared ring model. Both the ring shader and the planet shader compile this,
 * so the shadow the ring throws onto the planet lands in exactly the same gaps
 * the ring itself is drawn with — which is what sells it as one object.
 *
 * `r01` is the normalised radius across the annulus, 0 at the inner edge and
 * 1 at the outer edge.
 */
export const RING_GLSL = /* glsl */ `
float ringHash(float n) {
  return fract(sin(n * 127.1) * 43758.5453123);
}

/** Value noise in 1D — cheap, and banding wants hard structure anyway. */
float ringNoise(float x) {
  float i = floor(x);
  float f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(ringHash(i), ringHash(i + 1.0), f);
}

/** Optical depth of the ring plane at normalised radius r01. */
float ringDensity(float r01) {
  if (r01 < 0.0 || r01 > 1.0) return 0.0;

  // Coarse plateaus: a handful of broad bands rather than a smooth gradient.
  float coarse = 0.55 + 0.45 * ringNoise(r01 * 7.0);

  // Fine structure. High frequency and low amplitude reads as razor-thin
  // grooves once the ring is a few pixels tall on screen.
  float fine = 0.72 + 0.28 * ringNoise(r01 * 128.0);
  float grooves = 0.82 + 0.18 * sin(r01 * 420.0);

  // Named divisions, cut hard so they stay black instead of blurring shut.
  float cassini = smoothstep(0.40, 0.435, r01) * (1.0 - smoothstep(0.487, 0.515, r01));
  float encke = smoothstep(0.855, 0.864, r01) * (1.0 - smoothstep(0.880, 0.889, r01));
  float gaps = (1.0 - cassini * 0.96) * (1.0 - encke * 0.9);

  // Edges: sharp on the inside, tapered outward like a real debris field.
  float inner = smoothstep(0.0, 0.035, r01);
  float outer = 1.0 - smoothstep(0.93, 1.0, r01);

  return coarse * fine * grooves * gaps * inner * outer;
}
`;
