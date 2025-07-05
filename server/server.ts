import express from "express";
import http from "node:http";
import path from "node:path";
import {fileURLToPath} from "node:url";
import SocketHandler from "./socket";
import MatchmakingHandler from "./matchmaking";

const app = express();

app.use(express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), "dist")));
const server = http.createServer(app);

const socketHandler = new SocketHandler(server);
const matchmaking = new MatchmakingHandler(socketHandler);
app.post("/matchmaking", matchmaking.handle);

server.listen(process.env.PORT ?? 3000, () => console.log("Server listening..."));

