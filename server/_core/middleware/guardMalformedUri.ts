import type { Request, Response, NextFunction } from "express";

export function guardMalformedUri(req: Request, res: Response, next: NextFunction) {
  try {
    // ensure that req.path is a valid percent-encoded path
    decodeURIComponent(req.path);
    next();
  } catch (err) {
    console.warn("[Server] Malformed request path, rejecting:", req.path);
    res.status(400).send("Bad request: malformed URI");
  }
}

export default guardMalformedUri;
