/**
 * The data structure behind the "Grids" category.
 *
 * A grid is a normal value: store it in a regular variable with the
 * "set variable to" block, or keep it in flash memory with the
 * Flash Storage blocks so it survives a power cycle.
 *
 * The cells hold the value that was last written to them - the value of
 * a cell the program never wrote is null. How cells without a value are
 * printed is decided by the "create grid" block: with "set default value"
 * every empty cell holds the chosen value, without it they are shown as
 * a space. A cell can really only be written when its address is 0 or more.
 */
namespace qoll {
    /** Text that is shown for a cell that holds no value. */
    const EMPTY_CELL = " "

    /** Marker written into every grid, so grids can be told apart from other objects. */
    const GRID_TYPE_TAG = "grid"

    /**
     * Turns a number into text.
     *
     * The space in front is there on purpose. pxt compiles the empty string
     * literal in `"" + value` into a call that crashes, because the empty
     * string is passed to the runtime without a value table. So the text is
     * built with a space in front, and the space is removed again afterwards
     * with charAt().
     * @param value the number to turn into text
     */
    function numberText(value: number): string {
        const padded = " " + value
        let out = ""
        for (let i = 1; i < padded.length; i++) out += padded.charAt(i)
        return out
    }

    /** Turns a value into the text that is printed for it. */
    export function textOf(value: any): string {
        if (value === undefined || value === null) return "null"
        if (typeof value === "string") return value
        if (typeof value === "number") return numberText(value)
        if (typeof value === "boolean") return value ? "true" : "false"
        if (isGrid(value)) return "[grid]"
        if (Array.isArray(value)) return JSON.stringify(value)
        return "[object]"
    }

    /**
     * Text that is printed for a single grid cell.
     * A cell without a value is shown as one space.
     */
    export function cellText(value: any): string {
        if (value === undefined || value === null) return EMPTY_CELL
        const text = textOf(value)
        // A cell that holds empty text is shown as a space too: an empty text
        // cannot be handed to the runtime, so it would break the printing.
        if (!text) return EMPTY_CELL
        return text
    }

    /** Reads a size setting; missing, null and negative sizes become 0. */
    function sizeOf(value: number): number {
        if (value === undefined || value === null) return 0
        if (value <= 0) return 0
        return Math.floor(value)
    }

    /**
     * True when the value is a grid.
     *
     * instanceof is not used here on purpose: values that come back from
     * flash memory are plain objects without a class table, and asking such
     * an object for its class table crashes the runtime instead of simply
     * answering false.
     * @param value the value to check
     */
    export function isGrid(value: any): boolean {
        if (!value) return false
        return typeof value === "object" && value.gridType == GRID_TYPE_TAG
    }

    /**
     * A two dimensional grid.
     *
     * The grid grows automatically when a cell outside of the current size is
     * written, unless a maximum size was set when the grid was created.
     */
    export class Grid {
        /** Cell values, stored row by row (width entries per row). */
        cells: any[]
        /** Number of columns that currently exist. */
        width: number
        /** Number of rows that currently exist. */
        height: number
        /** Maximum number of columns, 0 means unlimited. */
        maxWidth: number
        /** Maximum number of rows, 0 means unlimited. */
        maxHeight: number
        /** Number of columns the grid is restored to by reset(), 0 means empty. */
        defaultWidth: number
        /** Number of rows the grid is restored to by reset(), 0 means empty. */
        defaultHeight: number
        /** Value of cells that were never written, null when no default was set. */
        defaultValue: any
        /** Marker that marks this object as a grid. Not part of the saved data. */
        gridType: string

        /**
         * Creates a grid.
         * @param maxWidth maximum number of columns, 0 for unlimited
         * @param maxHeight maximum number of rows, 0 for unlimited
         * @param defaultWidth number of columns the grid starts with, 0 to start empty
         * @param defaultHeight number of rows the grid starts with, 0 to start empty
         * @param defaultValue value of cells that were never written
         */
        constructor(maxWidth?: number, maxHeight?: number, defaultWidth?: number, defaultHeight?: number, defaultValue?: any) {
            this.maxWidth = sizeOf(maxWidth)
            this.maxHeight = sizeOf(maxHeight)
            this.defaultWidth = sizeOf(defaultWidth)
            this.defaultHeight = sizeOf(defaultHeight)
            this.defaultValue = defaultValue === undefined || defaultValue === null ? null : defaultValue
            this.gridType = GRID_TYPE_TAG
            this.cells = []
            this.width = 0
            this.height = 0

            if (this.maxWidth > 0 && this.defaultWidth > this.maxWidth) {
                report("Default grid size is bigger than the maximum size.")
                this.defaultWidth = this.maxWidth
            }
            if (this.maxHeight > 0 && this.defaultHeight > this.maxHeight) {
                report("Default grid size is bigger than the maximum size.")
                this.defaultHeight = this.maxHeight
            }
            if (this.defaultWidth > 0 && this.defaultHeight > 0)
                this.resizeTo(this.defaultWidth, this.defaultHeight)
        }

