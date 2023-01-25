# Development

##  Uri Schema
`ankieditor:<ModelName>/<Card #|Styling>/<Back|Front>`

## Anki Card Templates
Anki documentation:
- [Card Templates](https://docs.ankiweb.net/templates/intro.html)
  - [Field Replacements](https://docs.ankiweb.net/templates/fields.html)
  - [Card Generation](https://docs.ankiweb.net/templates/generation.html)
  - [Styling & HTML](https://docs.ankiweb.net/templates/generation.html)
  - [Checks and Errors](https://docs.ankiweb.net/templates/errors.html)

## Field name format

- First character can't be any of the conditional characters: `#` `^` `/` .
  - Characters after the first character **can** be conditional characters.
- Field name can't start or end with a space, but can contain spaces.
- Field name can't contain template characters: `:` `"` `{` `}` .
  - This is also true for the first character.
- Special field names are a subset of normal field names.

### Regex

Match field name

```javascript
/[^#^\/\s:\"{}]+([^:\"{}\s]|\s(?!\s*}}))*/g
```

Match first character

```javascript
/[^#^\/\s:\"{}]+/

```

Match following characters, exclude spaces at the end

```javascript
/([^:\"{}\s]|\s(?!\s*}}))*/
```

## Template Format

- A template in Anki is opened by `{{` and closed by `}}`.
- A template can't contain `"`, `{` or `}`. 

When looking at syntax highlighting, there are two main types of templates to be parsed:

### Conditional opening and closing
The template serves as an opening or closing tag for an if/else block.

- A template is a conditional block when the first character following the opening `{{` is a `#`, `^` or `/`.
- There can be any number of spaces between the opening `{{` and `#`, `^` or `/`
- A conditional opening or closing block can't contain a `:` character anywhere.

#### Examples
```
{{#FrontField}}
{{/FrontField}}
```

Any number of spaces is allowed at the start of a conditional opening or closing template.

```
{{  #   FrontField}}
{{ /  FrontField}}
```