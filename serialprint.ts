/**
 * Print an array to the serial output, shown in the standard Arrays category.
 */
//% blockNamespace="arrays"
namespace qollarrays {
    /** Turns one array entry into the text that is printed for it. */
    function elementText(value: any): string {
        if (value === undefined || value === null) return "null"
        if (typeof value === "string") return "\"" + value + "\""
        return qoll.textOf(value)
    }

    /** Renders a whole array as text, for example [1, 2, 3]. */
    function arrayText(list: any[]): string {
        let out = "["
        for (let i = 0; i < list.length; i++) {
            if (i > 0) out += ", "
            out += elementText(list[i])
        }
        return out + "]"
    }

    /**
     * Prints an array in the serial output, for example [1, 2, 3]. Works for
     * arrays in a normal variable and for arrays that are kept in flash
     * memory.
     * @param variable the variable that holds the array
     */
    //% blockId=qoll_serial_write_array block="serial|write array $variable"
    //% variable.shadow="variables_get"
    //% variable.defl="myArray"
    export function serialWriteArray(variable: any): void {
        if (variable === undefined || variable === null) {
            qoll.report("Selected variable is empty.")
            return
        }

        let list = variable
        if (typeof variable === "string") {
            const key = flashstorage.keyFor(variable)
            if (!key) return
            list = flashstorage.readValue(key)
        }

        if (list === undefined || list === null) {
            qoll.report("Selected variable is not an array.")
            return
        }
        if (!Array.isArray(list)) {
            qoll.report("Selected variable is not an array.")
            return
        }

        serial.writeLine(arrayText(list))
    }
}
