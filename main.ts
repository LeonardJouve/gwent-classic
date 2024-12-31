Deno.serve({port: Number(Deno.env.get("WEBSOCKET_PORT"))}, (req) => {
    if (req.headers.get("upgrade") != "websocket") {
        return new Response(null, {status: 501});
    }

    const {socket, response} = Deno.upgradeWebSocket(req);

    socket.addEventListener("open", (...params) => console.log("OPEN", ...params));
    socket.addEventListener("close", (...params) => console.log("CLOSE", ...params));
    socket.addEventListener("message", (event) => {
        if (event.data === "ping") {
        socket.send("pong");
        }
    });
    return response;
});

Deno.serve({port: Number(Deno.env.get("WEBSERVER_PORT"))}, async () => new Response(await Deno.readFile("client.html")));
