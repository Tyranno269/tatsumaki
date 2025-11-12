import { parseSchema } from "./schemaParser.js";

describe("parseSchema", () => {
  test("handles table without comment and auto-adds id", () => {
    const schema = `
      create_table "users" do |t|
        t.string "name", null: false
        t.timestamps null: false
      end
    `;

    const models = parseSchema(schema);
    expect(models).toHaveLength(1);
    expect(models[0].name).toBe("User");
    expect(models[0].comment).toBeUndefined();
    expect(models[0].fields).toEqual([
      { name: "id", type: "int64", nullable: false, description: undefined, metadata: undefined },
      {
        name: "name",
        type: "string",
        nullable: false,
        description: undefined,
        metadata: undefined,
      },
      {
        name: "created_at",
        type: "utcDateTime",
        nullable: false,
        description: undefined,
        metadata: undefined,
      },
      {
        name: "updated_at",
        type: "utcDateTime",
        nullable: false,
        description: undefined,
        metadata: undefined,
      },
    ]);
  });

  test("handles table with comment and custom id type", () => {
    const schema = `
      create_table "posts", id: :uuid, comment: "Blog posts" do |t|
        t.string "title", limit: 255, null: false, comment: "Post title"
        t.references "user", type: :uuid, null: false
        t.decimal "price", precision: 10, scale: 2
      end
    `;

    const models = parseSchema(schema);
    expect(models[0].name).toBe("Post");
    expect(models[0].comment).toBe("Blog posts");
    expect(models[0].fields).toEqual([
      { name: "id", type: "string", nullable: false, description: undefined, metadata: undefined },
      {
        name: "title",
        type: "string",
        nullable: false,
        description: "Post title",
        metadata: "limit: 255",
      },
      {
        name: "user_id",
        type: "string",
        nullable: false,
        description: undefined,
        metadata: "ref: user",
      },
      {
        name: "price",
        type: "string",
        nullable: true,
        description: undefined,
        metadata: "precision: 10, scale: 2",
      },
    ]);
  });

  test("handles table with id: false", () => {
    const schema = `
      create_table "logs", id: false do |t|
        t.string "message"
        t.jsonb "data"
      end
    `;

    const models = parseSchema(schema);
    expect(models[0].fields).toEqual([
      {
        name: "message",
        type: "string",
        nullable: true,
        description: undefined,
        metadata: undefined,
      },
      {
        name: "data",
        type: "unknown",
        nullable: true,
        description: undefined,
        metadata: undefined,
      },
    ]);
  });

  test("comprehensive Rails data types mapping", () => {
    const schema = `
      create_table "comprehensive_types" do |t|
        t.string "str_field"
        t.text "text_field"
        t.integer "int_field"
        t.bigint "bigint_field"
        t.smallint "smallint_field"
        t.decimal "decimal_field", precision: 8, scale: 2
        t.float "float_field"
        t.boolean "bool_field"
        t.datetime "datetime_field"
        t.timestamp "timestamp_field"
        t.date "date_field"
        t.time "time_field"
        t.json "json_field"
        t.jsonb "jsonb_field"
        t.binary "binary_field"
        t.uuid "uuid_field"
        t.inet "inet_field"
        t.cidr "cidr_field"
        t.macaddr "macaddr_field"
      end
    `;

    const models = parseSchema(schema);
    const fields = models[0].fields;

    // Find fields by name and check types
    const fieldTypes: Record<string, string> = fields.reduce(
      (acc, field) => {
        acc[field.name] = field.type;
        return acc;
      },
      {} as Record<string, string>,
    );

    expect(fieldTypes).toMatchObject({
      id: "int64",
      str_field: "string",
      text_field: "string",
      int_field: "int32",
      bigint_field: "int64",
      smallint_field: "int32",
      decimal_field: "string",
      float_field: "float64",
      bool_field: "boolean",
      datetime_field: "utcDateTime",
      timestamp_field: "utcDateTime",
      date_field: "plainDate",
      time_field: "plainTime",
      json_field: "unknown",
      jsonb_field: "unknown",
      binary_field: "bytes",
      uuid_field: "string",
      inet_field: "string",
      cidr_field: "string",
      macaddr_field: "string",
    });
  });

  test("handles references and belongs_to with various options", () => {
    const schema = `
      create_table "posts" do |t|
        t.references "user", null: false
        t.references "category", type: :uuid, null: false
        t.belongs_to "author", null: false
        t.belongs_to "organization", type: :string, null: false
      end
    `;

    const models = parseSchema(schema);
    const fields = models[0].fields;

    expect(fields).toEqual(
      expect.arrayContaining([
        {
          name: "user_id",
          type: "int64",
          nullable: false,
          description: undefined,
          metadata: "ref: user",
        },
        {
          name: "category_id",
          type: "string",
          nullable: false,
          description: undefined,
          metadata: "ref: category",
        },
        {
          name: "author_id",
          type: "int64",
          nullable: false,
          description: undefined,
          metadata: "ref: author",
        },
        {
          name: "organization_id",
          type: "string",
          nullable: false,
          description: undefined,
          metadata: "ref: organization",
        },
      ]),
    );
  });

  test("handles nullable and non-nullable fields correctly", () => {
    const schema = `
      create_table "nullable_test" do |t|
        t.string "required_field", null: false
        t.string "optional_field", null: true
        t.string "default_nullable"
        t.integer "explicit_not_null", null: false
      end
    `;

    const models = parseSchema(schema);
    const fields = models[0].fields;

    expect(fields).toEqual(
      expect.arrayContaining([
        {
          name: "required_field",
          type: "string",
          nullable: false,
          description: undefined,
          metadata: undefined,
        },
        {
          name: "optional_field",
          type: "string",
          nullable: true,
          description: undefined,
          metadata: undefined,
        },
        {
          name: "default_nullable",
          type: "string",
          nullable: true,
          description: undefined,
          metadata: undefined,
        },
        {
          name: "explicit_not_null",
          type: "int32",
          nullable: false,
          description: undefined,
          metadata: undefined,
        },
      ]),
    );
  });

  test("handles limits and constraints in comments", () => {
    const schema = `
      create_table "constraints_test" do |t|
        t.string "name", limit: 100, null: false, comment: "User name"
        t.decimal "price", precision: 10, scale: 2, comment: "Product price"
        t.string "code", limit: 50, comment: "Product code"
        t.decimal "weight", precision: 8, scale: 3
      end
    `;

    const models = parseSchema(schema);
    const fields = models[0].fields;

    expect(fields).toEqual(
      expect.arrayContaining([
        {
          name: "name",
          type: "string",
          nullable: false,
          description: "User name",
          metadata: "limit: 100",
        },
        {
          name: "price",
          type: "string",
          nullable: true,
          description: "Product price",
          metadata: "precision: 10, scale: 2",
        },
        {
          name: "code",
          type: "string",
          nullable: true,
          description: "Product code",
          metadata: "limit: 50",
        },
        {
          name: "weight",
          type: "string",
          nullable: true,
          description: undefined,
          metadata: "precision: 8, scale: 3",
        },
      ]),
    );
  });

  test("handles timestamps with different null constraints", () => {
    const schema = `
      create_table "timestamp_test" do |t|
        t.timestamps null: false
      end
      
      create_table "timestamp_nullable" do |t|
        t.timestamps null: true
      end
      
      create_table "timestamp_default" do |t|
        t.timestamps
      end
    `;

    const models = parseSchema(schema);

    // First table - timestamps not null
    expect(models[0].fields).toEqual(
      expect.arrayContaining([
        {
          name: "created_at",
          type: "utcDateTime",
          nullable: false,
          description: undefined,
          metadata: undefined,
        },
        {
          name: "updated_at",
          type: "utcDateTime",
          nullable: false,
          description: undefined,
          metadata: undefined,
        },
      ]),
    );

    // Second table - timestamps nullable
    expect(models[1].fields).toEqual(
      expect.arrayContaining([
        {
          name: "created_at",
          type: "utcDateTime",
          nullable: true,
          description: undefined,
          metadata: undefined,
        },
        {
          name: "updated_at",
          type: "utcDateTime",
          nullable: true,
          description: undefined,
          metadata: undefined,
        },
      ]),
    );

    // Third table - default nullable
    expect(models[2].fields).toEqual(
      expect.arrayContaining([
        {
          name: "created_at",
          type: "utcDateTime",
          nullable: true,
          description: undefined,
          metadata: undefined,
        },
        {
          name: "updated_at",
          type: "utcDateTime",
          nullable: true,
          description: undefined,
          metadata: undefined,
        },
      ]),
    );
  });

  test("ignores index definitions", () => {
    const schema = `
      create_table "users" do |t|
        t.string "email", null: false
        t.string "name"
        t.index ["email"], name: "index_users_on_email", unique: true
        t.index ["name", "email"], name: "index_users_on_name_and_email"
        t.timestamps
      end
    `;

    const models = parseSchema(schema);
    expect(models[0].fields).toHaveLength(5); // id, email, name, created_at, updated_at
    expect(models[0].fields.map((f) => f.name)).toEqual([
      "id",
      "email",
      "name",
      "created_at",
      "updated_at",
    ]);
  });

  test("handles edge cases in table and field names", () => {
    const schema = `
      create_table "user_profiles" do |t|
        t.string "first_name"
        t.string "last_name"
      end
      
      create_table "api_keys" do |t|
        t.string "key_value"
      end
      
      create_table "categories" do |t|
        t.string "category_name"
      end
    `;

    const models = parseSchema(schema);

    // Test singularization and PascalCase conversion
    expect(models.map((m) => m.name).sort()).toEqual(["ApiKey", "Category", "UserProfile"]);
  });

  test("handles singularization of words ending in 'es'", () => {
    const schema = `
      create_table "company_branches" do |t|
        t.string "name"
      end
      
      create_table "addresses" do |t|
        t.string "street"
      end
      
      create_table "boxes" do |t|
        t.string "content"
      end
      
      create_table "dishes" do |t|
        t.string "name"
      end
      
      create_table "buses" do |t|
        t.string "route"
      end
      
      create_table "analyses" do |t|
        t.string "result"
      end
      
      create_table "indices" do |t|
        t.string "name"
      end
    `;

    const models = parseSchema(schema);

    // Test correct singularization including complex cases
    expect(models.map((m) => m.name).sort()).toEqual([
      "Address",
      "Analysis",
      "Box",
      "Bus",
      "CompanyBranch",
      "Dish",
      "Index",
    ]);
  });
});
