import { createApp } from "./app";
import { seedIfEmpty } from "./db/seed";

const PORT = Number(process.env.PORT) || 3001;

seedIfEmpty();

createApp().listen(PORT, () => {
  console.log(`API do Banco rodando em http://localhost:${PORT}`);
});
