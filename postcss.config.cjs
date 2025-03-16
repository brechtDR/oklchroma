const postcssPresetEnv = require("postcss-preset-env");
// postcss.config.js
module.exports = {
    plugins: [
        require("postcss-import"),
        postcssPresetEnv({
            browsers: "cover 85% in alt-EU",
        }),
        require("postcss-combine-duplicated-selectors"),
        // require('cssnano'),
    ],
};
