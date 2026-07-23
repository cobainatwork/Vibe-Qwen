import { useEffect, useState } from "react";

import { fetchHealth } from "./api";
import { SECTIONS, isSubmitDisabled, type Health, type SectionKey } from "./health";

type HealthState =
  | { status: "loading" }
  | { status: "ready"; health: Health }
  | { status: "error"; message: string };

function useHealth(pollMs = 10000): HealthState {
  const [state, setState] = useState<HealthState>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const health = await fetchHealth();
        if (alive) setState({ status: "ready", health });
      } catch (err) {
        if (alive) {
          setState({
            status: "error",
            message: err instanceof Error ? err.message : "未知錯誤",
          });
        }
      }
    };
    void load();
    const id = setInterval(() => void load(), pollMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [pollMs]);

  return state;
}

function ServiceChip({
  name,
  ready,
  errored,
}: {
  name: string;
  ready: boolean | null;
  errored: boolean;
}) {
  const kind = errored ? "down" : ready == null ? "unknown" : ready ? "ready" : "down";
  const label = errored ? "連線失敗" : ready == null ? "查詢中" : ready ? "就緒" : "未就緒";
  return (
    <span className={`chip chip--${kind}`}>
      <span className="chip__dot" aria-hidden="true" />
      {name} · {label}
    </span>
  );
}

function StatusStrip({ state }: { state: HealthState }) {
  const health = state.status === "ready" ? state.health : null;
  const errored = state.status === "error";
  return (
    <div className="status-strip" role="status">
      <ServiceChip name="ASR" ready={health ? health.asr.ready : null} errored={errored} />
      <ServiceChip name="TTS" ready={health ? health.tts.ready : null} errored={errored} />
      {errored && <span className="status-strip__error">健康檢查連線失敗：{state.message}</span>}
    </div>
  );
}

function SectionPanel({ section, state }: { section: SectionKey; state: HealthState }) {
  const meta = SECTIONS.find((s) => s.key === section)!;
  const health = state.status === "ready" ? state.health : null;
  const disabled = isSubmitDisabled(section, health);
  const blockingSvc = meta.requires.find((svc) => !health || !health[svc].ready);

  return (
    <section className="panel">
      <h2 className="panel__title">{meta.label}</h2>
      <p className="panel__note">此區塊功能於後續實作票交付；目前為 walking skeleton 佔位。</p>
      {disabled && meta.requires.length > 0 && (
        <p className="panel__warn">
          {blockingSvc?.toUpperCase()} 服務尚未就緒，已停用送出以避免無效操作。
        </p>
      )}
      <button className="btn" type="button" disabled={disabled}>
        送出
      </button>
    </section>
  );
}

export function App() {
  const state = useHealth();
  const [active, setActive] = useState<SectionKey>("hotwords");

  return (
    <div className="app">
      <header className="app__header">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">◑</span>
          Vibe-Qwen 主控台
        </div>
        <StatusStrip state={state} />
      </header>

      <nav className="tabs" aria-label="功能區塊">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            className={s.key === active ? "tab tab--active" : "tab"}
            aria-current={s.key === active}
            onClick={() => setActive(s.key)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <main className="app__main">
        <SectionPanel section={active} state={state} />
      </main>
    </div>
  );
}
