/**
 * The text format behind the Flash Storage category.
 *
 * pxt turns JSON.parse results into values that the rest of the program
 * cannot safely touch: they belong to a different runner than the program,
 * and reading a property of any such value can crash the whole program
 * with the popular "reading 'iface'" error. So this extension never uses
 * JSON. Flash values are packed into plain text with the code below, and
 * unpacked into fresh, safe values when they are read back.
 *
 * No part of this file reads a property of an unknown value. It only
 * compares values (===), asks typeof, and uses string and array
 * operations that are proven safe (length, charAt, charCodeAt, slice,
 * push, index writes).
 *
 * One stored value is one line of text:
 *
 *     qoll2 <kind> <body>
 *
 * kind says what the value is: number, text, true, false, empty, array
 * or grid. An "array" body holds the number of entries and then one
 * packed value per entry. A "grid" body holds the height, the width, the
 * default value and then the cells, row by row. A nested value inside a
 * body is written as its length in characters, then the value, so that
 * the reader always knows how far it reaches.
 *
 * Inside every body a character that would be miss-read later is written
 * as a backslash with two hex characters (backslash, space, new line,
 * carriage return, tab and NUL). That way the text that is stored is
 * always one single line and can never be cut wrongly, whatever the
 * stored value holds.
 */
namespace qollcodec {
    /** Number of the format, part of every written line. */
    export const FORMAT_VERSION = 2

    /** Text that every packed value starts with. */
    const MARK = "qoll2"
    /** The format number as text, part of the mark. */
    const VERSION_TEXT = "2"
    /** The hex characters used inside escapes. */
    const HEX_DIGITS = "0123456789ABCDEF"

    const KIND_NUMBER = "number"
    const KIND_TEXT = "text"
    const KIND_TRUE = "true"
    const KIND_FALSE = "false"
    const KIND_EMPTY = "empty"
    const KIND_ARRAY = "array"
    const KIND_GRID = "grid"

    /** Error text for stored text that the reader does not recognise. */
    export const DAMAGED = "Stored flash value is damaged."

    /**
     * Turns a number into text.
     *
     * The space in front is there on purpose. pxt compiles `"" + value`
     * into a runtime call that crashes on some values, so the text is
     * built with a space in front and the space is removed again with
     * charAt (the space is at the start, so no real character is lost).
     */
    function numberText(value: number): string {
        const padded = " " + value
        let out = ""
        for (let i = 1; i < padded.length; i++) out += padded.charAt(i)
        return out
    }

    /** Two hex characters for a character code, as used inside escapes. */
    function hexTwo(code: number): string {
        return HEX_DIGITS.charAt((code >> 4) & 15) + HEX_DIGITS.charAt(code & 15)
    }

    /** True when the code is one of the hex characters used in escapes. */
    function isHexCode(code: number): boolean {
        return (code >= 48 && code <= 57) || (code >= 65 && code <= 70) || (code >= 97 && code <= 102)
    }

    /**
     * Escapes a body: every character that would be miss-read later
     * (backslash, space, new line, carriage return, tab, NUL) is written
     * as a backslash with two hex characters.
     */
    function escapeBody(body: string): string {
        let out = ""
        for (let i = 0; i < body.length; i++) {
            const code = body.charCodeAt(i)
            if (code == 92 || code == 32 || code == 10 || code == 13 || code == 9 || code == 0) {
                out += "\\" + hexTwo(code)
            } else {
                out += body.charAt(i)
            }
        }
        return out
    }

    /**
     * The end index (exclusive) of the run of digits that starts at pos,
     * or -1 when there is no digit at pos.
     */
    function digitsRun(text: string, pos: number): number {
        let end = pos
        while (end < text.length && text.charCodeAt(end) >= 48 && text.charCodeAt(end) <= 57) end++
        return end == pos ? -1 : end
    }

    /** True when the text is only characters 0 to 9 and not empty. */
    function isDigits(text: string): boolean {
        if (!text) return false
        for (let i = 0; i < text.length; i++) {
            const code = text.charCodeAt(i)
            if (code < 48 || code > 57) return false
        }
        return true
    }

    /**
     * Reads a number out of text. A padding check makes the reader strict:
     * only texts that a number would write exactly again are accepted,
     * everything else comes back invalid ("3abc" is rejected, not cut).
     */
    function strToNumber(text: string, validOut: boolean[]): number {
        const n = parseFloat(text)
        if (numberText(n) === text) {
            validOut[0] = true
            return n
        }
        validOut[0] = false
        return NaN
    }

    /** Builds the body part that introduces one nested value. */
    function unitLine(packed: string): string {
        return " " + numberText(packed.length) + " " + packed
    }

