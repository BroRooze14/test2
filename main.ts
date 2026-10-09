/**
 * Quality of Life Libraries (QoLLibraries)
 *
 * A set of quality of life blocks for MakeCode for the micro:bit.
 *
 * Blocks that are added by this extension:
 *
 * * **Grids** (own category): create a grid, read/write a cell, reset a grid and print a grid to serial.
 * * **Text**: a random character generator with a selectable set of characters.
 * * **Logic**: a random true or false generator.
 * * **Variables**: delete a variable of any kind (grid, array, text, number, flash variable, ...).
 * * **Arrays**: print an array to the serial output.
 * * **Flash Storage** (own category): store, read, delete and reset values in flash memory
 *   so they are kept when the micro:bit is turned off, and list every flash
 *   variable this program has stored a value for.
 *
 * Every feature lives in its own file instead of everything being dumped in here:
 *
 * | file               | contents                                       |
 * |--------------------|------------------------------------------------|
 * | errors.ts          | terminal / error reporting helpers             |
 * | codec.ts           | packs flash values into plain text (no JSON)   |
 * | gridmodel.ts       | the Grid data structure and its helpers        |
 * | grids.ts           | the "Grids" category blocks                    |
 * | flashstorage.ts    | the "Flash Storage" category blocks            |
 * | randomcharacter.ts | random character block (Text category)         |
 * | randomboolean.ts   | random true or false block (Logic category)    |
 * | variables.ts       | delete variable block (Variables category)     |
 * | serialprint.ts     | print an array to serial (Arrays category)     |
 */
namespace QoLLibraries {
    /** Version of the Quality of Life Libraries extension. */
    export const VERSION = "1.0.0"
}
