import 'dotenv/config';
import express from 'express';
import cors from 'cors'
import { prisma } from './config/prisma.js'
import UserRouter from './features/users/user.routes.js';
import WorkspaceRouter from './features/workspace/workspace.routes.js';
import GitHubRouter from './features/integrations/github/github.routes.js';
import GoogleRouter from './features/integrations/google/google.routes.js';
import ChatRouter from './features/chat/chat.routes.js';
import { registerAllTools } from './features/tools/index.js';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3001,http://localhost:3000').split(',');
app.use(cors({
   origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
         callback(null, true);
      } else {
         callback(new Error('Not allowed by CORS'));
      }
   },
   credentials: true
}));
app.use(express.json({
   verify: (req: any, _res, buf) => {
      // Store raw body for webhook signature verification
      req.rawBody = buf.toString();
   },
}));
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
   res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use("/api/v1/user", UserRouter);
app.use("/api/v1/workspaces", WorkspaceRouter);
app.use("/api/v1/workspaces/:id/chat", ChatRouter);
app.use("/api/integrations/github", GitHubRouter);
app.use("/api/integrations/google", GoogleRouter);

async function main() {
   await prisma.$connect();
   registerAllTools();
   app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
   });
}

main();
