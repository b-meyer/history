# history

One static site with two views, `/map` and `/wiki`, over a shared knowledge graph of people, works, places and events. Every claim on the map carries its sources and a graded confidence. The claims are researched and compiled with AI assistance from the sources they cite, and checked by automated audits before they publish.

## Commands

Run from the repo root with Vite+ (`vp`):

| Command        | Does                                |
| -------------- | ----------------------------------- |
| `vp install`   | Install dependencies                |
| `vp run dev`   | Start the site dev server           |
| `vp run build` | Build the site to `apps/site/dist/` |
| `vp check`     | Format, lint and type-check         |
| `vp run test`  | Run the tests                       |
| `vp run ready` | Check, test and build before a push |

## Deploy

The site deploys to an Azure Static Web App. The Bicep templates are in `infra/` and the workflows in `.github/workflows/`; CI runs `vp run ready` on every pull request, and the deploy workflow runs only when started by hand.

To set it up in a new subscription:

1. Provision the resources with `az deployment sub create --location centralus --template-file infra/main.bicep`.
2. Copy the Static Web App's deployment token into the repo secret the deploy workflow reads, with `gh secret set <name> --body "$(az staticwebapp secrets list --name <app> --query properties.apiKey -o tsv)"`, so the token never prints.
