export interface GpuTimer {
  begin(): void;
  end(): void;
  /** Milliseconds of GPU time for the oldest finished frame, if one is ready. */
  read(): number | undefined;
  dispose(): void;
}

const IN_FLIGHT = 4;

export function createGpuTimer(gl: WebGL2RenderingContext): GpuTimer | null {
  const ext = gl.getExtension("EXT_disjoint_timer_query_webgl2");
  if (!ext) return null;

  const free: WebGLQuery[] = [];
  const pending: WebGLQuery[] = [];
  let open: WebGLQuery | null = null;

  return {
    begin() {
      if (open || pending.length >= IN_FLIGHT) return;
      open = free.pop() ?? gl.createQuery();
      if (open) gl.beginQuery(ext.TIME_ELAPSED_EXT, open);
    },
    end() {
      if (!open) return;
      gl.endQuery(ext.TIME_ELAPSED_EXT);
      pending.push(open);
      open = null;
    },
    read() {
      const query = pending[0];
      if (!query || !gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE)) return undefined;
      pending.shift();
      free.push(query);
      if (gl.getParameter(ext.GPU_DISJOINT_EXT)) return undefined;
      return gl.getQueryParameter(query, gl.QUERY_RESULT) / 1e6;
    },
    dispose() {
      if (open) gl.endQuery(ext.TIME_ELAPSED_EXT);
      for (const query of [...free, ...pending, ...(open ? [open] : [])]) gl.deleteQuery(query);
      free.length = 0;
      pending.length = 0;
      open = null;
    },
  };
}
