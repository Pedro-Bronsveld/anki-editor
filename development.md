# Development

Some notes and links used for reference during development of this extension, may be out of date.

##  Uri Schema
`anki-editor:Note Types/<ModelName>/<Card #|Styling>/<Back|Front>`

## Anki Card Templates
Anki documentation:
- [Card Templates](https://docs.ankiweb.net/templates/intro.html)
  - [Field Replacements](https://docs.ankiweb.net/templates/fields.html)
  - [Card Generation](https://docs.ankiweb.net/templates/generation.html)
  - [Styling & HTML](https://docs.ankiweb.net/templates/styling.html)
  - [Checks and Errors](https://docs.ankiweb.net/templates/errors.html)
- [Filter Demo](https://github.com/ankitects/anki-addons/blob/main/demos/field_filter/__init__.py)

## Field name format

- First character can't be any of the conditional characters: `#` `^` `/` .
  - Characters after the first character **can** be conditional characters.
- Field name can't start or end with a space, but can contain spaces.
- Field name can't contain template characters: `:` `"` `{` `}` .
  - This is also true for the first character.
- The Anki field editor window doesn't allow for newline characters to be used in field names, so it's safe to assume field names can't contain `\n` .
- Special field names are a subset of normal field names.

### Regex

Match field name

```javascript
/[^#^/\s:{}\"]([^:{}\s\"]|\s(?!\s*(}}|$)))*(?![^:]*:)/g
```

Match first character

```javascript
/[^#^/\s:{}\"]/

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
The template can serve as an opening or closing tag for an if/else block.

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

### Cloze note types
- Only has one card type with a front and back template, cards are generated based on the number of cloze references in a note's field.
- The name of this one card type is always `"Cloze"`.
- Both front and back of a cloze card type must contain at least one replacement with a `cloze` filter.

- Adds special fields `c1`, `c2`, `c3`, `c...` that can only used in conditional opening and closing tags to check which of a note's cloze references is being used.
- Numbers of cloze must start at `c1` and must be defined in consecutive order in the field. So `c2` can only be defined when the field already contains a `c1`.
  - This does not affect which `c...` special fields can be used in the card template conditional tags.
- Leading zeros are omitted, so `c0001` used in a note field matches `c1` used in a conditional tag.
  - Opening and closing tag must still be exactly the same string.
- `c0` is not valid
- `c-1` and other negative numbers are not valid.