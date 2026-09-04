@echo off

go build -ldflags="-s -w" ./cmd/finder
go build -ldflags="-s -w" ./cmd/findergen
go build -ldflags="-s -w" ./cmd/tester
go build -ldflags="-s -w" ./glua/cmd/bt
go build -ldflags="-s -w" ./glua/cmd/glua

for %%F in ("finder.exe") do echo Größe: %%~zF Bytes
for %%F in ("findergen.exe") do echo Größe: %%~zF Bytes

echo Finished!

.\findergen
