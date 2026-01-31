import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { tleService } from "./tleService";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/satellites", (_req, res) => {
    const satellites = tleService.getAllSatellites();
    res.json({
      satellites,
      lastUpdate: tleService.getLastUpdateTime(),
      count: satellites.length
    });
  });

  app.get("/api/satellites/:noradId", (req, res) => {
    const satellite = tleService.getSatellite(req.params.noradId);
    if (satellite) {
      res.json(satellite);
    } else {
      res.status(404).json({ error: "Satellite not found" });
    }
  });

  app.post("/api/satellites/refresh", async (_req, res) => {
    try {
      await tleService.fetchLatestTLEs();
      res.json({
        success: true,
        count: tleService.getCacheSize(),
        lastUpdate: tleService.getLastUpdateTime()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to refresh TLE data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
