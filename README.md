# XploitScan Demo

**Live demo for the [XploitScan GitHub Action](https://github.com/marketplace/actions/xploitscan-security-scanner).**

This repository exists so you can see what XploitScan looks like in practice — what the PR comment reads like, how findings surface in the GitHub Security tab, and what the SARIF output feeds into.

**The code in this repo intentionally contains security vulnerabilities.** It's a fake Express app that's deliberately broken. Do not copy this code into anything real.

## What to look at

- **[Pull requests](https://github.com/bgage72590/xploitscan-demo/pulls)** — every PR is scanned by XploitScan. Look at the `XploitScan Security Report` comment at the bottom to see how findings are summarized.
- **[Security → Code scanning alerts](https://github.com/bgage72590/xploitscan-demo/security/code-scanning)** — every finding is also uploaded as a SARIF result, so it shows up as an annotation on the relevant lines in the files view.
- **`.github/workflows/xploitscan.yml`** — the one-file config that makes all of this happen.

## Run XploitScan on your own repo

```yaml
name: Security Scan
on: [push, pull_request]

permissions:
  contents: read
  security-events: write
  pull-requests: write

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: bgage72590/xploitscan-action@v1
        with:
          fail-on: critical
```

That's it. 158 security rules, SARIF output into the Security tab, and a PR comment you can't miss — out of the box, no config.

[**Try it on your own repo →**](https://xploitscan.com)

## License

MIT — but please don't actually use any of the code in this repo. It's a punching bag.
