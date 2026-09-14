cl /O2 /Ob3 /Oi /Ot /GL /Gy /MD /GF /DNDEBUG /arch:AVX2 shortcut.c /link /LTCG /OPT:REF /OPT:ICF
dumpbin /headers main.exe
