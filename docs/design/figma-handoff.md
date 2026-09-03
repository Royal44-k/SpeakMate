# SpeakMate Figma handoff

## File

- Draft file: https://www.figma.com/design/4jL93nZEN69WJm8bGRVrft
- File name: `SpeakMate — Dialogue Stage PWA`
- Status: the blank editable file was created successfully. Further MCP writes were blocked by the Figma Starter free-plan call limit. No paid upgrade was activated.

## Variables to create

Create a `SpeakMate / Core` variable collection with one `Default` mode:

| Variable | Type | Value | Scope |
| --- | --- | --- | --- |
| `color/atlantic/950` | Color | `#0B2A43` | Frame and shape fill |
| `color/atlantic/800` | Color | `#123B5D` | Frame, shape and text fill |
| `color/sky/100` | Color | `#DDEFFD` | Frame and shape fill |
| `color/coral/500` | Color | `#FF6B5E` | Frame and shape fill |
| `color/ink/950` | Color | `#14202B` | Text fill |
| `color/ink/500` | Color | `#61717D` | Text fill |
| `color/paper` | Color | `#FFFDF8` | Frame and shape fill |
| `space/1` … `space/10` | Number | `4, 8, 12, 16, 20, 24, 32, 40` | Gap and padding |
| `radius/sm`, `radius/md`, `radius/lg` | Number | `10, 16, 24` | Corner radius |

## Text styles

- `Display/Stage`: Barlow Condensed ExtraBold, 42/42, -1%.
- `Display/Page`: Barlow Condensed Bold, 34/36, -1%.
- `UI/Body`: Inter Regular, 16/25.
- `UI/Label`: Inter Semi Bold, 14/20.
- `UI/Caption`: Inter Medium, 12/18.

## Components

1. `Action/Button`: `Kind=Primary|Secondary|Ghost`, `State=Default|Pressed|Disabled`; minimum 48 px high.
2. `Navigation/Bottom item`: `Destination=Practice|Scenes|Me`, `State=Default|Current`; 64 px wide minimum.
3. `Scene/Card`: image, category, bilingual title, level and duration.
4. `Practice/Stage header`: category, progress and exit action.
5. `Practice/Transcript`: role label, English text, replay action and expandable Chinese help.
6. `Practice/Speech control`: `State=Idle|Recording|Processing|Denied`; 88 px central action.
7. `Feedback/Sheet`: original text, correction, natural alternative and one short explanation.

## Practice frame recipe

Create `Practice / Hotel check-in / B1` at 390 × 844 with vertical Auto Layout:

1. Atlantic immersive header, 390 × 306, containing a 390 × 236 hotel image with bottom tonal overlay.
2. Metadata row at 24 px side padding: `TRAVEL · B1` and `2 / 6`.
3. English AI line in Barlow Condensed ExtraBold 38/39, maximum 3 lines.
4. Paper conversation surface with 24 px padding and 24 px top corners.
5. One coral speech control centered in the thumb zone; keyboard entry remains visible below.
6. Bottom navigation respects 34 px iPhone safe-area allowance.

This node map is mirrored by `src/styles/tokens.css` and the app-shell components so the design and implementation can be synchronized after the free-plan limit resets.
