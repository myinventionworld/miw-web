import s from "./cookie-banner.module.css";

export function Alien() {
  return (
    <pre
      aria-hidden
      className="shrink-0 font-mono text-[11px] leading-[1.15] text-zinc select-none"
    >
      {"  "}
      <span className={`text-comet ${s.pulse}`}>*</span>
      {"   "}
      <span className={`text-comet ${s.pulse}`}>*</span>
      {"\n   \\ /\n .-'''-.\n( "}
      <span className={s.blink}>o</span>
      {" "}
      <span className={s.blink}>o</span>
      {" )\n \\  ~  /\n /'---'\\_"}
      <span className="text-comet">(::)</span>
      {"\n/ |   | \\"}
    </pre>
  );
}