        /**
         * Returns "" when the address is allowed, otherwise the message that
         * has to be written to the terminal for that address.
         */
        checkAddress(x: number, y: number): string {
            if (x < 0 || y < 0) return "Cell address cant be under 0"
            if (this.maxWidth > 0 && x >= this.maxWidth) return "Out of set max grid range."
            if (this.maxHeight > 0 && y >= this.maxHeight) return "Out of set max grid range."
            return ""
        }

        /**
         * Grows the grid until a grid of w by h cells fits. Existing cells keep
         * their value, new cells get the default value.
         */
        resizeTo(w: number, h: number): void {
            const newWidth = w > this.width ? w : this.width
            const newHeight = h > this.height ? h : this.height
            if (newWidth <= 0 || newHeight <= 0) return

            const next: any[] = []
            for (let i = 0; i < newWidth * newHeight; i++) next.push(this.defaultValue)

            for (let y = 0; y < this.height && y < newHeight; y++) {
                for (let x = 0; x < this.width && x < newWidth; x++) {
                    next[y * newWidth + x] = this.cells[y * this.width + x]
                }
            }

            this.cells = next
            this.width = newWidth
            this.height = newHeight
        }

        /**
         * Reads a cell. Invalid addresses are reported on the terminal and the
         * default value of the grid is returned instead.
         */
        getCell(x: number, y: number): any {
            const problem = this.checkAddress(x, y)
            if (problem) {
                report(problem)
                return this.defaultValue
            }
            if (x < this.width && y < this.height)
                return this.cells[y * this.width + x]
            return this.defaultValue
        }

        /**
         * Writes a cell. The grid grows when needed. Invalid addresses are
         * reported on the terminal and nothing is written.
         * @returns true when the cell was written
         */
        setCell(x: number, y: number, value: any): boolean {
            const problem = this.checkAddress(x, y)
            if (problem) {
                report(problem)
                return false
            }
            if (x >= this.width || y >= this.height) this.resizeTo(x + 1, y + 1)
            this.cells[y * this.width + x] = value === undefined ? null : value
            return true
        }

        /** Clears every cell and returns the grid to its default size. */
        reset(): void {
            this.width = 0
            this.height = 0
            this.cells = []
            if (this.defaultWidth > 0 && this.defaultHeight > 0)
                this.resizeTo(this.defaultWidth, this.defaultHeight)
        }

        /**
         * Renders the whole grid as text: one line per row, one column per
         * column. Cells without a value show up as a space.
         */
        format(): string {
            if (this.width <= 0 || this.height <= 0) return "(empty grid)"

            const columnWidth: number[] = []
            for (let x = 0; x < this.width; x++) columnWidth.push(1)

            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    const len = cellText(this.cells[y * this.width + x]).length
                    if (len > columnWidth[x]) columnWidth[x] = len
                }
            }

            let out = ""
            for (let y = 0; y < this.height; y++) {
                if (y > 0) out += "\r\n"
                for (let x = 0; x < this.width; x++) {
                    if (x > 0) out += " "
                    let text = cellText(this.cells[y * this.width + x])
                    if (x + 1 < this.width)
                        while (text.length < columnWidth[x]) text += " "
                    out += text
                }
            }
            return out
        }
    }

    /**
     * Turns a grid into a plain object so it can be written to flash memory.
     */
    export function gridToPlain(grid: any): any {
        if (isGrid(grid)) return {
            maxWidth: grid.maxWidth,
            maxHeight: grid.maxHeight,
            defaultWidth: grid.defaultWidth,
            defaultHeight: grid.defaultHeight,
            defaultValue: grid.defaultValue,
            width: grid.width,
            height: grid.height,
            cells: grid.cells
        }
        return null
    }

    /**
     * Rebuilds a grid from the plain object that was read back from flash
     * memory. Damaged data is reported on the terminal and repaired.
     *
     * The cells are copied one by one into a real array. The data that comes
     * back from flash memory is a plain list made by JSON.parse, and such a
     * list must not be kept as the grid's cell storage.
     */
    export function gridFromPlain(raw: any): Grid {
        if (raw === undefined || raw === null || typeof raw !== "object") {
            report("Stored grid data was damaged and has been reset.")
            return new Grid()
        }

        // The maximum size that was stored by an older version of this
        // extension is dropped on purpose: sizes are not a setting anymore,
        // so a grid that comes back from flash memory grows freely again.
        const grid = new Grid(0, 0, raw.defaultWidth, raw.defaultHeight, raw.defaultValue)
        const w = typeof raw.width === "number" && raw.width > 0 ? Math.floor(raw.width) : 0
        const h = typeof raw.height === "number" && raw.height > 0 ? Math.floor(raw.height) : 0

        if (w > 0 && h > 0 && Array.isArray(raw.cells) && raw.cells.length == w * h) {
            grid.width = w
            grid.height = h
            grid.cells = []
            for (let i = 0; i < raw.cells.length; i++) grid.cells.push(raw.cells[i])
        } else if (w > 0 && h > 0) {
            report("Stored grid data was damaged and has been repaired.")
            grid.resizeTo(w, h)
        }

        return grid
    }
}
