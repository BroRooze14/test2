/**
 * Flash Storage: blocks that store values in the flash memory of the
 * micro:bit, so the data is still there after the micro:bit is turned off.
 *
 * Workflow:
 *
 * 1. Give the flash variable a name once, in "on start":
 *    `set myKey to create flash variable "score"`.
 * 2. Store a value: `set flash myKey to 5`.
 * 3. Read it back (also after a power cycle): `get flash myKey`.
 *
 * Numbers, text, true/false, arrays and grids can all be stored. Every
 * value is packed into plain text by qollcodec before it is written, so
 * the stored data never needs JSON (see codec.ts why JSON is unsafe here).
 *
 * The data is saved under a key of `qoll_` plus the name. The flash
 * memory is a part of the micro:bit file system, so a name is a file
 * name: it becomes at most 28 sign long, and characters that a file name
 * does not allow become _.
 */
//% color="#AD1457" icon="\uf0c7" block="Flash Storage"
namespace flashstorage {
    /** Every key of this extension starts with this prefix. */
    const KEY_PREFIX = "qoll_"
    /** Flash keys are file names, keep them short. */
    const MAX_KEY_LENGTH = 28
    /** Guard so a value can never fill up the whole flash file system. */
    const MAX_VALUE_LENGTH = 6000

    /**
     * Creates the name of a flash variable.
     *
     * Store the result in a variable (the "set variable to" block) and use
     * that variable in every other Flash Storage block.
     * @param name the name of the flash variable
     */
    //% blockId=qoll_flash_create block="create flash variable $name"
    export function createFlashVariable(name: string): string {
        if (name === undefined || name === null || name.length == 0) {
            qoll.report("Flash variable name cannot be empty.")
            // A space, and not empty text: an empty text cannot be handed to
            // the runtime. keyFor() refuses a name without usable characters,
            // so this never reaches flash memory.
            return " "
        }
        return name
    }

    /**
     * Names that blocks can receive are kept in variables, but a text
     * typed straight into the slot has to work too. keyFor() checks the
     * value and reports on the terminal what is wrong with it.
     */

    /**
     * Stores a value in flash memory. The value is kept when the micro:bit
     * is turned off.
     * @param variable a variable that holds the name of the flash variable
     * @param value the value to store (number, text, true/false, array or grid)
     */
    //% blockId=qoll_flash_set block="set flash $variable to $value"
    //% variable.shadow="variables_get"
    //% variable.defl="myKey"
    export function setFlash(variable: any, value: any): void {
        const key = keyFor(variable)
        if (!key) return
        writeValue(key, value)
    }

    /**
     * Reads a value back from flash memory. Returns nothing when the flash
     * variable was never written to.
     * @param variable a variable that holds the name of the flash variable
     */
    //% blockId=qoll_flash_get block="get flash $variable"
    //% variable.shadow="variables_get"
    //% variable.defl="myKey"
    export function getFlash(variable: any): any {
        const key = keyFor(variable)
        if (!key) return undefined
        if (!settings.exists(key)) {
            qoll.report("Flash variable has no stored value.")
            return undefined
        }
        return readValue(key)
    }

    /**
     * Deletes a flash variable: its data is removed from the flash memory.
     * @param variable a variable that holds the name of the flash variable
     */
    //% blockId=qoll_flash_delete block="delete flash $variable"
    //% variable.shadow="variables_get"
    //% variable.defl="myKey"
    export function deleteFlash(variable: any): void {
        const key = keyFor(variable)
        if (!key) return
        if (!settings.exists(key)) {
            qoll.report("Flash variable does not exist.")
            return
        }
        settings.remove(key)
        qoll.report("Flash variable deleted.")
    }

    /**
     * Resets a flash variable: the stored value is set back to 0, the flash
     * variable itself stays.
     * @param variable a variable that holds the name of the flash variable
     */
    //% blockId=qoll_flash_reset block="reset flash $variable"
    //% variable.shadow="variables_get"
    //% variable.defl="myKey"
    export function resetFlash(variable: any): void {
        const key = keyFor(variable)
        if (!key) return
        if (!settings.exists(key)) {
            qoll.report("Flash variable does not exist.")
            return
        }
        writeValue(key, 0)
        qoll.report("Flash variable reset.")
    }

