import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import App from "./App";

// Corta a borda HTTP: o componente nunca fala com o backend nos smokes.
vi.mock("./api/bankApi", () => ({
  bankApi: {
    listAccounts: vi.fn().mockResolvedValue([
      {
        id: 1,
        type: "checking",
        balance: 1000,
        created_at: "2026-01-01 00:00:00",
        owner: { id: 1, name: "João Silva" },
      },
    ]),
    listTitulares: vi.fn().mockResolvedValue([{ id: 1, nome: "João Silva" }]),
    history: vi.fn().mockResolvedValue([]),
  },
  ApiRequestError: class ApiRequestError extends Error {},
}));

afterEach(cleanup);

describe("App (smoke)", () => {
  it("renderiza a conta ativa carregada da API", async () => {
    render(<App />);
    expect(await screen.findByText("João Silva")).toBeTruthy();
  });

  it("abre o modal ao clicar em + Nova conta", async () => {
    render(<App />);
    await screen.findByText("João Silva"); // espera o carregamento inicial
    fireEvent.click(screen.getByText("+ Nova conta"));
    expect(await screen.findByText("Nova conta")).toBeTruthy();
  });
});
