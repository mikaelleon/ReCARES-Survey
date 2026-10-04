# Design (plain language)

This page explains **why the site looks and reads the way it does**, without requiring you to edit CSS. Developers who need tokens and component recipes should use the [design system](DESIGN-SYSTEM.md).

---

## Who the look is for

The first readers are **residents of Camella Homes Tibig**, including older homeowners and people who are not comfortable with busy websites. The design favors:

- Large, obvious buttons
- Plain instructions (“what do I do next?”)
- High contrast between text and background
- A calm page, not a marketing landing page

The **research team** uses a related look (emerald chrome, same type) but a different frame: a sidebar workspace, not the resident navigation bar. That split is on purpose so residents are not invited into login screens.

---

## Colors you will notice

| Color | Role in everyday words |
| --- | --- |
| Dark emerald | The “ReCARES” bar, footer, admin sidebar — the brand |
| Harvest orange | Main actions (“Start the survey”, primary buttons) |
| Bright amber | Selection, focus, and dark-mode accents |
| Warm off-white / near-black | Page background in light / dark mode |
| Red | Errors only (“this field is required”) — never the only clue; there is always text |

Charts reuse emerald and orange in a fixed order so a printout of the dashboard still matches the site.

---

## Type and “shouting”

- **Sentence case** for headlines and paragraphs: “About your household”.
- **Uppercase** for small labels, section eyebrows, navigation, and button labels. That is a system, not random shouting.
- The **ReCARES** word on the homepage is letters in color, not a logo file.

---

## Light and dark

The moon button switches theme. The choice is remembered in that browser (`recares-theme`). Dark mode is not a different product; it is the same pages with safer contrast on a dark canvas (headlines go to a light mint so emerald-on-black does not fail).

---

## Motion and loading

- Theme and page background shift quickly, not a long animation.
- Admin pages use a structured **loader** (skeleton of the workspace) instead of a lone “Loading…” word, so it is clear the app is still the same product.
- Overlays (drawers, dialogs) sit above the whole window, including the sidebar.

---

## Forms

- Required questions have a **red asterisk** and a written error.
- Helper text sits with the field.
- Checkboxes and dropdowns are sized for a finger on a phone.
- Emoji are not used. Icons are simple line drawings.

---

## Two shells

| Shell | Where | Navigation |
| --- | --- | --- |
| Resident | Homepage, survey, thank-you | Home, About, FAQ, Start the survey |
| Proponent | `/admin/…` | Dashboard, Responses, Interviews, Members |

Admin entry on the public site is only **Proponent access** in the footer.

---

## Photographs and files

Hero photography lives in `public/images/`. Notes: [public/images/README.md](../public/images/README.md).

An older visual kit under `/layout` is an **archive** of an earlier design export. The running website uses `styles/` and `components/`. Prefer this page and [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) over the archive if they disagree.

---

## Related reading

- [For residents](for-residents.md)
- [Design system (technical)](DESIGN-SYSTEM.md)
