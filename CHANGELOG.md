# Changelog

## [1.0.0] - 2025-11-06

### Added

- **Rails schema.rb parser**: Automatically generates TypeSpec models from Rails database schema
- **Smart schema detection**: Uses fast-glob to find `db/schema.rb` in monorepo structures
- **Comprehensive type mapping**: Rails types → TypeSpec types (string, int32, int64, utcDateTime, etc.)
- **Custom primary key support**: Handles `primary_key: "account_id"` and `id: false` tables
- **Default value parsing**: Extracts primitive default values (string, number, boolean) to comments
- **Enhanced foreign key references**: Supports `foreign_key: { to_table: :companies }` for accurate reference mapping
- **References support**: `t.references` → `user_id: int64 // ref: user` with custom type support
- **Timestamps expansion**: `t.timestamps` → `created_at` + `updated_at` fields
- **Comment preservation**: Table and column comments mapped to TypeSpec comments
- **Metadata extraction**: Precision/scale for decimals, limit for strings
- **CLI options**:
  - `--force`: Overwrite existing files
  - `--append`: Append new models to existing files (duplicate detection)
  - `--out <path>`: Custom output file path
- **Safety features**:
  - Prevents accidental overwrites by default
  - Alphabetical model sorting for stable diffs
  - Duplicate model detection in append mode

### Technical

- TypeScript with ESM modules
- Vitest for testing (migrated from Jest for better ESM support)
- Fast-glob for flexible file discovery
- Minimist for CLI argument parsing
- Comprehensive test coverage with 10 test cases covering all major Rails schema patterns
- Type safety improvements with proper TypeScript interfaces
- Enhanced error handling and edge case coverage

### Features

- **Table parsing**: Handles tables with/without comments, custom id types, `id: false`
- **Field parsing**: All Rails column types, nullable detection, references with custom types
- **PascalCase conversion**: `user_profiles` → `UserProfile`
- **Singularization**: `cities` → `City`
- **Error handling**: Clear error messages for missing schema files
