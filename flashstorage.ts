/**
 * Flash Storage: files in the flash memory of the micro:bit, so the data
 * is still there after the micro:bit is turned off.
 *
 * Every block takes the name of the file typed straight into the block
 * (or out of a variable that holds a name — both work). Example:
 *
 * 1. `set flash file "score" to 5`
 * 2. turn the micro:bit off and on again
 * 3. `get flash file "score"` returns 5
 * 4. `list flash files` returns every name that this program stored
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
     * Writes a value into a flash file. A file that exists already is
     * overwritten. The value is kept when the micro:bit is turned off.
     * @param name the name of the file (typed into the block)
     * @param value the value to store (number, text, true/false, array, grid)
     */
    //% blockId=qoll_flash_set block="set flash file $name to $value"
    //% name.defl="myfile"
    export function setFlash(name: any, value: any): void {
        const key = keyFor(name)
        if (!key) return
        writeValue(key, value)
    }

    /**
     * Reads a value back out of a flash file (also after a power cycle).
     * Returns nothing when the file was never written to.
     * @param name the name of the file (typed into the block)
     */
    //% blockId=qoll_flash_get block="get flash file $name"
    //% name.defl="myfile"
    export function getFlash(name: any): any {
        const key = keyFor(name)
        if (!key) return undefined
        if (!settings.exists(key)) {
            qoll.report("Flash file has no stored value.")
            return undefined
        }
        return readValue(key)
    }

    /**
     * Deletes a flash file: its data is removed from the flash memory.
     * @param name the name of the file (typed into the block)
     */
    //% blockId=qoll_flash_delete block="delete flash file $name"
    //% name.defl="myfile"
    export function deleteFlash(name: any): void {
        const key = keyFor(name)
        if (!key) return
        if (!settings.exists(key)) {
            qoll.report("Flash file does not exist.")
            return
        }
        settings.remove(key)
        qoll.report("Flash file deleted.")
    }

    /**
     * Resets a flash file: the stored value is set back to 0, the file
     * itself stays.
     * @param name the name of the file (typed into the block)
     */
    //% blockId=qoll_flash_reset block="reset flash file $name"
    //% name.defl="myfile"
    export function resetFlash(name: any): void {
        const key = keyFor(name)
        if (!key) return
        if (!settings.exists(key)) {
            qoll.report("Flash file does not exist.")
            return
        }
        writeValue(key, 0)
        qoll.report("Flash file reset.")
    }

    /**
     * True when the flash file exists (this program has stored a value
     * for it).
     * @param name the name of the file (typed into the block)
     */
    //% blockId=qoll_flash_has block="flash file $name exists"
    //% name.defl="myfile"
    export function hasFlash(name: any): boolean {
        const key = keyFor(name)
        if (!key) return false
        return settings.exists(key)
    }

    /**
     * Reads a flash file as one line of text, the way it is stored.
     * Used to copy a file somewhere else with `set flash file` and to
     * look at damaged data without crashing the program.
     * @param name the name of the file (typed into the block)
     */
    //% blockId=qoll_flash_readtext block="read flash file $name as text"
    //% name.defl="myfile"
    export function readFlashText(name: any): string {
        const key = keyFor(name)
        if (!key) return ""
        if (!settings.exists(key)) {
            qoll.report("Flash file has no stored value.")
            return ""
        }
        const stored = settings.readString(key)
        return stored === undefined || stored === null ? "" : stored
    }

    /**
     * Writes raw text into a flash file, packed the same way every other
     * value is packed, so `get flash file` reads the text back as text.
     * Same as `set flash file` with a text value.
     * @param name the name of the file (typed into the block)
     * @param text the text to store
     */
    //% blockId=qoll_flash_writetext block="write text $text into flash file $name"
    //% name.defl="myfile"
    export function writeFlashText(name: any, text: string): void {
        setFlash(name, text === undefined || text === null ? "" : text)
    }

    /**
     * Adds one text line at the end of a flash file that holds lines of
     * text. A new line is started for every entry, the file can be read
     * back line by line with `get flash file` (it becomes an array of
     * the lines). Use `set flash file` with an empty array to start a
     * fresh list of lines.
     * @param name the name of the file (typed into the block)
     * @param line the line of text to add at the end
     */
    //% blockId=qoll_flash_append block="append line $line to flash file $name"
    //% name.defl="lines"
    export function appendFlashLine(name: any, line: string): void {
        const key = keyFor(name)
        if (!key) return
        const current: any[] = []
        if (settings.exists(key)) {
            const stored = readValue(key)
            const box: any[] = [undefined]
            if (qoll.tryAsArray(stored, box)) {
                const items = box[0]
                for (let i = 0; i < items.length; i++) current.push(items[i])
            } else if (typeof stored === "string") {
                // A file that so far held one text becomes a list of lines.
                current.push(stored)
            }
        }
        current.push(line === undefined || line === null ? "" : line)
        writeValue(key, current)
    }

    /**
     * Creates a new array with the name of every flash file that this
     * program has stored a value for. Each name loses its leading qoll_.
     * The names can be shown with the "print array" block, or used as
     * the name in another flash block.
     */
    //% blockId=qoll_flash_list block="list flash files"
    export function listFlashFiles(): string[] {
        return listNames()
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
        qoll.report("Flash memory cleared. " + removed + " file(s) removed.")
    }

    /**
     * Turns the value of a variable or slot into the key that is used in
     * flash memory. The value has to be the text name of the file.
     * @param value the text of the variable or slot that holds the name
     */
    export function keyFor(value: any): string {
        if (value === undefined || value === null) {
            qoll.report("A flash file name must be text.")
            return ""
        }
        if (typeof value !== "string") {
            qoll.report("A flash file name must be text.")
            return ""
        }
        const raw: string = value
        if (raw.length == 0) {
            qoll.report("Flash file name cannot be empty.")
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
            qoll.report("Flash file name needs a letter, a digit or _.")
            return ""
        }
        return key
    }

    /**
     * Builds the name list that listFlashFiles() hands out. Separated so
     * the Variables category can offer the same list.
     */
    export function listNames(): string[] {
        const keys = settings.list(KEY_PREFIX)
        const names: string[] = []
        if (keys) {
            for (let i = 0; i < keys.length; i++) {
                names.push(nameOf(keys[i]))
            }
        }
        return names
    }

    /** True when flash memory holds a value for this key. */
    export function hasValue(key: string): boolean {
        if (!key) return false
        return settings.exists(key)
    }

    /**
     * Removes a value from flash memory. Used by the "delete" block of the
     * Variables category when the picked variable holds a file name.
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
            // returns undefined then.
            return qollcodec.decode(stored)
        } catch (e) {
            qoll.report("Value could not be read from flash memory.")
            return undefined
        }
    }

    /**
     * Turns a key back into the name of the flash file: the text of the
     * key after qoll_. Used when the names of the flash files are listed.
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
}
