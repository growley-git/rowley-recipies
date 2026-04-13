import "dotenv/config";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express4";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { createContext } from "./context.js";
import { typeDefs } from "./graphql/typeDefs.js";
import { resolvers } from "./resolvers/index.js";

const prisma = new PrismaClient();
const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? true,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

const apollo = new ApolloServer({ typeDefs, resolvers });
await apollo.start();

app.use(
  "/graphql",
  expressMiddleware(apollo, {
    context: async ({ req, res }) => {
      let sessionKey = req.cookies?.rr_session as string | undefined;
      if (!sessionKey) {
        sessionKey = randomUUID();
        res.cookie("rr_session", sessionKey, {
          httpOnly: true,
          sameSite: "lax",
          maxAge: 365 * 24 * 60 * 60 * 1000,
          path: "/",
        });
      }
      const authHeader = req.headers.authorization;
      return createContext({ prisma, authHeader, sessionKey });
    },
  })
);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Rowley API http://localhost:${port}/graphql`);
});