    /** The kind word of a value, seen from outside. Empty when not storable. */
    function kindOf(value: any): string {
        if (value === undefined) return KIND_EMPTY
        if (value === null) return KIND_EMPTY
        if (typeof value === "boolean") return value ? KIND_TRUE : KIND_FALSE
        if (typeof value === "number") return KIND_NUMBER
        if (typeof value === "string") return KIND_TEXT
        const listBox: any[] = [undefined]
        if (qoll.tryAsArray(value, listBox)) return KIND_ARRAY
        if (qoll.isGrid(value)) return KIND_GRID
        return ""
    }

    // ------------------------------------------------------------ write

    /**
     * Packs a value into the text that goes into flash memory.
     * @param value the value to pack (number, text, true/false, array or grid)
     */
    export function encode(value: any): string {
        const kind = kindOf(value)

        let body = " "
        if (kind == KIND_NUMBER) {
            body = numberText(value as number)
        } else if (kind == KIND_TEXT) {
            body = value as string
        } else if (kind == KIND_ARRAY) {
            const items = value as any[]
            body = numberText(items.length)
            for (let i = 0; i < items.length; i++) {
                body += unitLine(encode(items[i]))
            }
        } else if (kind == KIND_GRID) {
            const grid = value as qoll.Grid
            body = numberText(grid.height) + " " + numberText(grid.width)
            // The default value comes first, then the cells row by row.
            body += unitLine(encode(grid.hasDefault ? grid.defaultValue : undefined))
            for (let y = 0; y < grid.height; y++) {
                for (let x = 0; x < grid.width; x++) {
                    body += unitLine(encode(grid.cells[y * grid.width + x]))
                }
            }
        }

        return MARK + " " + VERSION_TEXT + " " + kind + " " + escapeBody(body)
    }

    // ------------------------------------------------------------ read

    /**
     * Splits one packed line into its kind word and its escaped body.
     * Writes the kind word into box[0] and the escaped body into box[1].
     * @returns true when the line has the shape of a packed value
     */
    function parseLine(text: string, box: string[]): boolean {
        const t = text.trim()
        const headLength = MARK.length + 1 + VERSION_TEXT.length + 1
        if (t.length < headLength) return false
        if (t.slice(0, MARK.length) != MARK) return false
        if (t.charAt(MARK.length) != " ") return false
        if (t.slice(MARK.length + 1, headLength - 1) != VERSION_TEXT) return false
        if (t.charAt(headLength - 1) != " ") return false

        const rest = t.slice(headLength)
        let i = 0
        let kind = ""
        while (i < rest.length) {
            const code = rest.charCodeAt(i)
            if ((code >= 97 && code <= 122) || code == 45) {
                kind += rest.charAt(i)
                i++
            } else break
        }
        // The body of a value may be empty (empty text is stored as
        // "qoll2 2 text " whose trailing space is already consumed as the
        // separator after the kind word), so the end of the text is fine.
        if (i > rest.length) return false
        if (i < rest.length && rest.charAt(i) != " ") return false
        box.push(kind)
        box.push(rest.slice(i + 1))
        return true
    }

    /**
     * Unescapes a body that escapeBody() packed. Writes the body into
     * out[0]. @returns false (with a report) on a broken escape.
     */
    function unescapeBody(escaped: string, out: string[]): boolean {
        let body = ""
        let i = 0
        while (i < escaped.length) {
            const ch = escaped.charAt(i)
            if (ch != "\\") {
                body += ch
                i++
            } else {
                const hi = escaped.charCodeAt(i + 1)
                const lo = escaped.charCodeAt(i + 2)
                if (!isHexCode(hi) || !isHexCode(lo)) {
                    qoll.report(DAMAGED)
                    return false
                }
                const h = hi <= 57 ? hi - 48 : (hi | 32) - 87
                const l = lo <= 57 ? lo - 48 : (lo | 32) - 87
                body += String.fromCharCode(h * 16 + l)
                i += 3
            }
        }
        out.push(body)
        return true
    }

    /**
     * Reads one nested value out of a body: `length`, a space, then the
     * packed text of exactly that length. posBox[0] holds the index where
     * reading starts and receives the index where it ended. posBox[1]
     * becomes 1 when the text was not in shape.
     */
    function readUnit(body: string, posBox: number[]): string {
        let i = posBox[0]
        // The space in front of a following unit (none for the first one).
        if (body.charAt(i) == " ") i++
        const digitsEnd = digitsRun(body, i)
        if (digitsEnd < 0) {
            posBox[1] = 1
            return ""
        }
        const lengthText = body.slice(i, digitsEnd)
        if (!isDigits(lengthText)) {
            posBox[1] = 1
            return ""
        }
        i = digitsEnd
        if (body.charAt(i) != " ") {
            posBox[1] = 1
            return ""
        }
        i++
        const length = parseInt(lengthText, 10)
        if (length < 1) {
            posBox[1] = 1
            return ""
        }
        const packed = body.slice(i, i + length)
        if (packed.length != length) {
            posBox[1] = 1
            return ""
        }
        posBox[0] = i + length
        posBox[1] = 0
        return packed
    }

