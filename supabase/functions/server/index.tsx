import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createPaymentIntent, confirmPayment } from "./payment.tsx";
import { calculateDistance, geocodeAddress } from "./maps.tsx";
import { sendMessage, getMessages, getConversations } from "./chat.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-7b39351d/health", (c) => {
  return c.json({ status: "ok" });
});

// Payment routes
app.post("/make-server-7b39351d/payment/create-intent", createPaymentIntent);
app.post("/make-server-7b39351d/payment/confirm", confirmPayment);

// Maps routes
app.post("/make-server-7b39351d/maps/distance", calculateDistance);
app.post("/make-server-7b39351d/maps/geocode", geocodeAddress);

// Chat routes
app.post("/make-server-7b39351d/chat/send", sendMessage);
app.get("/make-server-7b39351d/chat/messages", getMessages);
app.get("/make-server-7b39351d/chat/conversations", getConversations);

Deno.serve(app.fetch);