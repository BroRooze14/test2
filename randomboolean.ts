/**
 * Random true or false generator, shown in the standard Logic category.
 */
//% blockNamespace="logic"
namespace randomlogic {
    /**
     * Picks either true or false, both with the same chance.
     */
    //% blockId=qoll_random_boolean block="pick random true or false"
    export function randomBoolean(): boolean {
        return Math.randomRange(0, 1) === 1
    }
}
