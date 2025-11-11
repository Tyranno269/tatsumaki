# Changelog

## [1.1.3] - 2025-11-11

### Changed

- **Nullable field representation**: Changed nullable columns from optional fields to union types with null
  - `field?: type` → `field: type | null` for columns without `null: false`
  - Better matches Rails API behavior where nullable fields return `null` values instead of being omitted
  - More accurate TypeScript types for API responses

## [1.1.2] - 2025-11-07

### Changed

- **Build system migration**: Replaced TypeScript compiler (tsc) with tsdown for faster builds
  - Build time reduced from ~5s to ~2s (60% improvement)
  - Bundle size optimized with tree shaking
  - Single executable output for better CLI distribution
  - Added separate type checking with `tsc --noEmit`

### Technical

- Migrated from `tsc` to `tsdown` build system
- Updated package.json exports to use `.mjs` and `.d.mts` extensions
- Added `tsdown.config.ts` with Node.js 18 target optimization
- Enhanced CI/CD pipeline with separate type checking step
- Maintained 100% backward compatibility

## [1.1.1] - 2025-11-06

### Fixed

- **TypeSpec compilation compatibility**: Fixed `@service` decorator syntax
  - Changed `@service({ title: "Rails API" })` to `@service(#{ title: "Rails API" })`
  - Generated TypeSpec files now compile correctly with `pnpm tsp compile .`
  - Resolved TypeSpec parser error due to incorrect object syntax

## [1.1.0] - 2025-11-06

### Fixed

- **Singularization bug**: Fixed incorrect singularization for words ending in "es"
  - `company_branches` now correctly becomes `CompanyBranch` (was `CompanyBranche`)
  - Added proper Rails ActiveSupport::Inflector compatibility
  - Supports all words ending in "ches", "shes", "xes", "ses" patterns

### Changed

- **Modular architecture**: Refactored monolithic parser into specialized modules
  - `columnParser.ts`: Individual column parsing logic
  - `railsTypeMapper.ts`: Rails → TypeSpec type conversion
  - `columnOptionProcessor.ts`: Column options and comment generation
  - `stringUtils.ts`: String transformation utilities
  - `railsInflector.ts`: Rails-compatible singularization (existing)
- **Improved maintainability**: Clear separation of concerns for future extensibility
- **TypeScript compliance**: Fixed `verbatimModuleSyntax` type import/export issues

### Technical

- Split 150+ line `schemaParser.ts` into 5 focused modules (6-48 lines each)
- Enhanced code organization for upcoming enum support
- Maintained 100% backward compatibility and test coverage

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
