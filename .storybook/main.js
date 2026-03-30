module.exports = {
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx|mdx)"],
  addons: ["@storybook/addon-essentials", "@storybook/preset-create-react-app"],
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
};