    /**
     * Creates a new array with the name of every flash variable that this
     * program has stored a value for. Each name loses its leading qoll_.
     * The names can be shown with the "print array" block, used with text
     * blocks, or stored again with "set flash".
     *
     * A tip: this block does not return a value by itself, so use it with
     * "set myArray to", then do something with myArray.
     */
    //% blockId=qoll_flash_list block="list flash variables"
    export function listFlashVariables(): string[] {
        const keys = settings.list(KEY_PREFIX)
        const names: string[] = []
        if (keys) {
            for (let i = 0; i < keys.length; i++) {
                names.push(nameOf(keys[i]))
            }
        }
        return names
    }

    /**
     * Turns a key back into the name of the flash variable: the text of
     * the key after qoll_. Used when the names of the flash variables are
     * listed.
     */
    function nameOf(key: string): string {
        // The prefix is always in front: keys of this program are found
        // with it, so step over it with charAt().
        const start = KEY_PREFIX.length
        let name = ""
        for (let i = start; i < key.length; i++) {
            name += key.charAt(i)
        }
        return name
    }

    /**
     * Completely clears the part of the flash memory that this program saved.
     * Data of other extensions (for example the data logger) is kept.
     */
    //% blockId=qoll_flash_clear block="clear flash memory"
    export function clearFlashMemory(): void {
        const keys = settings.list(KEY_PREFIX)
        let removed = 0
        if (keys) {
            for (let i = 0; i < keys.length; i++) {
                settings.remove(keys[i])
                removed++
            }
        }
        qoll.report("Flash memory cleared. " + removed + " value(s) removed.")
    }

    /**
     * Turns the value of a variable into the key that is used in flash
     * memory. The variable has to hold the text name of the flash variable
     * (see "create flash variable").
     * @param value the text of the variable or slot that was picked
     */
    export function keyFor(value: any): string {
        if (typeof value !== "string") {
            qoll.report("A flash variable must hold text. Use 'create flash variable' to make one.")
            return ""
        }
        const raw: string = value
        if (raw.length == 0) {
            qoll.report("Flash variable name cannot be empty.")
            return ""
        }

        let key = KEY_PREFIX
        let usable = 0
        for (let i = 0; i < raw.length && i < MAX_KEY_LENGTH; i++) {
            const code = raw.charCodeAt(i)
            const allowed = (code >= 97 && code <= 122)
                || (code >= 65 && code <= 90)
                || (code >= 48 && code <= 57)
                || code == 95
            if (allowed) usable++
            key += allowed ? raw.charAt(i) : "_"
        }
        if (usable == 0) {
            qoll.report("Flash variable name needs a letter, a digit or _.")
            return ""
        }
        return key
    }

    /** True when flash memory holds a value for this key. */
    export function hasValue(key: string): boolean {
        if (!key) return false
        return settings.exists(key)
    }

    /**
     * Removes a value from flash memory. Used by the "delete" block of the
     * Variables category when the picked variable holds a flash variable.
     */
    export function deleteStored(key: string): void {
        if (!key) return
        if (!settings.exists(key)) return
        settings.remove(key)
    }

    /**
     * Writes a value to flash memory. Values that are too big are refused
     * with a message on the terminal instead of crashing the program.
     */
    export function writeValue(key: string, value: any): void {
        if (!key) return
        let text: string
        try {
            text = qollcodec.encode(value)
        } catch (e) {
            qoll.report("Value could not be saved to flash memory.")
            return
        }
        if (!text) {
            qoll.report("Value could not be saved to flash memory.")
            return
        }
        if (text.length > MAX_VALUE_LENGTH) {
            qoll.report("Value is too large to store in flash memory.")
            return
        }
        settings.writeString(key, text)
    }

    /**
     * Reads a value back from flash memory. Damaged data is reported on
     * the terminal and nothing is returned.
     */
    export function readValue(key: string): any {
        if (!key) return undefined
        if (!settings.exists(key)) return undefined
        const stored = settings.readString(key)
        if (stored === undefined || stored === null) {
            qoll.report("Value could not be read from flash memory.")
            return undefined
        }
        try {
            // decode() reports data it cannot read all by itself, and
            // returns undefined then. It also returns undefined for a
            // saved "empty" value, without a report, which is correct.
            return qollcodec.decode(stored)
        } catch (e) {
            qoll.report("Value could not be read from flash memory.")
            return undefined
        }
    }
}
