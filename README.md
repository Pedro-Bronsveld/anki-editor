# Anki Editor

An extension for Visual Studio Code to edit [Anki](https://apps.ankiweb.net/) card templates through [Anki Connect](https://ankiweb.net/shared/info/2055492159)
with syntax highlighting, autocomplete and other intellisense language features.

![Anki Editor extension and Anki Preview Reloader add-on demo](resources/videos/anki-editor-example.gif)

## Requirements

- [Anki](https://apps.ankiweb.net/) desktop application

- [Anki Connect](https://ankiweb.net/shared/info/2055492159) add-on for Anki

- [Anki Preview Reloader](https://github.com/Pedro-Bronsveld/anki-preview-reloader) add-on for Anki - Automatically reloads preview windows in Anki when card templates are updated through Anki Connect.

- (optional) [AnkiWebView Inspector](https://ankiweb.net/shared/info/31746032) - Recommended because it completes the *"frontend development setup"* when editing card templates.

## Setup

1. Add [Anki Connect](https://ankiweb.net/shared/info/2055492159) to Anki.
2. Install the extension from the Visual Studio Code marketplace.
3. Make sure Anki is running.
4. Click the double star icon in the activity bar on the left of VSCode to open the note type tree view.
5. Find the front or back of the card template you want to edit in the note type and card template tree hierarchy.

The steps above assume you're running VSCode and Anki on the same computer, and that Anki-Connect uses its default port.
If you're running over a network or have modified the Anki-Connect configuration, you may need to change some of the [extension settings](#extension-settings) to setup the connection between VSCode and Anki Connect.

### Backup

While this extension has been tested, its functionality may break in unexpected ways after an update of Anki, VSCode, or other dependencies.
Because Anki Editor modifies card templates saved in your Anki collection, you should create a [backup](https://docs.ankiweb.net/backups.html) of your collection before using this or any other add-on that modifies your collection.

## Live Template Preview

When you're editing a card template in Anki's [template screen](https://docs.ankiweb.net/templates/intro.html#the-templates-screen), its preview is updated as you type.
However, this preview will not update when the card template is updated through Anki-Connect.

To solve this, the Anki add-on [Anki Preview Reloader](https://github.com/Pedro-Bronsveld/anki-preview-reloader) was developed alongside Anki Editor.
When changes to a template are saved through Anki-Connect, this add-on will reload the preview in the card template screen, or the card preview window opened from the card editor.

## Standalone

Anki Editor can be used without Anki-Connect by creating a file with the extension `.template.anki`, or by setting the language mode for any file to "Anki Template".
You can then create your card template in this file, and manually copy it to Anki.
When using the extension this way, you will still get most intellisense features, except for those that depend on data from note types.
For example, validation of field names is unavailable, because this data has to be retrieved through Anki-Connect.

## Features

- Load card templates and stylesheets using a tree view of note types and card templates.
Save changes as if they're any other file.

![Card Template Tree View](resources/videos/tree-view-example.gif)

- Completions for fields, special fields and filters inside field replacements.
Can be triggered using `Ctrl` + `Space` by default, when the cursor is inside a replacement.

![Completion Items](resources/images/completion-field-2.png)

- Error detection of possible syntax and model related errors inside field replacements.

![Field Diagnostics](resources/images/diagnostic-field.png)

![Filter Diagnostics](resources/images/diagnostic-filter.png)

- Quick fixes for some simple syntax errors.

![Code Action](resources/videos/diagnostic-code-action-example.gif)

- Documentation for special fields and filters when hovering over them.

![Hover Info Filter](resources/images/hover-filter.png)

![Hover Info Special Field](resources/images/hover-field.png)

- Renaming of linked conditional opening and closing tags.

![Rename Conditional](resources/videos/rename-example.gif)

- Detection of nested conditional problems.

![Nested Conditional Diagnostic](resources/images/diagnostic-nested-conditional.png)

- Completions of some built-in CSS classes in Anki when writing selectors in a card's stylesheet.

![Anki CSS Classes Suggestions](resources/images/completion-css-classes.png)

- Forwarding of HTML, CSS and Javascript intellisense to VSCode's language services.

- Syntax highlighting.

- Snippets for some field replacements and conditional blocks when the cursor is outside a field replacement.
Can be triggered using `Ctrl` + `Space` by default.

## Extension Settings

* `anki-editor.origin`: The url and port that Anki-Connect can be reached at. 
By default this is set to `"http://127.0.0.1:8765"`, which should allow VSCode to connect to Anki automatically when both applications are running on the same computer.

* `anki-editor.apiKey`: Optional api key that can be set in the Anki-Connect configuration.
Leave this empty if `"apiKey"` in the Anki-Connect configuration is set to `null`.

* `anki-editor.invalidFieldDiagnostics`: Enable or disable error detection of field names in template replacements.

* `anki-editor.invalidFilterDiagnostics`: Enable or disable error detection of filter names in template replacements.

* `anki-editor.customFieldNames`: Add extra field names that will be allowed in template replacements, and will be used for completion suggestions.
This can be used when an Anki add-on is installed that adds extra special fields.

* `anki-editor.customFilterNames`: Add extra filter names that will be allowed in template replacements, and will be used for completion suggestions.
This can be used when an Anki add-on is installed that adds extra filters.

## Credits

Anki Editor was, in part, made possible by the following projects:

- [Anki](https://github.com/ankitects/anki) - A free and open-source program to create flashcards. Available on [apps.ankiweb.net](https://apps.ankiweb.net).
- [Anki-Connect](https://github.com/FooSoft/anki-connect) - Enabling communication with Anki over HTTP.
- [Autoanki](https://github.com/chenlijun99/autoanki)'s Anki-Connect package - A type wrapper for the Anki-Connect API.
- [ts-morph](https://github.com/dsherret/ts-morph)'s bootstrap package - Allowed for easy forwarding of Javascript language features to the Typescript language service.
- [AnkiWebView Inspector](https://github.com/hikaru-y/anki21-addon-ankiwebview-inspector) - Allowed for inspection of HTML rendered by Anki to find out which CSS classes should be suggested.
- The star in Anki Editor's icon and the icon in VSCode's activity bar is based on (but not a direct copy of) the star in Anki's logo, which was created by Alex Fraser.

## Disclaimer

Anki Editor was created to work together with Anki and the attributed projects listed above.
It is not developed by the Anki developers.
