/**
 * Quality of Life Libraries (QoLLibraries)
 *
 * A set of quality of life blocks for MakeCode for the micro:bit.
 *
 * Blocks that are added by this extension:
 *
 * * **Grids** (own category): create a grid, read/write a cell, reset a grid and print a grid to serial.
 * * **Text**: a random character generator with a selectable set of characters.
 * * **Variables**: delete a variable of any kind (grid, array, text, number, flash file, ...).
 * * **Arrays**: print an array to the serial output.
 * * **Flash Storage** (own category): files in the flash memory of the
 *   micro:bit. Store, read, append, delete and reset, check whether a file
 *   exists, and list every file this program has stored. The data is kept
 *   when the micro:bit is turned off.
 *
 * Every feature lives in its own file instead of everything being dumped in here:
 *
 * | file               | contents                                       |
 * |--------------------|------------------------------------------------|
 * | errors.ts          | terminal / error reporting helpers             |
 * | codec.ts           | packs flash values into plain text (no JSON)   |
 * | gridmodel.ts       | the Grid data structure and its helpers        |
 * | grids.ts           | the "Grids" category blocks                    |
 * | flashstorage.ts    | the "Flash Storage" category blocks (files)    |
 * | randomcharacter.ts | random character block (Text category)         |
 * | variables.ts       | delete variable block (Variables category)     |
 * | serialprint.ts     | print an array to serial (Arrays category)     |
 */
namespace QoLLibraries {
    /** Version of the Quality of Life Libraries extension. */
    export const VERSION = "1.0.0"
}
