# checkstaticfiles

<!--
git tag v0.1.1 && git push origin v0.1.1
-->

This is a go module to include static files to binary (e.g. html, or
other) by encoding them and adding the encoded value to the binary.

The binary will then check on startup if these files are existing, if
not the executable will create them.

See [Changelog](/CHANGELOG.md) to see the other versions

## Start

First create a `checkstaticfiles.config.yaml` file in the root of your
project

You can add Folders and Files to `paths`

```yaml
# Example Content
contentmode: false
#enable_standard_log: false
paths:
  - .gitignore
  - q.exe
```

See [Additional Settings](#aditional-settings)

then you need to installer the generator module

```sh
go install github.com/shadowdara/csf.generate@latest
```
- [Source here](https://github.com/shadowdara/csf.generate) *(i moved it to another repository)*

and run it with
```sh
csf.generate --package=main --output=checkstaticfiles.data.go --variable=CheckstaticfilesOutputJSONGz
```
(*csf* should a shortcut for checkstaticfiles)

- package is the name of you go package
- output the name of the output file
- variable, the variable the data will be saved

add this to your git ignore to ignore the useless files
```sh
# checkstaticfiles
# https://github.com/ShadowDara/checkstaticfiles
checkstaticfiles.output.json
checkstaticfiles.output.json.gz
```

and add to your `.gitattributes`
```
checkstaticfiles.data.go linguist-generated
```

## Use the data

then import in your code
```sh
"github.com/shadowdara/checkstaticfiles"
```

and run
```sh
go get github.com/shadowdara/checkstaticfiles@latest
```

and then run on your programm start to create the files
```go
shadowdara_checkstaticfiles.Checkfiles(CheckstaticfilesOutputJSONGz, Chechstaticfiles_settings)
```

## Aditional Settings

### Content Mode
a feature which allows to check the content of the files too, so that
users cant change it and execute the programm with the changed files then

to configure, add to the `checkstaticfiles.config.yaml`, but this will result in longer file
cheking time, keep that in mind

```yaml
contentmode: false
# or true
```

## Disclaimer

this module is develepment and NOT stable yet, but it *should* work
