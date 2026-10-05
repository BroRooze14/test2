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
 * Numbers, text, true/false, arrays and grids can all be stored.
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
            return ""
        }
        return name
    }

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
     * @param value the value of the variable that was picked
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
        for (let i = 0; i < raw.length && i < MAX_KEY_LENGTH; i++) {
            const code = raw.charCodeAt(i)
            const allowed = (code >= 97 && code <= 122)
                || (code >= 65 && code <= 90)
                || (code >= 48 && code <= 57)
                || code == 95
            key += allowed ? raw.charAt(i) : "_"
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
        try {
            const payload = encode(value)
            const text = JSON.stringify(payload)
            if (text === undefined || text === null) {
                qoll.report("Value could not be saved to flash memory.")
                return
            }
            if (text.length > MAX_VALUE_LENGTH) {
                qoll.report("Value is too large to store in flash memory.")
                return
            }
            settings.writeJSON(key, payload)
        } catch (e) {
            qoll.report("Value could not be saved to flash memory.")
        }
    }

    /**
     * Reads a value back from flash memory. Damaged data is reported on the
     * terminal and nothing is returned.
     */
    export function readValue(key: string): any {
        if (!key) return undefined
        if (!settings.exists(key)) return undefined
        try {
            return decode(settings.readJSON(key))
        } catch (e) {
            qoll.report("Value could not be read from flash memory.")
            return undefined
        }
    }

    /** Tags a value with its kind so it can be restored later. */
    function encode(value: any): any {
        if (value === undefined || value === null) return { kind: "empty" }
        if (typeof value === "boolean") return { kind: "boolean", body: value }
        if (typeof value === "number") return { kind: "number", body: value }
        if (typeof value === "string") return { kind: "text", body: value }
        if (value instanceof qoll.Grid) return { kind: "grid", body: qoll.gridToPlain(value) }
        if (Array.isArray(value)) return { kind: "array", body: value }
        qoll.report("This value cannot be stored in flash memory.")
        return { kind: "empty" }
    }

    /** Restores a value that was written by encode(). */
    function decode(raw: any): any {
        if (raw === undefined || raw === null || typeof raw !== "object") {
            qoll.report("Stored flash value is damaged.")
            return undefined
        }

        const kind: string = raw.kind
        const body: any = raw.body

        if (kind == "number" || kind == "text" || kind == "boolean") return body
        if (kind == "empty") return undefined
        if (kind == "array") {
            if (Array.isArray(body)) return body
            qoll.report("Stored flash value is damaged.")
            return undefined
        }
        if (kind == "grid") return qoll.gridFromPlain(body)

        qoll.report("Stored flash value is damaged.")
        return undefined
    }
}
