/**
 * The "Grids" category: a two dimensional grid that can be stored in a
 * normal variable or in flash memory (Flash Storage category).
 *
 * Grid cells are addressed by an x (column) and a y (row) coordinate.
 * Both start at 0. Addresses under 0 and addresses outside of the maximum
 * size that was set while creating the grid are reported on the terminal.
 */
//% color="#1A237E" icon="\uf00a" block="Grids"
namespace grids {
    /**
     * Points at a grid: either at the grid that lives in a variable, or at a
     * grid that is kept in flash memory (in that case changes are written
     * back to flash memory).
     */
    class GridRef {
        grid: qoll.Grid
        flashKey: string

        constructor(grid: qoll.Grid, flashKey: string) {
            this.grid = grid
            this.flashKey = flashKey
        }
    }

    /**
     * Finds the grid that a variable points at. Returns nothing and reports
     * the problem on the terminal when the variable does not hold a grid.
     */
    function resolve(value: any): GridRef {
        if (qoll.isGrid(value)) return new GridRef(value, "")

        if (value === undefined || value === null) {
            qoll.report("Selected variable is empty. Set it to a grid first.")
            return null
        }

        if (typeof value === "string") {
            const key = flashstorage.keyFor(value)
            if (!key) return null
            const stored = flashstorage.readValue(key)
            if (qoll.isGrid(stored)) return new GridRef(stored, key)
            qoll.report("Selected variable does not hold a grid.")
            return null
        }

        qoll.report("Selected variable is not a grid.")
        return null
    }

    /**
     * Writes a grid that lives in flash memory back to flash memory.
     */
    function store(ref: GridRef): void {
        if (ref && ref.flashKey) flashstorage.writeValue(ref.flashKey, ref.grid)
    }

    /**
     * Creates a new grid that can be stored in a variable.
     *
     * * maximum size: the grid refuses to grow past this size.
     * * default size: the number of columns and rows the grid starts with.
     * * default value: the value of cells that were never written. When it is
     *   not used, empty cells are shown as a space.
     * @param maxWidth maximum number of columns, 0 means unlimited
     * @param maxHeight maximum number of rows, 0 means unlimited
     * @param defaultWidth number of columns the grid starts with, 0 means empty
     * @param defaultHeight number of rows the grid starts with, 0 means empty
     * @param useDefault when true the default value below is used
     * @param defaultValue value of cells that were never written
     */
    //% blockId=qoll_create_grid
    //% block="create grid || maximum size $maxWidth by $maxHeight | default size $defaultWidth by $defaultHeight | set default value $useDefault to $defaultValue"
    //% expandableArgumentMode="toggle"
    //% maxWidth.defl=0 maxHeight.defl=0 defaultWidth.defl=0 defaultHeight.defl=0
    //% useDefault.shadow="logic_boolean"
    //% useDefault.defl=false
    export function createGrid(maxWidth: number = 0, maxHeight: number = 0, defaultWidth: number = 0, defaultHeight: number = 0, useDefault: boolean = false, defaultValue?: any): qoll.Grid {
        if (maxWidth < 0 || maxHeight < 0 || defaultWidth < 0 || defaultHeight < 0) {
            qoll.report("Grid size cannot be under 0.")
            if (maxWidth < 0) maxWidth = 0
            if (maxHeight < 0) maxHeight = 0
            if (defaultWidth < 0) defaultWidth = 0
            if (defaultHeight < 0) defaultHeight = 0
        }
        const fallback = useDefault ? defaultValue : undefined
        return new qoll.Grid(maxWidth, maxHeight, defaultWidth, defaultHeight, fallback)
    }

    /**
     * Reads the value of one cell of a grid.
     * @param variable the variable that holds the grid
     * @param Xvalue column of the cell, 0 is the first column
     * @param Yvalue row of the cell, 0 is the first row
     */
    //% blockId=qoll_get_grid_cell block="$variable get value at $Xvalue $Yvalue"
    //% variable.shadow="variables_get"
    //% variable.defl="myGrid"
    //% Xvalue.defl=0 Yvalue.defl=0
    export function getGridCell(variable: any, Xvalue: number, Yvalue: number): any {
        const ref = resolve(variable)
        if (!ref) return undefined
        return ref.grid.getCell(Xvalue, Yvalue)
    }

    /**
     * Writes one cell of a grid. The grid grows when it has to.
     * @param Xvalue column of the cell, 0 is the first column
     * @param Yvalue row of the cell, 0 is the first row
     * @param variable the variable that holds the grid
     * @param value the new value of the cell (number, text, true/false, ...)
     */
    //% blockId=qoll_set_grid_cell block="set grid cell $Xvalue $Yvalue of $variable to $value"
    //% variable.shadow="variables_get"
    //% variable.defl="myGrid"
    //% Xvalue.defl=0 Yvalue.defl=0
    export function setGridCell(Xvalue: number, Yvalue: number, variable: any, value: any): void {
        const ref = resolve(variable)
        if (!ref) return
        ref.grid.setCell(Xvalue, Yvalue, value)
        store(ref)
    }

    /**
     * Resets a stored grid: every cell gets the default value again and the
     * grid returns to its default size.
     * @param variable the variable that holds the grid
     */
    //% blockId=qoll_reset_grid block="reset $variable"
    //% variable.shadow="variables_get"
    //% variable.defl="myGrid"
    export function resetGrid(variable: any): void {
        const ref = resolve(variable)
        if (!ref) return
        ref.grid.reset()
        store(ref)
    }

    /**
     * Prints a grid in the serial output, one line per row. Cells without a
     * value are shown as a space. Works for grids in a normal variable and
     * for grids that are kept in flash memory.
     * @param variable the variable that holds the grid
     */
    //% blockId=qoll_serial_write_grid block="serial|write $variable"
    //% variable.shadow="variables_get"
    //% variable.defl="myGrid"
    export function serialWriteGrid(variable: any): void {
        const ref = resolve(variable)
        if (!ref) return
        serial.writeLine(ref.grid.format())
    }
}
