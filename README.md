# OKlChroma

Oklchroma is a color pattern generator that helps designers and developers create harmonious color scales based on the OKLCH color space. Instead of manually defining each shade, Oklchroma generates a complete set of color variables based on a single base color and using mathematical formulas in CSS to generate the rest of the colors.

## Why create this?
<p>While I still believe that a handmade color pattern is far more superior, I got this idea from a talk I saw at <a href="https://www.youtube.com/watch?v=su6WA0kUUJE" target="_blank">CSS Day 2024 by Matthias Ott</a>. It uses trigonometric functions in CSS to adjust the lightness of the primary input. The cleaver thing that was explained in the presentation is that a trigonometric function (sin()) is used to adjust the Chroma.</p>
                <p>I thought this idea was so clever and was curious how it would work with different color inputs and this is how that little idea was born.</p>

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `pnpm install`             | Installs dependencies                            |
| `pnpm dev`             | Starts local dev server at `localhost:4321`      |
| `pnpm build`           | Build your production site to `./dist/`          |
| `pnpm preview`         | Preview your build locally, before deploying     |
| `pnpm astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `pnpm astro -- --help` | Get help using the Astro CLI                     |
