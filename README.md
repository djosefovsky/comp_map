# New Map Template

## Getting Started

**[Use this template to create a your own repository.](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template#creating-a-repository-from-a-template)**

If you haven't already, you'll need to create accounts for these services:
- [Mapbox](https://www.mapbox.com/signup/)
- [GitHub](https://github.com)

You will need to [configure GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) to use the `main` branch and the `/docs` folder.

**The easiest way to start is by simply creating a [GitHub Codespace](https://github.com/features/codespaces) using this repository.**

### Running locally
**If you are not using Codespaces**, to run locally you'll need to have the following dependencies installed:
- [Node.js](https://nodejs.org/)
- [Git](https://github.com/git-guides/install-git)
- [VS Code](https://code.visualstudio.com/)

After installing Git for the first time, you'll need to configure it by running the following from the [VS Code integrated terminal](https://code.visualstudio.com/docs/terminal/basics) (replace the quoted text with your name/email address):
```sh
git config --global user.name "<your name>"
git config --global user.email "<your email>"
```

Then setup VSCode to start working:
- Install the [GitHub Pull Requests and Issues VSCode Extension](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-pull-request-github)
- [Clone the repository](https://code.visualstudio.com/docs/sourcecontrol/github#_cloning-a-repository) you've created from this template using VS Code
- [Sign into GitHub with VS Code](https://code.visualstudio.com/docs/sourcecontrol/github#_getting-started-with-github-pull-requests-and-issues)
- Install the package dependencies by running the following from the root directory of your cloned repository:
```
npm install
```

### Mapbox API Key
In order to use Mapbox services, you'll need to insert your Mapbox public access token ([which can be found here](https://www.mapbox.com/account/)) into [`src/settings.json`](https://github.com/robgaston/new_map/blob/main/src/settings.json#L3).

## Development
To start the app, run the following from the root directory of your cloned repository:
```
npm start
```

The application should now be running at http://localhost:1234/ (see forwarded ports if using Codespaces).

Changes that you make to javascript and CSS files will be automatically refreshed.

## Building
Before deploying, you must first build the website by running the following command from the root directory: 
```
npm run build
```

## Deployment
To deploy your latest code to the web, simply build (as per above) then commit and push your changes to the `main` branch in Github.
