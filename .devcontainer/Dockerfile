FROM mcr.microsoft.com/devcontainers/go:dev-1.25-bookworm

RUN rm -f /etc/apt/sources.list.d/yarn.list \
    /etc/apt/sources.list.d/yarnpkg.list

RUN apt-get update \
    && apt-get install -y clangd \
    && rm -rf /var/lib/apt/lists/*
