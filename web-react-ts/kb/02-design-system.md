# Design system — `web-react-ts/`

The complete design system lives in two CSS files. Read them before adding any
visual primitive.

- `src/color-theme.css` — Chakra-style CSS variables, light/dark theme, custom
  Bootstrap button overrides, brand accent.
- `src/index.css` — global utility classes (`.page-container`, `.bg`,
  `.profile-img`, etc.).

## Typography

- Font: **Inter** for both heading and body (`--chakra-fonts-heading`,
  `--chakra-fonts-body`).
- Do not introduce new web fonts.

## Theming

- `data-bs-theme` attribute on `<html>` toggles light/dark via Bootstrap 5.
- Semantic tokens defined per theme:
  - `--icon`, `--bg-card`, `--text-primary`, `--accent-color`
- Feature accents (use these instead of inventing colours):
  - `--members-accent: #68e0d7`
  - `--churches-accent`
  - `--arrivals-accent`
  - `--defaulters-accent`
  - `--banking-accent`
  - `--campaigns-accent`
  - `--maps-accent`
- Campaign-specific accents (used by their respective dashboards):
  - `--equipment`, `--antibrutish`, `--multiplication`, `--swollensunday`,
    `--shepherdingcontrol`, `--sheepseeking`
- Brand accent: `--custom-color-accent-{50…900}` (pink/red scale).

## Colour palette

A full Chakra-style palette is defined on `:root`: gray, red, orange, yellow,
green, teal, blue, cyan, purple, pink, each with shades 50–900. Use these via
the CSS variable names rather than hardcoding hex values.

## Buttons

Both themes define custom Bootstrap button variants. Use them via Bootstrap's
`variant` prop on react-bootstrap `<Button>` or via `className`:

- `btn-success`, `btn-danger`, `btn-primary`, `btn-warning`, `btn-secondary`
- `btn-gray`, `btn-brand`, `btn-purple`
- `btn-outline-success`, `btn-outline-danger`, `btn-outline-primary`,
  `btn-outline-warning`, `btn-outline-brand`, `btn-outline-purple`,
  `btn-outline-secondary`, `btn-outline-gray`

Plus the in-house wrappers in `src/components/buttons/`:
- `AuthButton`, `EditButton`, `MenuButton`, `PlusMinusSign`, `ChurchButton`,
  `ViewAll`.

## Components to reuse before writing new ones

If your idea matches one of these, reuse it. Don't re-invent.

| Need | Use |
| --- | --- |
| Page wrapper | `components/base-component/PageContainer` |
| Loading screen | `components/base-component/LoadingScreen` |
| Error screen | `components/base-component/ErrorScreen` |
| Apollo loading + error wrapper | `components/base-component/ApolloWrapper` |
| Generic spinner | `components/SpinnerPage` |
| H1 / H2 | `components/HeadingPrimary`, `components/HeadingSecondary` |
| Currency display | `components/CurrencySpan` |
| Search a Member | `components/formik/SearchMember` |
| Search a `<ChurchLevel>` | `components/formik/Search<Level>` (Bacenta, Campus, Council, CreativeArts, Fellowship, Governorship, Hub, HubCouncil, HubFellowship, Member, Ministry, Stream) |
| Image upload | `components/formik/ImageUpload` (single) or `MultiImageUpload` |
| File upload | `components/formik/FileUpload` |
| Formik input | `components/formik/Input` |
| Formik select | `components/formik/Select`, `SelectWithQuery` |
| Formik checkbox group | `components/formik/CheckboxGroup`, `CheckboxWithQuery` |
| Formik radio | `components/formik/RadioButtons` |
| Combo box | `components/formik/Combobox` |
| Submit button text states | `components/formik/BtnSubmitText` |
| Cloudinary image | `components/CloudinaryImage` |
| Generic table | `components/TableFromArrays` |
| Member roles list | `components/MemberRoleList` |
| Display church details | `components/DisplayChurchDetails` |
| Display church list | `components/DisplayChurchList` |
| Modal | `hooks/useModal` |
| Popup | `components/Popup`, `hooks/usePopup` |
| Pie chart | `components/pie-chart` |
| Time series / line / bar | `recharts` (`components/ChurchGraph`) |
| Church-level switching | `hooks/useChurchLevel`, `hooks/useSontaLevel` |
| Map view | `pages/maps/...` (uses `@react-google-maps/api`) |

## What not to add

- Tailwind utility classes (no Tailwind in the build).
- A new icon library — use `react-bootstrap-icons` or `react-icons` (already
  installed).
- A new modal library — use `react-bootstrap` `<Modal>` via `useModal`.
- A new toast library — use `notistack` (already wired into the Apollo error
  link).
