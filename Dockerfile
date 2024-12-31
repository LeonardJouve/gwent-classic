FROM denoland/deno:alpine

WORKDIR /app

ADD . /app

RUN deno install --entrypoint main.ts

CMD ["run", "--allow-read", "--env-file", "--allow-env", "--allow-net", "main.ts"]
