import express from 'express'
import cors from 'cors'
import {prisma} from './config/prisma.js'
import UserRouter from './features/users/user.routes.js';
import WorkspaceRouter from './features/workspace/workspace.routes.js';
const app = express();

app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3000;

app.use("/api/v1/user", UserRouter);
app.use("/api/v1/workspaces", WorkspaceRouter);


async function main(){
   await prisma.$connect();
   app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
   });
}

main();
