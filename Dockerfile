FROM denoland/deno:alpine

WORKDIR /app

ADD . /app

RUN deno install --entrypoint server/main.ts

CMD ["run", "--allow-read=./static", "--env-file", "--allow-env", "--allow-net", "server/main.ts"]
