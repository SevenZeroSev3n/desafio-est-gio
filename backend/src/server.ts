import db from "./db/database";
import { createApp } from "./app";
import { seedIfEmpty } from "./db/seed";

const PORT = Number(process.env.PORT) || 3001;

seedIfEmpty();

createApp(db).listen(PORT, () => {
  console.log(`API do Banco rodando em http://localhost:${PORT}`);
});
