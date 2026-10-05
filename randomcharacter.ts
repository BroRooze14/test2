/**
 * Random character generator, shown in the standard Text category.
 *
 * The default set of characters is every letter (upper and lower case) and
 * every digit. Any other set of characters can be typed in the block.
 */
//% blockNamespace="text"
namespace randomtext {
    /** Letters and digits, upper and lower case. */
    const DEFAULT_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

    /**
     * Picks one random character out of a set of characters.
     * @param characters the characters to choose from
     */
    //% blockId=qoll_random_character block="random character from $characters"
    //% characters.defl="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    export function randomCharacter(characters: string): string {
        if (characters === undefined || characters === null || characters.length == 0) {
            qoll.report("Character set is empty.")
            // A space, and not empty text: an empty text cannot be handed to
            // the runtime and would break whatever block uses the result.
            return " "
        }
        if (characters.length == 1) return characters
        const index = Math.randomRange(0, characters.length - 1)
        return characters.charAt(index)
    }

    /**
     * The default set of characters of the random character block:
     * every letter (upper and lower case) and every digit.
     */
    //% blockId=qoll_default_characters block="default characters"
    export function defaultCharacters(): string {
        return DEFAULT_CHARACTERS
    }
}
