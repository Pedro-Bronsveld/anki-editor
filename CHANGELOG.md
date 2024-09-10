# Change Log

## [1.0.6] - 2024-09-10

Fix Anki Connect url and api key from extension settings not being passed to all invoke calls.

## [1.0.5] - 2024-09-09

Fix socket connection error after updating VSCode to version 1.93.0.

## [1.0.4] - 2023-09-29

Updated uri parsing.

* Fixed an issue where templates files could not be opened if their note or card name contained a special character.

## [1.0.3] - 2023-06-21

Updated extension settings for custom filters and field diagnostics.

* Custom filters can now be defined as both strings and objects in the extension settings. When adding a custom filter as an object, the boolean property `fieldRequired` can be set to specify if the replacement must contain a field name when this filter is used.
* Added a setting to toggle diagnostics for missing field names in replacements globally.

## [1.0.2] - 2023-05-06

Small bug fix.

* Fixed an issue where the field name in a field replacement did not receive syntax highlighting when the replacement was followed by a `:` character on the same line.

## [1.0.1] - 2023-04-29

Small Javascript type checking level fix and readme updates.

- Changed the default type checking level of embedded Javascript in card templates to be similar to regular Javascript files opened in VSCode.
  Before, this was set to check Javascript as if it were Typescript. Which is not necessary in card templates.
- Added a setting to change Javascript type checking level back to strict, or turn it off completely.
- Fixed issue where incorrect diagnostics for field names would sometimes display if fields were renamed in Anki while a card template was opened VSCode.
- Updated links to extension in readme.

## [1.0.0] - 2023-04-22

- Initial release of Anki Editor.
