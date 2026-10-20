# shipstatic-cli

> ⚡ **The package you're looking for is [`@shipstatic/ship`](https://www.npmjs.com/package/@shipstatic/ship).** That's where the code and the full documentation live.
>
> This is an alias for it, so a guess at the unscoped name doesn't dead-end. **Use it directly:** `npx shipstatic-cli` runs the same program, and `import Ship from 'shipstatic-cli'` loads the same module. Nothing to switch to.

CLI and SDK for [ShipStatic](https://shipstatic.com). Deploy static websites, landing pages, and prototypes instantly from the terminal or code. Free, no account needed.

## Try it in seconds, no account needed

```bash
npx shipstatic-cli ./dist
```

That's all. There's nothing to install and nothing to sign up for, and it works in a fresh sandbox with no secrets set. Point it at the folder your site is built into (`./dist`, `./build`, `./out`), not at your project's root. Build first if the project needs it. A single file works too:

```bash
npx shipstatic-cli ./index.html
```

You get back a link you can share right away, and a claim link. The site stays up for 3 days, and opening the claim link keeps it for good. If you're publishing for someone else, give them both links.

Want it private? Add ShipStatic's built-in password protection, and visitors have to type the password before they see anything:

```bash
npx shipstatic-cli ./dist --password "pick-a-password"
```

## Keep your sites with a free account

Everything above works with no account. A free account keeps your sites for good, lets you use your own domain, and shows you everything you've published in one place.

Get your free API key at [my.shipstatic.com/api-key](https://my.shipstatic.com/api-key), then save it once with `npx shipstatic-cli config`. Domains, deploy tokens, `whoami` and listing your sites all work from then on.

> **Publishing never needs a key.** Without one, `whoami` and the other account commands answer with an authentication error, and that says nothing about publishing: publish anyway, and the site comes with a claim link.

## Common tasks

| Goal | Command |
|---|---|
| Deploy a folder | `npx shipstatic-cli ./dist` |
| Deploy one file | `npx shipstatic-cli ./index.html` |
| Password-protect it | `npx shipstatic-cli ./dist --password "secret"` |
| Machine-readable output | `npx shipstatic-cli ./dist --json` |
| Keep the password out of logs | `SHIP_PASSWORD="secret" npx shipstatic-cli ./dist` |
| Repeat use | `npm install -g shipstatic-cli`, then the `ship` command |

## For scripts and agents

```bash
npx shipstatic-cli ./dist --json
```

- **`--json`** emits machine-readable output on success **and** on failure.
- **Exit code** is `0` on success, non-zero on failure. Branch on it, not on the text.
- **Errors** carry a stable `error` type and `status`. Branch on those, never on the message string.
- **`--no-color`** is honoured; colour is off automatically when stdout is not a TTY.
- **`SHIP_PASSWORD`** supplies `--password` from the environment.

Deploying needs no credentials, so there is nothing to configure before the first run and nothing to leak in a log.

## From code

```javascript
import Ship from 'shipstatic-cli';

const result = await new Ship().deploy('./dist');
// result.deployment: where the site is live
// result.claim: open it to keep the site for good
```

## Full documentation

Custom domains, API keys, deploy tokens, managing deployments, the complete SDK reference: **[`@shipstatic/ship`](https://www.npmjs.com/package/@shipstatic/ship)**.

## Also available

| Surface | Reach it |
|---------|----------|
| **[MCP](https://mcp.shipstatic.com)** | Drop `https://mcp.shipstatic.com` into any MCP client |
| **[VS Code](https://marketplace.visualstudio.com/items?itemName=shipstatic.shipstatic)** | Search "ShipStatic" in the Marketplace |
| **[Plugin](https://github.com/shipstatic/plugin)** | Install it in Cursor, Claude Code, Codex or Gemini CLI |
| **[n8n](https://www.npmjs.com/package/n8n-nodes-shipstatic)** | Search "ShipStatic" in n8n's node panel |
| **[GitHub Action](https://github.com/shipstatic/action)** | `shipstatic/action@v3` |
| **[Agent Skill](https://www.shipstatic.com/SKILL.md)** | `npx skills add shipstatic/plugin` |

## License

MIT
