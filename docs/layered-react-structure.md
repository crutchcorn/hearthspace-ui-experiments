# Layered React Structure

Use the [project skill](../.agents/skills/layered-react-structure/SKILL.md) when
organizing or reviewing a React feature. It explains where to put view
orchestration, presentation, reusable hooks, and I/O.

Run `pnpm lint` to check those boundaries. The [ESLint configuration](../eslint.config.js)
adds `lrs-eslint-plugin`'s recommended preset alongside the existing rules.
The preset checks imports and I/O in `src/components/` today and recognizes
LRS paths such as `views/`, `hooks/`, `services/`, and `utils/` as features adopt
them. It also checks `.view.tsx` composition and limits each folder to one
`.view` source file and one `.logic.ts` file. The recommended preset lets the
playground adopt layers feature by feature within its existing layout.

Import checks read module specifiers. Review opaque aliases and indirect barrel
exports during code review. The boundary rules skip tests, specs, stories, and
test support files. See the [plugin documentation](https://www.npmjs.com/package/lrs-eslint-plugin)
for the individual rule scopes.

The skill is copied verbatim from [upstream revision `b94a120`](https://github.com/crutchcorn/layered-react-structure/tree/b94a12026347b60829f15cb9a5a843050ee8a030/skills/layered-react-structure).
To update it, replace the project copy with `skills/layered-react-structure/SKILL.md`
from the chosen upstream revision and update this link.
