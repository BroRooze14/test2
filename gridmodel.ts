/**
 * The data structure behind the "Grids" category.
 *
 * A grid is a normal value: store it in a regular variable with the
 * "set variable to" block, or keep it in flash memory with the Flash
 * Storage blocks so it survives a power cycle.
 *
 * Two pxt pitfalls shape this file:
 *
 * - Property reads on values typed as "any" are compiled into a runtime
 *   dispatch that crashes on values without a class table (the popular
 *   "reading 'iface'" error). So no code here reads members of unknown
 *   values. Grids are recognised by identity: every grid that is created
 *   or restored is put into a list, and isGrid() looks the value up in
 *   that list with plain ===. That works in the simulator and on the
 *   micro:bit and can never crash.
 */
namespace qoll {
    /** Text that is shown for a cell that holds no value. */
    const EMPTY_CELL = " "
    /** Every grid created or restored during this run, used by isGrid(). */
    const gridRegistry: any[] = []

    /**
     * Turns a number into text.
     *
     * The space in front is there on purpose. pxt compiles `"" + value`
     * into a runtime call that crashes on some values, so the text is
     * built with a space in front and the space is removed again with
     * charAt().
     * @param value the number to turn into text
     */
    function numberText(value: number): string {
        const padded = " " + value
        let out = ""
        for (let i = 1; i < padded.length; i++) out += padded.charAt(i)
        return out
    }

    /**
     * True when the value is an array.
     *
     * Array.isArray cannot be used here: in the simulator pxt arrays are
     * objects of a runtime class, not native arrays, so Array.isArray
     * says false there and every array would be treated as an object.
     * Instead the value is cast to an array type inside try/catch, so the
     * pxt runtime itself is asked — it answers with a catchable cast
     * error for every value that is not an array. The cast writes the
     * array into out[0] exactly when it is one.
     * @param value the value to check
     * @param out writes the value as an array into out[0] when true
     */
    export function tryAsArray(value: any, out: any[]): boolean {
        if (value === undefined || value === null) return false
        // Numbers, text and true/false can be iterated over in a plain for
        // loop without an error, so the probe below cannot tell them from
        // arrays. Only an object of some kind can be an array.
        if (typeof value !== "object") return false
        // A grid is never an array. Check the registry first, with plain ===,
        // because the cast probe below can not tell a grid from an object
        // that simply has no length (the loop just runs zero times there).
        for (let i = 0; i < gridRegistry.length; i++) {
            if (gridRegistry[i] === value) return false
        }
        try {
            const list = value as any[]
            let probe = 0
            for (let i = 0; i < list.length; i++) probe++
            out[0] = list
            return true
        } catch (e) {
            return false
        }
    }

    /** Turns a value into the text that is printed for it. */
    export function textOf(value: any): string {
        if (value === undefined || value === null) return "null"
        if (typeof value === "string") return value
        if (typeof value === "number") return numberText(value)
        if (typeof value === "boolean") return value ? "true" : "false"
        if (isGrid(value)) return "[grid]"
        const listBox: any[] = [undefined]
        if (tryAsArray(value, listBox)) return arrayText(listBox[0])
        return "[object]"
    }

    /** Renders a list as text, for example ["a", 2]. Used by more files. */
    export function arrayText(list: any[]): string {
        let out = "["
        for (let i = 0; i < list.length; i++) {
            if (i > 0) out += ", "
            const item = list[i]
            if (item !== undefined && item !== null && typeof item === "string") {
                out += "\"" + item + "\""
            } else {
                out += textOf(item)
            }
        }
        return out + "]"
    }

    /**
     * Text that is printed for a single grid cell.
     * A cell without a value is shown as one space.
     */
    export function cellText(value: any): string {
        if (value === undefined || value === null) return EMPTY_CELL
        const text = textOf(value)
        // A cell that holds empty text is shown as a space too: empty text
        // would break the runtime, so it is never used.
        if (!text) return EMPTY_CELL
        return text
    }

    /**
     * True when the value is a grid.
     *
     * Grids are known by identity (see the note at the top of the file):
     * instanceof would crash on some values, and reading a marker field
     * of an unknown value can crash too.
     * @param value the value to check
     */
    export function isGrid(value: any): boolean {
        if (value === undefined || value === null || typeof value !== "object") return false
        const listBox: any[] = [undefined]
        if (tryAsArray(value, listBox)) return false
        for (let i = 0; i < gridRegistry.length; i++) {
            if (gridRegistry[i] === value) return true
        }
        return false
    }

    /** Remembers a grid so isGrid() can recognise it later. */
    export function registerGrid(grid: Grid): Grid {
        gridRegistry.push(grid)
        return grid
    }

    /** A two dimensional grid of cells. It grows when cells are written. */
    export class Grid {
        /** Cell values, stored row by row (width entries per row). */
        cells: any[]
        /** Number of columns that currently exist. */
        width: number
        /** Number of rows that currently exist. */
        height: number
        /** Value of cells that were never written, null when none was set. */
        defaultValue: any
        /** True when a default value was chosen in "create grid". */
        hasDefault: boolean

        /**
         * Creates an empty grid that grows when cells are written.
         * @param hasDefault true when a default value was chosen
         * @param defaultValue value of cells that were never written
         */
        constructor(hasDefault: boolean, defaultValue?: any) {
            this.cells = []
            this.width = 0
            this.height = 0
            if (hasDefault && defaultValue !== undefined) {
                this.hasDefault = true
                this.defaultValue = defaultValue
            } else {
                this.hasDefault = false
                this.defaultValue = null
            }
        }

        /**
         * Grows the grid until a grid of w by h cells fits. Existing cells
         * keep their value, new cells get the default value.
         */
        resizeTo(w: number, h: number): void {
            const newWidth = w > this.width ? w : this.width
            const newHeight = h > this.height ? h : this.height
            if (newWidth <= 0 || newHeight <= 0) return

            const fill = this.hasDefault ? this.defaultValue : null
            const next: any[] = []
            for (let i = 0; i < newWidth * newHeight; i++) next.push(fill)

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
         * Reads a cell. The grid behaves as an endless field: cells outside
         * of the grown part read as the default value. Only addresses under
         * 0 are impossible.
         */
        getCell(x: number, y: number): any {
            if (x < 0 || y < 0) {
                report("Cell address cant be under 0")
                return null
            }
            if (x < this.width && y < this.height) return this.cells[y * this.width + x]
            return this.hasDefault ? this.defaultValue : null
        }

        /**
         * Writes a cell. The grid grows when needed. Addresses under 0 are
         * never written, so cells cannot start there.
         * @returns true when the cell was written
         */
        setCell(x: number, y: number, value: any): boolean {
            if (x < 0 || y < 0) {
                report("Cell address cant be under 0")
                return false
            }
            if (x >= this.width || y >= this.height) this.resizeTo(x + 1, y + 1)
            this.cells[y * this.width + x] = value === undefined ? null : value
            return true
        }

        /** Removes every cell. The grid becomes empty and grows again when cells are written. */
        reset(): void {
            this.cells = []
            this.width = 0
            this.height = 0
        }

        /**
         * Renders the whole grid as text: one line per row. Cells that were
         * never written show up as a space (or the default value that was
         * chosen when the grid was created).
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
                    if (x + 1 < this.width) {
                        while (text.length < columnWidth[x]) text += " "
                    }
                    out += text
                }
            }
            return out
        }
    }

    /** Creates a new empty grid and remembers it. Used by the block. */
    export function newGrid(hasDefault: boolean, defaultValue: any): Grid {
        return registerGrid(new Grid(hasDefault, defaultValue))
    }
}
