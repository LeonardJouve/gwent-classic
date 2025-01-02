FROM denoland/deno:alpine

WORKDIR /app

ADD . /app

RUN deno install --entrypoint server/main.ts

CMD ["task", "start"]
