# Tatsumaki

Automatically generate TypeSpec models from Rails database schema.

## Installation

```bash
npm install @tyranno269/tatsumaki
```

## Usage

### Basic Usage

Navigate to your TypeSpec documentation directory (typically `docs/`) and run:

```bash
npx tatsumaki
```

This will:

1. Search for `db/schema.rb` in your project (supports monorepos)
2. Parse Rails table definitions
3. Generate `rails.tsp` with TypeSpec models

### CLI Options

```bash
# Overwrite existing file
npx tatsumaki --force

# Append new models to existing file
npx tatsumaki --append

# Custom output path
npx tatsumaki --out api-models.tsp

# Combine options
npx tatsumaki --out types/rails.tsp --force
```

## Project Structure

Tatsumaki works with typical Rails monorepo structures:

```
project/
├── docs/              # TypeSpec documentation
├── backend/
│   └── db/
│       └── schema.rb  # Rails schema file
└── frontend/
```

## Generated Output

### Input (Rails schema.rb)

```ruby
create_table "users", comment: "User accounts" do |t|
  t.string "name", limit: 100, null: false, comment: "Full name"
  t.string "email", null: false
  t.references "company", type: :uuid, null: false
  t.decimal "salary", precision: 10, scale: 2
  t.timestamps null: false
end

create_table "posts", id: :uuid do |t|
  t.string "title", null: false
  t.references "user", null: false
  t.timestamps
end
```

### Output (rails.tsp)

```typescript
import "@typespec/http";
import "@typespec/openapi3";
using TypeSpec.Http;

@service({ title: "Rails API" })
@server("http://localhost:3000", "api")
@route("/api/v1")
namespace Api {
  // User accounts
  model User {
    id: int64;
    name: string; // Full name (limit: 100)
    email: string;
    company_id: string; // ref: company
    salary?: string; // precision: 10, scale: 2
    created_at: utcDateTime;
    updated_at: utcDateTime;
  }

  model Post {
    id: string;
    title: string;
    user_id: int64; // ref: user
    created_at?: utcDateTime;
    updated_at?: utcDateTime;
  }
}
```

## Features

- **Smart Detection**: Finds `schema.rb` in various project structures
- **Type Mapping**: Rails → TypeSpec types (string, int32, int64, utcDateTime, etc.)
- **Primary Keys**: Auto-adds `id` field with correct type
- **References**: Converts `t.references` to foreign key fields with annotations
- **Timestamps**: Expands `t.timestamps` to individual fields
- **Comments**: Preserves table and column comments
- **Metadata**: Includes precision/scale, limits, and constraints
- **Safety**: Prevents accidental overwrites, detects duplicates

## Supported Rails Features

- All standard column types (string, integer, bigint, decimal, boolean, etc.)
- Custom primary key types (`id: :uuid`, `id: false`)
- References with custom types (`type: :uuid`)
- Timestamps with null constraints
- Table and column comments
- Precision/scale for decimals
- String limits

## Error Handling

```bash
# Schema not found
Error: rails schema.rb not found

# File exists (safety check)
Error: Output file already exists. Use --force to overwrite or --append to append.
```

## Supported Versions

- Node.js 16+
- Rails 5.1+ (bigint primary keys)
- TypeSpec 0.50+
