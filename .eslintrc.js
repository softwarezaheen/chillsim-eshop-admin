module.exports = {
    env: {
      browser: true,
      es2021: true,
    },
    extends: [
      "eslint:recommended",
      "plugin:react/recommended",
      "plugin:react-hooks/recommended",
      "plugin:import/errors",
      "plugin:import/warnings",
    ],
    plugins: ["react", "react-hooks", "import"],
    rules: {
      "react/react-in-jsx-scope": "off", // React 17+ doesn't need import React manually
      "import/no-unresolved": "error",
      "import/named": "error", 
      // optional: add more rules
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  };
  