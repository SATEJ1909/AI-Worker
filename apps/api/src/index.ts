import express from 'express'
import cors from 'cors'
import { prisma } from './config/prisma.js'
import UserRouter from './features/users/user.routes.js';
import WorkspaceRouter from './features/workspace/workspace.routes.js';
import GitHubRouter from './features/integrations/github/github.routes.js';

const app = express();

app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3000;

app.use("/api/v1/user", UserRouter);
app.use("/api/v1/workspaces", WorkspaceRouter);
app.use("/api/integrations/github", GitHubRouter);

async function main() {
   await prisma.$connect();
   app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
   });
}

main();
