module.exports = function (api) {
  api.cache(true)
  return {
    presets: [['babel-preset-expo', { jsxImportSource: '@emotion/react' }]],
    plugins: ['@emotion/babel-plugin'],
  }
}
