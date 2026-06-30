# Contexto — Banco Agilize

Glossário da linguagem ubíqua do domínio. Sem detalhes de implementação.

## Termos

### Conta
Entidade que guarda saldo (em centavos) e tem um **Tipo**. Identificada por `id` e
`nome` do titular.

### Tipo de conta
Discriminador do comportamento da Conta sob saque/transferência:
- **Corrente** — tarifa de R$ 1,00 por operação; pode ficar negativa até −R$ 500,00
  (cheque especial).
- **Poupança** — sem tarifa; nunca pode ficar negativa.

### Conta ativa
A única Conta sobre a qual a UI opera num dado momento. O frontend é
single-active-account: existe exatamente uma Conta ativa por vez (ou nenhuma, se não
há contas). Saque, histórico e a origem de uma transferência referem-se sempre à
Conta ativa. Trocar a Conta ativa reflete na tela sem reload.

### Saque
Débito de uma Conta. Aplica as regras do Tipo (tarifa/limite).

### Transferência
Débito na Conta de origem (aplicando as regras do Tipo da origem, inclusive tarifa)
e crédito integral na Conta de destino. Operação atômica.
