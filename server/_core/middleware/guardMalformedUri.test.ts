import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import guardMalformedUri from "./guardMalformedUri";

describe("guardMalformedUri middleware", () => {
  it("returns 200 for a normal path", async () => {
    const app = express();
    app.use(guardMalformedUri);
    app.get("/", (req, res) => res.send("ok"));
    await request(app).get("/").expect(200, "ok");
  });

  it("returns 400 for malformed path containing literal %V... placeholder", async () => {
    const app = express();
    app.use(guardMalformedUri);
    app.get("/", (req, res) => res.send("ok"));
    // Request a path with a non-hex percent sequence that decodeURIComponent would throw on
    await request(app).get("/%VITE_ANALYTICS_ENDPOINT%/umami").expect(400);
  });
});
