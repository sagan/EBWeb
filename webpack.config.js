const path = require("path");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const workboxPlugin = require("workbox-webpack-plugin");
const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const FaviconsWebpackPlugin = require("favicons-webpack-plugin");
const rimraf = require("rimraf");
const config = require("./config.loader");
const { version } = require("./package.json");

const __DATA_VERSION__ = 1;
const __COMMIT_HASH__ = "4865901"; // git rev-parse --short HEAD

const productionPlugin = new webpack.DefinePlugin({
  __COMMIT_HASH__: JSON.stringify(__COMMIT_HASH__),
  __ROOTVERSION__: JSON.stringify(version),
  __DATA_VERSION__: JSON.stringify(__DATA_VERSION__),
  __ROOTPATH__: JSON.stringify(config.ROOTPATH),
  __SITEID__: JSON.stringify(config.SITEID),
  __DEFAULTDICT__: JSON.stringify(config.DEFAULTDICT),
  "process.env.NODE_ENV": JSON.stringify("production"),
});

const CleanPlugin = new (class {
  apply(compiler) {
    compiler.hooks.done.tap("clean", () => {
      console.log("clean");
      // rimraf.sync("./dist/*.LICENSE.txt");
    });
  }
})();

const polyfill = {
  path: require.resolve("path-browserify"),
  process: require.resolve("process/browser"),
};

module.exports = [
  {
    target: "browserslist:legacy",
    mode: "production",
    entry: {
      bundle: "./client/index.legacy.jsx",
    },
    output: {
      path: path.resolve("dist"),
      publicPath: config.ROOTPATH,
      filename: "bundle.legacy.js",
    },
    module: {
      rules: [
        {
          test: /\.m?jsx?$/,
          use: {
            loader: "babel-loader",
            options: {
              sourceType: "unambiguous",
              presets: [
                [
                  "@babel/preset-env",
                  {
                    browserslistEnv: "legacy",
                    useBuiltIns: "usage",
                    corejs: 3,
                  },
                ],
                "@babel/preset-react",
              ],
              plugins: ["@babel/plugin-proposal-class-properties"],
            },
          },
          exclude: /node_modules/,
        },
        {
          test: /\.(sa|sc|c)ss$/,
          use: "ignore-loader",
        },
      ],
    },
    resolve: {
      // ... rest of the resolve config
      fallback: polyfill,
    },
    plugins: [productionPlugin, CleanPlugin],
  },
  {
    target: "browserslist:production",
    mode: "production", // development | production
    entry: {
      bundle: "./client/index.jsx",
    },
    output: {
      path: path.resolve("dist"),
      publicPath: config.ROOTPATH,
      filename: "[name].[contenthash].js",
    },
    module: {
      rules: [
        {
          test: /\.m?jsx?$/,
          use: {
            loader: "babel-loader",
            options: {
              sourceType: "unambiguous",
              presets: [
                [
                  "@babel/preset-env",
                  {
                    browserslistEnv: "production",
                    modules: false,
                    useBuiltIns: "usage",
                    corejs: 3,
                  },
                ],
                "@babel/preset-react",
              ],
              plugins: ["@babel/plugin-proposal-class-properties"],
            },
          },
          exclude: /node_modules/,
        },
        {
          test: /\.(sa|sc|c)ss$/,
          use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
        },
        {
          test: /\.(png|svg|jpg|gif|eot|woff|ttf)$/,
          use: [
            {
              loader: "file-loader",
              options: {
                name: "assets/[name].[ext]",
                esModule: false,
              },
            },
          ],
          type: "javascript/auto",
        },
      ],
    },
    resolve: {
      // ... rest of the resolve config
      fallback: polyfill,
    },
    plugins: [
      productionPlugin,
      CleanPlugin,
      new FaviconsWebpackPlugin({
        logo: "./logos/ukraine.png",
        mode: "webapp",
        manifest: "./manifest.json",
      }),
      new CopyWebpackPlugin({
        patterns: [{ from: "client/statics", to: "" }],
      }),
      new workboxPlugin.InjectManifest({
        swSrc: "./sw/index.js",
        swDest: `service-worker.js`,
      }),
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // both options are optional
        filename: "[name].[contenthash].css",
        chunkFilename: "[id].css",
      }),
      new WebpackManifestPlugin({
        fileName: "assets.json",
      }),
    ],
  },
  {
    target: "node",
    mode: "production",
    entry: "./client/index_server.jsx",
    output: {
      path: path.resolve("dist"),
      libraryTarget: "commonjs2",
      filename: "bundle_server.js",
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          use: {
            loader: "babel-loader",
            options: {
              sourceType: "unambiguous",
              presets: [
                [
                  "@babel/preset-env",
                  {
                    browserslistEnv: "node",
                    useBuiltIns: "usage",
                    corejs: 3,
                  },
                ],
                "@babel/preset-react",
              ],
              plugins: ["@babel/plugin-proposal-class-properties"],
            },
          },
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [productionPlugin, CleanPlugin],
  },
];
