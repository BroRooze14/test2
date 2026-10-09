/**
 * Delete a variable block, shown in the standard Variables category.
 *
 * A variable holds its data in the program, so data that lives inside an
 * object can be thrown away: arrays are emptied, grids are reset and flash
 * variables are removed from flash memory. Plain numbers and text cannot be
 * thrown away from a block (the block only receives a copy of the value),
 * so those cases explain on the terminal how to clear them.
 */
//% blockNamespace="variables"
namespace qollvars {
    /**
     * Deletes the data of a variable of any kind: a grid, an array, a flash
     * variable, a number or text.
     * @param variable the variable to delete
     */
    //% blockId=qoll_delete_variable block="delete $variable"
    //% variable.shadow="variables_get"
    //% variable.defl="myVariable"
    export function deleteVariable(variable: any): void {
        if (variable === undefined || variable === null) {
            qoll.report("Variable is already empty.")
            return
        }

        const listBox: any[] = [undefined]
        if (qoll.tryAsArray(variable, listBox)) {
            const list = listBox[0]
            while (list.length > 0) list.pop()
            return
        }

        if (qoll.isGrid(variable)) {
            variable.reset()
            return
        }

        if (typeof variable === "string") {
            const key = flashstorage.keyFor(variable)
            if (key && flashstorage.hasValue(key)) {
                flashstorage.deleteStored(key)
                qoll.report("Flash variable deleted.")
                return
            }
            qoll.report("Cannot delete a text value. Set the variable to an empty text instead.")
            return
        }

        if (typeof variable === "number" || typeof variable === "boolean") {
            qoll.report("Cannot delete a number or true/false value. Set the variable to 0 instead.")
            return
        }

        qoll.report("Cannot delete this value. Set the variable to 0 instead.")
    }
}
