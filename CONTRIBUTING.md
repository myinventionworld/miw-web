# Contributing

## Pull request titles

Titles follow [Conventional Commits](https://www.conventionalcommits.org):

```
type(scope): summary
```

- **type** is one of the list below.
- **scope** is the part of the site or repo the change is in. It is optional, but use one when
  the change has a clear home.
- **summary** is lowercase, in the imperative ("add", not "added" or "adds"), with no period at
  the end. Keep the whole title under 72 characters.

| Type | For |
|---|---|
| `feat` | Something new a visitor can see or use |
| `fix` | A bug or a wrong text, name or link |
| `perf` | Faster or lighter, nothing else changes |
| `refactor` | Code moves or changes shape, the site does not |
| `style` | Formatting only |
| `docs` | README, this file, comments |
| `test` | The smoke test and other checks |
| `build` | Next, Tailwind, TypeScript and other build config |
| `ci` | `.github/workflows` |
| `chore` | Dependencies and housekeeping |
| `revert` | Undoing an earlier change |

Scopes in use: `home`, `work`, `about`, `cover`, `team`, `console`, `webgl`, `i18n`, `seo`,
`deps`, `ci`, `docs`.

```
fix(team): spell Denys Yazan's name correctly
feat(about): put the team on orbits
perf(home): paint the flat page first on phones
chore(deps): bump motion to 14.7.1
docs: add a contributing guide
```

## Pull request descriptions

One short sentence on what changed and why, and if it helps, a few short bullets. No headers or
checklists.

If you changed anything in `locales/`, say so, because the change has to be imported to
i18nexus before the next `npm run i18n:pull` (see [Translation workflow](README.md#translation-workflow)).
