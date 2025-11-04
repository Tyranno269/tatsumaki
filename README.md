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
create_table "accounts", primary_key: "account_id", comment: "User accounts" do |t|
  t.string "name", limit: 100, null: false, comment: "Account name"
  t.string "status", default: "active", null: false
  t.boolean "enabled", default: true
  t.integer "max_users", default: 10
  t.references "company", type: :uuid, null: false
  t.references "organization", foreign_key: { to_table: :companies }, null: false
  t.decimal "balance", precision: 10, scale: 2
  t.timestamps null: false
end

create_table "posts", id: :uuid do |t|
  t.string "title", null: false
  t.references "account", null: false
  t.timestamps
end

create_table "logs", id: false do |t|
  t.string "message"
  t.jsonb "metadata"
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
  model Account {
    account_id: int64;
    name: string; // Account name (limit: 100)
    status: string; // default: "active"
    enabled?: boolean; // default: true
    max_users?: int32; // default: 10
    company_id: string; // ref: company
    organization_id: int64; // ref: companies
    balance?: string; // precision: 10, scale: 2
    created_at: utcDateTime;
    updated_at: utcDateTime;
  }

  model Post {
    id: string;
    title: string;
    account_id: int64; // ref: account
    created_at?: utcDateTime;
    updated_at?: utcDateTime;
  }

  model Log {
    message?: string;
    metadata?: unknown;
  }
}
```

## Features

- **Smart Detection**: Finds `schema.rb` in various project structures
- **Type Mapping**: Rails → TypeSpec types (string, int32, int64, utcDateTime, etc.)
- **Custom Primary Keys**: Handles `primary_key: "account_id"` and `id: false`
- **Default Values**: Extracts primitive defaults (string, number, boolean) to comments
- **References**: Converts `t.references` to foreign key fields with accurate table references
- **Timestamps**: Expands `t.timestamps` to individual fields
- **Comments**: Preserves table and column comments
- **Metadata**: Includes precision/scale, limits, and constraints
- **Safety**: Prevents accidental overwrites, detects duplicates

## Supported Rails Features

- All standard column types (string, integer, bigint, decimal, boolean, etc.)
- Custom primary key types (`id: :uuid`, `primary_key: "account_id"`, `id: false`)
- References with custom types (`type: :uuid`) and foreign key options (`to_table: :companies`)
- Timestamps with null constraints
- Table and column comments
- Default values for primitive types (string, number, boolean)
- Precision/scale for decimals
- String limits

## Advanced Examples

### Custom Primary Keys
```ruby
# Single custom primary key
create_table "accounts", primary_key: "account_id" do |t|
  # Generates: account_id: int64;

# UUID primary key
create_table "posts", id: :uuid do |t|
  # Generates: id: string;

# No primary key
create_table "join_table", id: false do |t|
  # No id field generated
```

### Default Values
```ruby
t.string "status", default: "active"     # → default: "active"
t.boolean "enabled", default: true       # → default: true
t.integer "count", default: 0            # → default: 0
t.datetime "expires", default: -> { ... } # → ignored (complex default)
```

### Foreign Key References
```ruby
t.references "user"                                    # → // ref: user
t.references "author", foreign_key: { to_table: :people } # → // ref: people
t.references "company", type: :uuid                    # → company_id: string; // ref: company
```

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
