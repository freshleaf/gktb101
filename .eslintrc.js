module.exports = {
    "env": {
        "node": true,
        "browser": true,
        "commonjs": true,
        "es6": true
    },
    "extends": "eslint:recommended",
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parserOptions": {
        "ecmaVersion": 2018
    },
    "rules": {
        "no-console": 0,
        'indent': ['warn', 4, {SwitchCase: 1}],
        'quotes': ['warn', 'single'],
        'semi' : [1, "always"]
    }
};