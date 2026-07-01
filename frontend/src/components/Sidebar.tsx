import { useState } from "react";

export type View = "inicio" | "contas" | "historico" | "carteira";

interface Client {
  id: number;
  name: string;
}

interface Props {
  clients: Client[];
  selectedClientId: number | null;
  onSelectClient: (id: number) => void;
  view: View;
  onNavigate: (view: View) => void;
  onNewAccount: () => void;
}

const NAV: { key: View; label: string }[] = [
  { key: "inicio", label: "Início" },
  { key: "contas", label: "Contas" },
  { key: "historico", label: "Histórico" },
  { key: "carteira", label: "Carteira do gerente" },
];

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Navegação lateral: seletor de cliente (Titular) em foco + navegação por telas.
 * "Visualizando" reflete o modelo de gerente olhando um cliente por vez; as telas
 * (Início/Contas/Histórico) operam sobre esse cliente. A Carteira é interna.
 */
export function Sidebar({
  clients,
  selectedClientId,
  onSelectClient,
  view,
  onNavigate,
  onNewAccount,
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = clients.find((c) => c.id === selectedClientId) ?? clients[0] ?? null;

  return (
    <aside className="flex w-full flex-col gap-6 border-border bg-panel p-4 md:w-[248px] md:flex-none md:border-r">
      <div className="flex items-center gap-3 px-1.5">
        <div className="h-9 w-9 rounded-[11px] bg-gradient-to-br from-accent to-accent2 shadow-accent" />
        <div>
          <div className="font-display text-base font-bold leading-none">Agilize</div>
          <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
            Banking
          </div>
        </div>
      </div>

      {selected && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex w-full items-center gap-2.5 rounded-[13px] border border-border bg-panel2 px-2.5 py-2.5 text-left transition hover:border-accent"
          >
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-gradient-to-br from-accent2 to-accent font-display text-[12.5px] font-bold text-white">
              {initials(selected.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[9px] font-semibold uppercase tracking-[0.1em] text-muted">
                Visualizando
              </span>
              <span className="block truncate font-display text-[12.5px] font-bold">
                {selected.name}
              </span>
            </span>
            <span className="flex-none text-[9px] text-muted">{open ? "▲" : "▼"}</span>
          </button>

          {open && (
            <div className="absolute inset-x-0 top-[calc(100%+6px)] z-20 flex flex-col gap-0.5 rounded-[13px] border border-border bg-panel p-1.5 shadow-panel">
              {clients.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onSelectClient(c.id);
                    setOpen(false);
                  }}
                  className={`flex items-center gap-2.5 rounded-[10px] px-2 py-2 text-left transition hover:bg-panel2 ${
                    c.id === selected.id ? "bg-panel2" : ""
                  }`}
                >
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-[9px] bg-gradient-to-br from-accent2 to-accent font-display text-[11px] font-bold text-white">
                    {initials(c.name)}
                  </span>
                  <span className="min-w-0 truncate text-[12.5px] font-semibold">{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <nav className="flex flex-col gap-1">
        {NAV.map((n) => {
          const on = view === n.key;
          return (
            <button
              key={n.key}
              type="button"
              aria-current={on ? "true" : undefined}
              onClick={() => onNavigate(n.key)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13.5px] transition ${
                on ? "bg-chip font-semibold text-accent" : "font-medium text-muted hover:bg-panel2 hover:text-text"
              }`}
            >
              <span className={`h-[7px] w-[7px] rounded-sm ${on ? "bg-accent" : "bg-current opacity-50"}`} />
              {n.label}
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={onNewAccount}
        className="mt-auto rounded-xl border border-dashed border-border px-3 py-2.5 text-left text-[13px] font-semibold text-muted transition hover:border-accent hover:text-text"
      >
        + Nova conta
      </button>
    </aside>
  );
}
