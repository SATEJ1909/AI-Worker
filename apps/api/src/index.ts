import express from 'express'
import cors from 'cors'
import { db } from './config/drizzle.js';
import userRouter from './auth/auth.routes.js';
const app = express();

app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3000;

app.use("/api/users" , userRouter);


async function main(){
    try {
    await db.execute("SELECT 1");

    console.log("Database connected");

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  }
}

main();