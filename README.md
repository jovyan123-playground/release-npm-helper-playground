# release-npm-helper

## TODO
- Find [workspace packages](https://github.com/jupyterlab/jupyterlab/blob/9f50c45b39e289072d4c18519ca29c974c226f69/buildutils/src/utils.ts#L16) for lerna support
- Publish package(s) to a [verdaccio server](https://github.com/facebook/create-react-app/blob/7e4949a20fc828577fb7626a3262832422f3ae3b/tasks/verdaccio.yaml)
- Incorporate jupyterlab [publish script](https://github.com/jupyterlab/jupyterlab/blob/532eb4161c01bc7e93e86c4ecb8cd1728e498458/buildutils/src/publish.ts) to pick up `dist-tag` cleanup
- To test installation of package(s), create a temporary npm package and install/require the new package(s)
