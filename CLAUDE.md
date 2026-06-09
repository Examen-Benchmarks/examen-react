# examen-react

## Stack
- **React 19** + **Vite 8** + **TypeScript** (strict, `verbatimModuleSyntax`, bundler resolution)
- Data: **TanStack Query** · **axios** · **zod**
- Styling: **Tailwind CSS v4** (CSS-first, no `tailwind.config` — theme lives in `src/index.css` via `@theme inline`)
- Components: **shadcn/ui** — new-york style, `neutral` base, OKLCH design tokens. Components are vendored in `src/components/ui/` (edit them freely; they are ours, not a dependency).
- Animation: **Motion** (`motion/react`, successor to Framer Motion)
- Icons: **lucide-react**

## Conventions
- Path alias `@/*` → `src/*` (declared in `vite.config.ts`, `tsconfig.json`, and `tsconfig.app.json` — keep all three in sync).
- Add UI components with `npx shadcn@latest add <name> --yes`. Config is in `components.json`. If the CLI ever drops files into a literal `@/` folder, move them into `src/` (it means the alias wasn't resolved).
- Theme tokens (colours, radius, dark mode) are defined once in `src/index.css` — `:root` for light, `.dark` for dark. Dark mode is class-based: toggle `document.documentElement.classList.toggle('dark')`.
- `src/components/ui/**` is exempt from the `react-refresh/only-export-components` lint rule (shadcn co-locates variant helpers like `buttonVariants`). Don't "fix" those exports.
- Use `cn()` from `@/lib/utils` to compose class names.

## Commands
- `npm run dev` — dev server (HMR)
- `npm run build` — `tsc -b && vite build` (type-check + production build)
- `npm run lint` — eslint
- `npm run preview` — preview the production build

## Tooling notes
For UI work, the Anthropic `frontend-design` skill + Playwright/Chrome-DevTools MCP (visual self-correction) + Context7 MCP (live docs) pair well with this stack. See `~/Documents/Notes/Software/Claude Code Skills & MCPs.md`.
