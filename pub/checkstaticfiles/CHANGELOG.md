# Changelog

## TODO
- [ ] add option for ignore paths
- [ ] add option to add files via the extension `(*.html)`
- [ ] data like pkg name, go file name can be saved in yaml file
- [ ] other modes: strict (programm checks the files while running instead of before running)
- [ ] option to disable output, or inly for errors etc
- [ ] option to copy files to another place before adding them
- [ ] option that the input path, changes from the output path
- [ ] add option to although uses file paths from the internet which will be fetched then
- [ ] create gitignore if non existant for the created files

*(I am adding the TODO List here, so its clear what should be coming soon hopefully)*

# v0.1.1
[checkstaticfiles][csfv0.1.1] - [csf.generate][csfgv0.1.1]
- [x] Bug where then `}` is in the next line the data file which causes an error - *2025-08-11*
- removed the creation of `checkstaticfiles.output.json.gz` because this file is completly
unused
- [x] PROBLEM: Paths ar not working on Linux! - *2025-08-11*

# v0.1.0
[checkstaticfiles][csfv0.1.0] - [csf.generate][csfgv0.1.0]
- changed description in the Readme and the changelog
- [x] BIG PROBLEM: binary searches for the files from the execution path not the located path
- [x] programm checks the content of the files too *(contentmode: true/false)*

### Content Mode
a feature which allows to check the content of the files too, so that
users cant change it and execute the programm with the changed files then

to configure, add to the `checkstaticfiles.config.yaml`, but this will result in longer file
cheking time, keep that in mind

```yaml
contentmode: false
# or true
```

# v0.0.6.1
[checkstaticfiles][csfv0.0.6.1] - [csf.generate][csfgv0.0.6.1]
- some error messages were still not in english
- added a little bit more clarity to the terminal output

# v0.0.6
[checkstaticfiles][csfv0.0.6] - [csf.generate][csfgv0.0.6]
- [x] compress the raw json data (no space and tabs)
- the json writer from **csf.generate** writes the json file
now without tabs and indentation
- Error Messages were translated to english
- created Changelog

# v0.0.5
- **Intential Release**

[csfv0.1.1]: https://github.com/ShadowDara/checkstaticfiles/releases/tag/v0.1.1
[csfgv0.1.1]: https://github.com/ShadowDara/csf.generate/releases/tag/v0.1.1

[csfv0.1.0]: https://github.com/ShadowDara/checkstaticfiles/releases/tag/v0.1.0
[csfgv0.1.0]: https://github.com/ShadowDara/csf.generate/releases/tag/v0.1.0

[csfv0.0.6.1]: https://github.com/ShadowDara/checkstaticfiles/releases/tag/v0.0.6.1
[csfgv0.0.6.1]: https://github.com/ShadowDara/csf.generate/releases/tag/v0.0.6.1

[csfv0.0.6]: https://github.com/ShadowDara/checkstaticfiles/releases/tag/v0.0.6
[csfgv0.0.6]: https://github.com/ShadowDara/csf.generate/releases/tag/v0.0.6
