const postcssPresetEnv = require("postcss-preset-env");
// postcss.config.js
module.exports = {
    plugins: [
        require("postcss-import"),
        postcssPresetEnv({
            browsers: "cover 85% in alt-EU",
            preserve: true,
            features: {
                // Native custom properties are universally supported; the polyfill
                // stripped the --p-*/--s-* token definitions out of :root.
                "custom-properties": false,
                // The light-dark() polyfill rewrote :root and dropped every token
                // definition. Modern browsers support light-dark() natively.
                "light-dark-function": false,
            },
        }),
        require("postcss-combine-duplicated-selectors"),
        // require('cssnano'),
    ],
};
