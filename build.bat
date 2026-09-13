@echo off

go build -ldflags="-s -w" ./cmd/finder
go build -ldflags="-s -w" ./cmd/findergen
go build -ldflags="-s -w" ./cmd/tester
go build -ldflags="-s -w" ./cmd/csf

for %%F in ("finder.exe") do echo Größe: %%~zF Bytes Finder
for %%F in ("findergen.exe") do echo Größe: %%~zF Bytes Findergen
for %%F in ("tester.exe") do echo Größe: %%~zF Bytes tester
for %%F in ("csf.exe") do echo Größe: %%~zF Bytes CSF

echo Finished!
