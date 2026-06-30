# Frontend é single-active-account

O frontend exibia todas as contas simultaneamente num grid de cards, com saque,
histórico e transferência operando por card. Decidimos substituir esse modelo por um
**single-active-account**: um seletor escolhe a Conta ativa e toda a UI (saldo, saque,
histórico, origem da transferência) opera apenas sobre ela.

## Por quê

O grid-de-todas-as-contas e um seletor de conta ativa resolvem o mesmo problema —
escolher sobre qual conta operar. Manter os dois seria duplicação de UX. O modelo de
conta ativa simplifica os formulários (saque sem alvo explícito; transferência com
origem travada, eliminando por construção o caso origem == destino) e dá base limpa
para a criação de contas (Fase 2), que pode tornar a nova conta ativa na hora.

## Trade-off aceito

Perde-se a visão de todas as contas de relance. Para inspecionar outra conta é preciso
trocá-la no seletor. Aceitável no escopo do desafio (poucas contas, foco em demonstrar
as regras R1/R2 com clareza).