    /** Reports the damaged-value message once, at the failing layer. */
    function reportDamaged(): void {
        qoll.report(DAMAGED)
    }

    /**
     * Unpacks one value: splits the line, unescapes the body, builds the
     * value into valueOut[0]. @returns false when the text is damaged
     * (the message has been reported then).
     */
    function decodePacked(text: string, valueOut: any[]): boolean {
        const parts: string[] = []
        if (!parseLine(text, parts)) {
            reportDamaged()
            return false
        }
        const kind = parts[0]
        const bodyParts: string[] = []
        if (!unescapeBody(parts[1], bodyParts)) return false
        const body = bodyParts[0]

        if (kind == KIND_NUMBER) {
            const valid: boolean[] = [false]
            const n = strToNumber(body, valid)
            if (!valid[0]) {
                reportDamaged()
                return false
            }
            valueOut[0] = n
            return true
        }
        if (kind == KIND_TRUE) {
            valueOut[0] = true
            return true
        }
        if (kind == KIND_FALSE) {
            valueOut[0] = false
            return true
        }
        if (kind == KIND_TEXT) {
            valueOut[0] = body
            return true
        }
        if (kind == KIND_EMPTY) {
            valueOut[0] = undefined
            return true
        }
        if (kind == KIND_ARRAY) return decodeArrayBody(body, valueOut)
        if (kind == KIND_GRID) return decodeGridBody(body, valueOut)

        reportDamaged()
        return false
    }

    /** Builds an array out of its body: the count first, then the units. */
    function decodeArrayBody(body: string, valueOut: any[]): boolean {
        const digitsEnd = digitsRun(body, 0)
        if (digitsEnd < 0) {
            reportDamaged()
            return false
        }
        const countText = body.slice(0, digitsEnd)
        if (!isDigits(countText)) {
            reportDamaged()
            return false
        }
        // An empty array (count 0) has no trailing separator.
        if (digitsEnd == body.length && parseInt(countText, 10) == 0) {
            valueOut[0] = []
            return true
        }
        if (body.charAt(digitsEnd) != " ") {
            reportDamaged()
            return false
        }

        const out: any[] = []
        const posBox = [digitsEnd + 1, 0]
        const valueBox: any[] = [undefined]
        for (let e = 0; e < parseInt(countText, 10); e++) {
            const packed = readUnit(body, posBox)
            if (posBox[1] != 0) {
                reportDamaged()
                return false
            }
            valueBox[0] = undefined
            if (!decodePacked(packed, valueBox)) return false
            out.push(valueBox[0])
        }
        if (posBox[0] != body.length) {
            reportDamaged()
            return false
        }
        valueOut[0] = out
        return true
    }

    /** Builds a grid out of its body: height, width, default, cells. */
    function decodeGridBody(body: string, valueOut: any[]): boolean {
        // The height comes first.
        const heightEnd = digitsRun(body, 0)
        if (heightEnd < 0 || body.charAt(heightEnd) != " ") {
            reportDamaged()
            return false
        }
        const height = parseInt(body.slice(0, heightEnd), 10)
        if (height < 0 || height > 500) {
            reportDamaged()
            return false
        }

        // Then the width.
        const widthEnd = digitsRun(body, heightEnd + 1)
        if (widthEnd < 0 || body.charAt(widthEnd) != " ") {
            reportDamaged()
            return false
        }
        const width = parseInt(body.slice(heightEnd + 1, widthEnd), 10)
        if (width < 0 || width > 500) {
            reportDamaged()
            return false
        }

        // The default value unit comes first.
        const posBox = [widthEnd + 1, 0]
        const valueBox: any[] = [undefined]
        const defaultPacked = readUnit(body, posBox)
        if (posBox[1] != 0) {
            reportDamaged()
            return false
        }
        if (!decodePacked(defaultPacked, valueBox)) return false
        const hasDefault = valueBox[0] !== undefined

        // Then the cells, row by row. A restored grid is registered by
        // newGrid, so the program sees it as a grid again.
        const grid = qoll.newGrid(hasDefault, valueBox[0])
        const wanted = height * width
        for (let c = 0; c < wanted; c++) {
            const packed = readUnit(body, posBox)
            if (posBox[1] != 0) {
                reportDamaged()
                return false
            }
            valueBox[0] = undefined
            if (!decodePacked(packed, valueBox)) return false
            grid.cells.push(valueBox[0])
        }
        if (posBox[0] != body.length) {
            reportDamaged()
            return false
        }
        grid.width = width
        grid.height = height
        valueOut[0] = grid
        return true
    }

    /**
     * Unpacks the flash text back into the value it holds. Restored
     * grids are registered, so isGrid() knows them again.
     * @param text the flash text, as it was written by encode()
     * @returns the value, or undefined when the text is damaged
     */
    export function decode(text: string): any {
        const valueOut: any[] = [undefined]
        if (!decodePacked(text, valueOut)) return undefined
        return valueOut[0]
    }
}
