# Contexto — Banco Agilize

Glossário da linguagem ubíqua do domínio. Sem detalhes de implementação.

## Termos

### Titular
Dono de Contas, identificado por `id` e com um `nome`. Um Titular possui uma ou mais
Contas. O `nome` não é único — a identidade é o `id`, então dois homônimos são
Titulares distintos. O nome do dono vive só aqui (fonte única da verdade); a Conta
não o duplica.

### Conta
Entidade que guarda saldo (em centavos), tem um **Tipo** e pertence a um **Titular**.
Identificada por `id`; referencia o Titular dono. Vários tipos de Conta podem pertencer
ao mesmo Titular (ex.: João tem Corrente e Poupança).

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

### Saldo inicial
Saldo com que uma Conta nasce na criação. Opcional (default 0); nunca negativo — o
cheque especial da Corrente só surge de Saque, jamais da criação.

### Entrada de fundos
Dinheiro entra numa Conta por apenas dois caminhos: o Saldo inicial na criação e o
crédito de uma Transferência recebida. **Não existe operação de depósito** — está
fora do escopo (a spec cobre Saque e Transferência).
