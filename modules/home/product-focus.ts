/**
 * Which product the visitor is pointing at in the header menu, read by the 3D
 * scene every frame. A plain mutable value rather than React state: the
 * scene reads it inside `useFrame`, and nothing needs to re-render.
 */
export const productFocus: { slug: string | null } = { slug: null };
