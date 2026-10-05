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
| `create grid` | creates a new grid. Optionally a **maximum size** (the grid will not grow past it), a **default size** (how large it starts) and a **default value** (value of cells that were never written) |
| `set grid cell X Y of variable to value` | writes one cell. The value can be a number, text, true/false, an array, ... The grid grows when needed |
| `variable get value at X Y` | reads one cell |
| `reset variable` | clears the grid and returns it to its default size |
| `serial write variable` | prints the grid in the serial output, one line per row. Cells without a value are printed as a space |

Addresses start at `0`. The grid can live in a normal variable **or** in flash
memory, all grid blocks work with both.

Terminal messages of the Grids category:

* `Cell address cant be under 0` - an x or y coordinate was under 0
* `Out of set max grid range.` - the address is outside the maximum size that was set

### Flash Storage (own category, own colour and icon)

| block | what it does |
|-------|--------------|
| `create flash variable name` | gives a flash variable its name, store the result in a normal variable |
| `set flash variable to value` | writes the value into flash memory |
| `get flash variable` | reads the value back from flash memory |
| `delete flash variable` | removes the value from flash memory |
| `reset flash variable` | sets the stored value back to `0` |
| `clear flash memory` | clears everything this program saved in flash memory |

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

## Supported targets

* for PXT/microbit

## License

MIT

| | |
| ----------- | ------------------------------- |
| PXT/microbit | https://github.com/your-name/QualityOfLifeLibraries |
