import * as util from "util";

declare global {
    class TextEncoder extends util.TextEncoder {}
    class TextDecoder extends util.TextDecoder {}
}
