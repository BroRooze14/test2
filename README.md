# Quality of Life Libraries (QoLLibraries)

Quality of life blocks for **MakeCode for the micro:bit**: grids, random values,
printing grids and arrays to the serial terminal, deleting variables and flash
storage that survives a power cycle.

Every feature lives in its own file (no giant `main.ts`):

| file | contents |
|------|----------|
| `main.ts` | package overview only |
| `errors.ts` | terminal / error reporting helpers |
| `gridmodel.ts` | the grid data structure |
| `grids.ts` | the **Grids** category |
| `flashstorage.ts` | the **Flash Storage** category |
| `randomcharacter.ts` | random character block (**Text**) |
| `randomboolean.ts` | random true or false block (**Logic**) |
| `variables.ts` | delete variable block (**Variables**) |
| `serialprint.ts` | print an array to serial (**Arrays**) |

## Blocks

### Grids (own category, own colour and icon)

| block | what it does |
|-------|--------------|
| `create grid` | creates a new, empty grid that grows on its own when cells are written. With **set default value** switched on, cells that were never written hold the chosen value instead of a space |
| `set grid cell X Y of variable to value` | writes one cell. The value can be a number, text, true/false, an array, ... The grid grows when needed |
| `variable get value at X Y` | reads one cell |
| `reset variable` | removes every cell, the grid becomes empty again and grows again when cells are written. Cells that were never written keep the default value (or a space) |
| `serial write variable` | prints the grid in the serial output, one line per row. Cells that were never written are printed as a space, or with the default value when one was set |

Addresses start at `0`. The grid can live in a normal variable **or** in flash
memory, all grid blocks work with both.

Terminal messages of the Grids category:

* `Cell address cant be under 0` - an x or y coordinate was under 0. An address under 0 is never written or read, so cells cannot be created there

### Flash Storage (own category, own colour and icon)

| block | what it does |
|-------|--------------|
| `create flash variable name` | gives a flash variable its name, store the result in a normal variable |
| `set flash variable to value` | writes the value into flash memory |
| `get flash variable` | reads the value back from flash memory |
| `delete flash variable` | removes the value from flash memory |
| `reset flash variable` | sets the stored value back to `0` |
| `clear flash memory` | clears everything this program saved in flash memory |

**What do you type in `create flash variable`?** The name of the flash
variable, for example `score`. The block does not store anything by itself:
it returns the name as text, you keep it in a normal variable and use that
variable in the other flash blocks. On the micro:bit the value is saved
under the key `qoll_score` (letters, digits and `_` are kept, every other
character becomes `_`).

Typical use:

1. in `on start`: `set myKey to create flash variable "score"`
2. `set flash myKey to 5`
3. turn the micro:bit off and on again
4. `get flash myKey` returns `5`

Numbers, text, true/false, arrays and grids can all be stored, so the other
blocks of this extension work together with the flash blocks (for example
`set flash myKey to <create grid>`).

### Other categories

| category | block | what it does |
|----------|-------|--------------|
| Text | `random character from characters` | one random character out of the given set. The default set is every letter (upper and lower case) and every digit |
| Text | `default characters` | the default character set, handy to drag back into the block above |
| Logic | `pick random true or false` | returns `true` or `false` |
| Variables | `delete variable` | deletes the data of a variable of any kind (grid, array, flash variable, ...) |
| Arrays | `serial write array` | prints an array in the serial output, for example `[1, 2, 3]` |

## Error handling

Everything that goes wrong is written to the serial terminal (open it with the
serial console of MakeCode) instead of silently doing the wrong thing:

* coordinates under 0 and coordinates outside the maximum grid size
* a picked variable that does not hold a grid / an array
* flash variables that do not hold text, are empty or hold no value yet
* flash values that are too large to store and flash data that is damaged
* empty character sets
* deleting a number or text value (see below)

## Notes and limitations

* **Flash storage needs a micro:bit V2.** It uses the `settings` library of
  MakeCode, the same library the Data logger extension uses. The library only
  supports the micro:bit V2, so a program that uses this extension cannot be
  loaded on a micro:bit V1.
* **Deleting numbers and text.** A block only receives a *copy* of a number or
  of text, so `delete variable` cannot throw that value away by itself. It
  empties arrays, resets grids and removes flash variables; for numbers and
  text it prints how to clear the variable (`set variable to 0`).
* **Where to find `delete variable`.** MakeCode builds the Variables drawer
  dynamically from the variables in your program, so third party blocks are not
  added to that drawer. The block is part of the extension and can be found
  with the toolbox search (and it is used from JavaScript/Python projects too).
* Only the data that this extension writes to flash is prefixed with `qoll_`,
  so `clear flash memory` leaves data of other extensions alone.

## Install

In the MakeCode editor: **Settings > Extensions** and paste the URL of this
repository, or pick it from the gallery after it has been approved.

**Updating an installed extension.** MakeCode caches extension code in the
browser. After the files change, remove the extension (Extensions > your
extension > trash icon), reload the editor (Ctrl+Shift+R) and add it again,
otherwise the editor keeps using the old copy.

## Supported targets

* for PXT/microbit

## License

MIT

| | |
| ----------- | ------------------------------- |
| PXT/microbit | https://github.com/your-name/QualityOfLifeLibraries |
