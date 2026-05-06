/**
 * @file src/index.js
 * @description Application entry point and server bootstrap.
 *
 * Boot sequence:
 *   1. Load and validate environment variables (crashes fast if misconfigured)
 *   2. Create Express app and HTTP server
 *   3. Mount global middleware (CORS, JSON body parser)
 *   4. Initialise Socket.IO gateway and inject it into the service layer
 *   5. Build GraphQL schema and start Apollo Server
 *   6. Mount all Express routes (GraphQL, REST, health)
 *   7. Start listening
 *
 * Everything is wrapped in `bootstrap()` so top-level await is not required
 * and errors during startup are caught and logged before process exit.
 */

import { createServer } from "http";
import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { makeExecutableSchema } from "@graphql-tools/schema";

import { env } from "./config/env.js";
import { typeDefs } from "./graphql/typeDefs.js";
import { resolvers } from "./graphql/resolvers.js";
import { buildContext } from "./middleware/auth.js";
import { chatGateway } from "./chat/gateway.js";
import { setChatGateway } from "./services/conversations.js";
import { uploadRouter } from "./routes/upload.js";

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap() {
  const app = express();
  const httpServer = createServer(app);

  // ── Global middleware ────────────────────────────────────────────────────────

  app.use(
    cors({
      origin: [
        env.FRONTEND_URL,
        "http://localhost:8100",
        "https://api.anthropic.com",
        "http://localhost:3001",
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  // Raise the JSON body limit to accommodate base64-encoded media payloads
  // (default is 100 kb which is too small for images sent via GraphQL variables)
  app.use(express.json({ limit: "50mb" }));

  // ── Real-time gateway ─────────────────────────────────────────────────────────

  chatGateway.init(httpServer);
  setChatGateway(chatGateway); // break circular dependency via injection

  // ── GraphQL ───────────────────────────────────────────────────────────────────

  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const apolloServer = new ApolloServer({
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    introspection: !env.IS_PROD, // Disable introspection in production
  });

  await apolloServer.start();

  app.use(
    "/graphql",
    expressMiddleware(apolloServer, { context: buildContext }),
  );

  // ── REST routes ───────────────────────────────────────────────────────────────

  app.use("/upload", uploadRouter);

  // ── AI proxy (Groq → Anthropic-compatible response shape) ────────────────────

  app.post("/api/claude", async (req, res) => {
    try {
      const { messages = [], system, max_tokens } = req.body;
      const groqMessages = [];

      if (system) groqMessages.push({ role: "system", content: system });
      groqMessages.push(...messages);

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: groqMessages,
            max_tokens: max_tokens ?? 1000,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        return res
          .status(response.status)
          .json({ error: data.error?.message ?? "Groq API error." });
      }

      // Re-shape to Anthropic-style so the frontend client works as-is
      const text = data.choices?.[0]?.message?.content ?? "";
      return res.json({ content: [{ type: "text", text }] });
    } catch (err) {
      console.error("[/api/claude]", err.message);
      return res.status(500).json({ error: "AI proxy request failed." });
    }
  });

  // ── Image generation proxy (Pollinations.ai) ──────────────────────────────────

  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt)
        return res.status(400).json({ error: "`prompt` is required." });

      const imageUrl =
        `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
        `?width=512&height=512&nologo=true&seed=${Date.now()}`;

      const imgRes = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ChatApp/2.0)",
          Accept: "image/*",
        },
        signal: AbortSignal.timeout(30_000),
      });

      if (!imgRes.ok) {
        return res
          .status(imgRes.status)
          .json({ error: `Image fetch failed (${imgRes.status}).` });
      }

      const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
      const base64 = Buffer.from(await imgRes.arrayBuffer()).toString("base64");
      return res.json({ imageData: `data:${contentType};base64,${base64}` });
    } catch (err) {
      console.error("[/api/generate-image]", err.message);
      return res
        .status(500)
        .json({ error: err.message ?? "Image generation failed." });
    }
  });

  // ── Health check ───────────────────────────────────────────────────────────────

  app.get("/health", (_, res) =>
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      env: env.NODE_ENV,
    }),
  );

  // ── Listen ────────────────────────────────────────────────────────────────────

  await new Promise((resolve) => httpServer.listen(env.PORT, resolve));

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🚀  GraphQL   →  http://localhost:${env.PORT}/graphql`);
  console.log(`🔌  Socket.IO →  ws://localhost:${env.PORT}`);
  console.log(`❤️   Health    →  http://localhost:${env.PORT}/health`);
  console.log(`📎  Upload    →  http://localhost:${env.PORT}/upload`);
  console.log(`🌍  Env       →  ${env.NODE_ENV}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

// ─── Entry point ──────────────────────────────────────────────────────────────

bootstrap().catch((err) => {
  console.error("❌ Fatal: server failed to start.\n", err);
  process.exit(1);
});
