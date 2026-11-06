# Database Schema

Postgres on Supabase. All tables live in `public`. Each feature owner writes the migrations for their own tables (`supabase migration new <name>`).

Diagram: [schema-diagram.md](schema-diagram.md).

## Conventions

- Primary keys: `bigint generated always as identity`, except `profiles.id` (`uuid`, matches `auth.users.id`).
- Timestamps: `timestamptz not null default now()`.
- Every foreign key gets an index.
- RLS is enabled on every table. No table ships without policies.
- Names are `snake_case`. Table names are plural.

## Dining (owner: Kyle)

### `dining_halls`

| column | type   | notes                                    |
| ------ | ------ | ---------------------------------------- |
| id     | bigint | PK                                       |
| slug   | text   | unique, e.g. `ffc`, `nolans`, `levering` |
| name   | text   | not null                                 |

### `nutrislice_menus`

Maps each Nutrislice menu (one school plus one menu type) to a hall. A hall can have several. The ingest loops over this table.

| column         | type             | notes                                                                |
| -------------- | ---------------- | -------------------------------------------------------------------- |
| id             | bigint           | PK                                                                   |
| dining_hall_id | bigint           | FK `dining_halls`                                                    |
| school_slug    | text             | not null, e.g. `nolans-on-33rd`, `site-1`                            |
| menu_type_slug | text             | not null, e.g. `nolans-dinner-2`                                     |
| meal           | `meal_type` enum | nullable, `breakfast`, `lunch`, `dinner`. Null for Levering kitchens |
| label          | text             | not null, e.g. "Red Lantern Kitchen"                                 |

- Unique: `(school_slug, menu_type_slug)`.
- Fetch URL: `https://hopkinsdining.api.nutrislice.com/menu/api/weeks/school/{school_slug}/menu-type/{menu_type_slug}/{yyyy}/{mm}/{dd}/`

### `dishes`

| column             | type        | notes                                       |
| ------------------ | ----------- | ------------------------------------------- |
| id                 | bigint      | PK                                          |
| nutrislice_food_id | bigint      | unique, `food.id`, dedupe key for ingest    |
| name               | text        | not null                                    |
| calories           | numeric     | nullable, `rounded_nutrition_info.calories` |
| protein_g          | numeric     | nullable, `g_protein`                       |
| carbs_g            | numeric     | nullable, `g_carbs`                         |
| fat_g              | numeric     | nullable, `g_fat`                           |
| serving_size       | text        | nullable, e.g. `1 oz`                       |
| dietary_tags       | text[]      | not null default `'{}'`, from `food.icons`  |
| created_at         | timestamptz |                                             |

### `menu_items`

One row per dish served on a Nutrislice menu on a date.

| column             | type   | notes                                               |
| ------------------ | ------ | --------------------------------------------------- |
| id                 | bigint | PK                                                  |
| nutrislice_menu_id | bigint | FK `nutrislice_menus`                               |
| dish_id            | bigint | FK `dishes`                                         |
| served_on          | date   | not null                                            |
| station            | text   | nullable, from the preceding `is_section_title` row |

- Unique: `(nutrislice_menu_id, dish_id, served_on)`. Ingest upserts on it.
- Index: `(nutrislice_menu_id, served_on)` for the landing page query.
- Ingest skips rows where `is_section_title` is true or `food` is null.

### `dish_alerts`

| column     | type        | notes         |
| ---------- | ----------- | ------------- |
| user_id    | uuid        | FK `profiles` |
| dish_id    | bigint      | FK `dishes`   |
| created_at | timestamptz |               |

- PK: `(user_id, dish_id)`.

### RLS

- `dining_halls`, `nutrislice_menus`, `dishes`, `menu_items`: readable by everyone. Only the ingest job writes to them, using the service role key on the server, never the client.
- `dish_alerts`: a user can select, insert and delete only their own rows.

## Add + Rank (owner: Jonny)

### `comparisons`

Raw log of every "X or Y" answer.

| column         | type        | notes         |
| -------------- | ----------- | ------------- |
| id             | bigint      | PK            |
| user_id        | uuid        | FK `profiles` |
| winner_dish_id | bigint      | FK `dishes`   |
| loser_dish_id  | bigint      | FK `dishes`   |
| created_at     | timestamptz |               |

- Check: `winner_dish_id <> loser_dish_id`.

### `rankings`

A user's ranked list. One row per dish the user has ranked.

| column     | type        | notes                                   |
| ---------- | ----------- | --------------------------------------- |
| user_id    | uuid        | FK `profiles`                           |
| dish_id    | bigint      | FK `dishes`                             |
| score      | numeric     | not null, the owner picks the algorithm |
| comment    | text        | nullable                                |
| created_at | timestamptz |                                         |
| updated_at | timestamptz |                                         |

- PK: `(user_id, dish_id)`.
- Check: `score` is finite (no `NaN` or `Infinity`).
- Index: `(user_id, score desc)` for the "My list" page.

### `dish_scores`

Global score per dish, used to sort the landing page. Build it as a view or a materialized view over `rankings`.

| column       | type    | notes |
| ------------ | ------- | ----- |
| dish_id      | bigint  |       |
| avg_score    | numeric |       |
| num_rankings | int     |       |

### RLS

- `comparisons`: a user can insert and select only their own rows.
- `rankings`: readable by everyone (profiles and the feed show them). A user can insert, update and delete only their own rows.

## Auth + Profile + Social (owner: Lucas, Amy)

### `profiles`

| column       | type        | notes                                   |
| ------------ | ----------- | --------------------------------------- |
| id           | uuid        | PK, FK `auth.users` `on delete cascade` |
| username     | text        | unique, not null, not blank             |
| display_name | text        |                                         |
| avatar_url   | text        | path in the Storage bucket `avatars`    |
| created_at   | timestamptz |                                         |

- Create the row with a trigger on `auth.users` insert.
- Restrict sign-up to JHU accounts in the auth config. The schema doesn't enforce it.

### `follows`

| column      | type        | notes         |
| ----------- | ----------- | ------------- |
| follower_id | uuid        | FK `profiles` |
| followee_id | uuid        | FK `profiles` |
| created_at  | timestamptz |               |

- PK: `(follower_id, followee_id)`.
- Check: `follower_id <> followee_id`.
- Index: `followee_id`.

### Feed

No table. Query `rankings` joined with `follows` where `follower_id = auth.uid()`, ordered by `updated_at desc`. Add an index on `rankings (updated_at desc)` if the query is slow.

### RLS

- `profiles`: readable by everyone. A user can update only their own row.
- `follows`: readable by everyone. A user can insert and delete only rows where `follower_id = auth.uid()`.

## Workflow

1. Write the migration in `supabase/migrations/`.
2. Test it locally with `supabase db reset`.
3. Regenerate types with `supabase gen types typescript --local > lib/supabase/database.types.ts`.
4. Open a PR. Don't apply migrations to the remote project by hand.
