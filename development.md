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

```javascript
// match field name
/[^#^\/\s:\"{}]+([^:\"{}\s]|\s(?!\s*}}))*/g

// match field name, assuming it can't contain invalid characters: " { }
/[^#^\/\s:]+([^:\s]|\s(?!\s*}}))*/g

// match first character
/[^#^\/\s:\"{}]+/

// matches following characters, 
// exclude spaces at the end
/([^:\"{}\s]|\s(?!\s*}}))*/
```

## Template Pattern Matching

### Invalid Template Characters

The first pattern, `#anki-template-invalid`, tries to match any templates (anything between double curly braces) containing the invalid characters `"` `{` `}` . 
No template is allowed to contain these characters.
The pattern will color the double braces and the invalid characters of this template red.
By catching these invalid characters in the first pattern, there's a guarantee they can't appear in later patterns.

```json
{
    "include": "#anki-template-invalid"
},
```

The `"` character in this example will be marked as invalid:
```
{{Field"Name}}
```

### Conditional Blocks

The `#anki-conditional-block` pattern matches a conditional block.
This is a block that starts with a template like `{{#FieldName}}` or `{{^FieldName}}`, and is closed by `{{/FieldName}}`. Matching valid conditional blocks is done in two steps:

Because field names can't contain the `:` character, and because the `#`, `^` and `/` characters are followed by a field name, the start and end blocks can't contain a `:` character.
Therefore, a first pattern is used to mark the invalid `:` character in a conditional opening or closing template.

After filtering the invalid character, the regex pattern matches a template that starts with double curly braces, followed by any number of spaces and a `#`, `^` or `/` character, and then containing a field name.
One pattern is used to match the opening template and the closing template.
`beginCapture` and `endCapture` are not used for this block because content inside the block would not receive correct syntax highlighting of the surrounding scope.

Example of a conditional block:

```
{{#FieldName}}
    Conditional Content Here
{{/FieldName}}
```

Spaces are allowed in conditionals:

```
{{   #    FieldName}}
    Conditional Content Here
{{ /  FieldName}}
```
