/**
 * Error handling helpers that are shared by every QoLLibraries block.
 *
 * Every message is written to the serial terminal (the MakeCode serial
 * console, a serial monitor or any terminal that is connected to the
 * micro:bit over USB), so problems can be seen while the program runs.
 */
namespace qoll {
    /**
     * Writes a message to the serial terminal, followed by a new line.
     * @param message the text to show
     */
    export function report(message: string): void {
        serial.writeLine(message)
    }
}
