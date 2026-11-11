# Schema Diagram

Visual version of [database-schema.md](database-schema.md). Renders on GitHub, or in VS Code with a Mermaid preview extension.

Each line goes from a PK to the FK that references it. `||--o{` means one to many, and `||--||` means one to one.

```mermaid
erDiagram
    auth_users ||--|| profiles : "id"
    profiles ||--o{ follows : "follower_id"
    profiles ||--o{ follows : "followee_id"
    profiles ||--o{ dish_alerts : "user_id"
    profiles ||--o{ comparisons : "user_id"
    profiles ||--o{ rankings : "user_id"

    dining_halls ||--o{ nutrislice_menus : "dining_hall_id"
    nutrislice_menus ||--o{ menu_items : "nutrislice_menu_id"

    dishes ||--o{ menu_items : "dish_id"
    dishes ||--o{ dish_alerts : "dish_id"
    dishes ||--o{ comparisons : "winner_dish_id"
    dishes ||--o{ comparisons : "loser_dish_id"
    dishes ||--o{ rankings : "dish_id"
    rankings }o--|| dish_scores : "view: grouped by dish_id"

    auth_users {
        uuid id PK "Supabase Auth, not ours"
    }

    profiles {
        uuid id PK,FK
        text username UK
        text display_name
        text avatar_url
        timestamptz created_at
    }

    follows {
        uuid follower_id PK,FK
        uuid followee_id PK,FK
        timestamptz created_at
    }

    dining_halls {
        bigint id PK
        text slug UK
        text name
    }

    nutrislice_menus {
        bigint id PK
        bigint dining_hall_id FK
        text school_slug UK "unique with menu_type_slug"
        text menu_type_slug UK
        meal_type meal "null for Levering kitchens"
        text label
    }

    dishes {
        bigint id PK
        bigint nutrislice_food_id UK
        text name
        numeric calories
        numeric protein_g
        numeric carbs_g
        numeric fat_g
        text serving_size
        text_array dietary_tags
        timestamptz created_at
    }

    menu_items {
        bigint id PK
        bigint nutrislice_menu_id FK "unique with dish_id, served_on"
        bigint dish_id FK
        date served_on
        text station
    }

    dish_alerts {
        uuid user_id PK,FK
        bigint dish_id PK,FK
        timestamptz created_at
    }

    comparisons {
        bigint id PK
        uuid user_id FK
        bigint winner_dish_id FK
        bigint loser_dish_id FK
        timestamptz created_at
    }

    rankings {
        uuid user_id PK,FK
        bigint dish_id PK,FK
        numeric score
        text comment
        timestamptz created_at
        timestamptz updated_at
    }

    dish_scores {
        bigint dish_id "view, not a table"
        numeric avg_score
        int num_rankings
    }
```
