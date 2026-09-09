# to test the finder install script

FROM alpine:latest

RUN apk add --no-cache curl

RUN curl -fsSL https://raw.githubusercontent.com/ShadowDara/finder/refs/heads/main/install.sh | sh

ENV PATH="/root/.local/bin:${PATH}"

CMD ["sh"]
