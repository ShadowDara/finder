# KeyValueParser

to use it, just add `kvp.hpp` and `kvp.cpp` to your project!

More infos are in the Header File

<!--

Single Header File genarate Command
```sh
cppgsh -q --source_directory ./src --include_directory ./include --license_files LICENSE --exclude KeyValueParser.cpp single_header.hpp
quom --source_directory ./src --include_directory ./include single_header.hpp
```

-->

## BenchMark

Benchmark run on a Lenovo ThinkPad X13 Yoga Gen 2

Debug Mode
```
Parsed 1 entries in 1.99e-05 seconds.
Parsed 10 entries in 0.0001411 seconds.
Parsed 100 entries in 0.0014267 seconds.
Parsed 1000 entries in 0.010353 seconds.
Parsed 10000 entries in 0.136192 seconds.
Parsed 100000 entries in 1.53699 seconds.
Parsed 1000000 entries in 12.3062 seconds.
Parsed 10000000 entries in 142.276 seconds.
```

Release Mode

```
Parsed 1 entries in 6.8e-06 seconds. Input Size: 14
Parsed 10 entries in 9.3e-06 seconds. Input Size: 140
Parsed 100 entries in 0.0001051 seconds. Input Size: 1580
Parsed 1000 entries in 0.0007949 seconds. Input Size: 17780
Parsed 10000 entries in 0.0080195 seconds. Input Size: 197780
Parsed 100000 entries in 0.0679692 seconds. Input Size: 2177780
Parsed 1000000 entries in 1.20497 seconds. Input Size: 23777780
Parsed 10000000 entries in 8.23873 seconds. Input Size: 257777780
```
