import cors from "cors";
import express, { type Request, type Response } from "express";
import { getAllowedOrigins, isAllowedOrigin } from "./src/config";
import { fetchPronunciationAudio } from "./src/pronunciation";
import { fetchProxiedImage } from "./src/proxy-image";

const app = express();
const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const allowedOrigins = getAllowedOrigins();

app.use(express.json({ limit: "16kb" }));

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin, allowedOrigins)) {
        return callback(null, true);
      }

      return callback(
        new Error("The CORS policy for this site does not allow access from the specified Origin."),
      );
    },
  }),
);

app.get("/", (_req: Request, res: Response) => {
  res.send("Hello from llaio-api!");
});

app.get("/api/proxy-image", async (req: Request, res: Response) => {
  const url = typeof req.query.url === "string" ? req.query.url : "";
  const result = await fetchProxiedImage(url);

  for (const [name, value] of Object.entries(result.headers)) {
    res.setHeader(name, value);
  }

  if (result.body) {
    res.status(result.status).send(result.body);
    return;
  }

  res.status(result.status).json(result.json ?? { error: "Unknown proxy error" });
});

app.post("/api/pronunciation", async (req: Request, res: Response) => {
  const text = typeof req.body?.text === "string" ? req.body.text : "";
  const targetLanguage =
    typeof req.body?.targetLanguage === "string" ? req.body.targetLanguage : "";

  const result = await fetchPronunciationAudio({
    text,
    targetLanguage,
  });

  for (const [name, value] of Object.entries(result.headers)) {
    res.setHeader(name, value);
  }

  if (result.body) {
    res.status(result.status).send(result.body);
    return;
  }

  res.status(result.status).json(result.json ?? { error: "Unknown pronunciation error" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`llaio-api listening on port ${port}`);
});
