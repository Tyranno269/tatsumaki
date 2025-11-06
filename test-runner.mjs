import { parseSchema } from "./dist/utils/schemaParser.js";

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
  }
}

function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toEqual: (expected) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toHaveLength: (expected) => {
      if (actual.length !== expected) {
        throw new Error(`Expected length ${expected}, got ${actual.length}`);
      }
    },
    toMatchObject: (expected) => {
      for (const [key, value] of Object.entries(expected)) {
        if (actual[key] !== value) {
          throw new Error(`Expected ${key} to be ${value}, got ${actual[key]}`);
        }
      }
    },
    arrayContaining: (expected) => {
      for (const item of expected) {
        const found = actual.some(actualItem => 
          JSON.stringify(actualItem) === JSON.stringify(item)
        );
        if (!found) {
          throw new Error(`Expected array to contain ${JSON.stringify(item)}`);
        }
      }
    }
  };
}

console.log("Running comprehensive Rails data type tests...\n");

// Basic functionality tests
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
  expect(models[0].primaryKey).toBe("id");
  expect(models[0].fields).toHaveLength(4); // id, name, created_at, updated_at
});

// Custom primary key tests
test("handles custom primary key name", () => {
  const schema = `
    create_table "accounts", primary_key: "account_id" do |t|
      t.string "name", null: false
    end
  `;
  
  const models = parseSchema(schema);
  expect(models[0].name).toBe("Account");
  expect(models[0].primaryKey).toBe("account_id");
  
  const accountIdField = models[0].fields.find(f => f.name === "account_id");
  expect(accountIdField.type).toBe("int64");
  expect(accountIdField.nullable).toBe(false);
});

test("handles id: false (no primary key)", () => {
  const schema = `
    create_table "logs", id: false do |t|
      t.string "message"
    end
  `;
  
  const models = parseSchema(schema);
  expect(models[0].primaryKey).toBe(undefined);
  expect(models[0].fields.some(f => f.name === "id")).toBe(false);
});

// Default value tests
test("handles primitive default values", () => {
  const schema = `
    create_table "settings" do |t|
      t.string "status", default: "active", null: false
      t.boolean "enabled", default: true
      t.integer "max_count", default: 100
      t.string "complex_default", default: -> { "NOW()" }
    end
  `;
  
  const models = parseSchema(schema);
  const fields = models[0].fields;
  
  const statusField = fields.find(f => f.name === "status");
  const enabledField = fields.find(f => f.name === "enabled");
  const maxCountField = fields.find(f => f.name === "max_count");
  const complexField = fields.find(f => f.name === "complex_default");
  
  expect(statusField.default).toBe("active");
  expect(enabledField.default).toBe(true);
  expect(maxCountField.default).toBe(100);
  expect(complexField.default).toBe(undefined); // Complex defaults ignored
});

// Foreign key to_table tests
test("handles foreign key to_table references", () => {
  const schema = `
    create_table "posts" do |t|
      t.references "user", null: false
      t.references "author", foreign_key: { to_table: :people }, null: false
      t.references "category", foreign_key: { to_table: :post_categories, on_delete: :cascade }
    end
  `;
  
  const models = parseSchema(schema);
  const fields = models[0].fields;
  
  const userField = fields.find(f => f.name === "user_id");
  const authorField = fields.find(f => f.name === "author_id");
  const categoryField = fields.find(f => f.name === "category_id");
  
  expect(userField.comment).toBe("ref: user");
  expect(authorField.comment).toBe("ref: people");
  expect(categoryField.comment).toBe("ref: post_categories");
});

// Comprehensive Rails data types
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
  
  const fieldTypes = fields.reduce((acc, field) => {
    acc[field.name] = field.type;
    return acc;
  }, {});
  
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
    macaddr_field: "string"
  });
});

// References and belongs_to
test("handles references with various types", () => {
  const schema = `
    create_table "posts" do |t|
      t.references "user", null: false
      t.references "category", type: :uuid, null: false
      t.belongs_to "author", null: false
    end
  `;
  
  const models = parseSchema(schema);
  const fields = models[0].fields;
  
  const userField = fields.find(f => f.name === "user_id");
  const categoryField = fields.find(f => f.name === "category_id");
  const authorField = fields.find(f => f.name === "author_id");
  
  expect(userField.type).toBe("int64");
  expect(userField.comment).toBe("ref: user");
  expect(categoryField.type).toBe("string");
  expect(categoryField.comment).toBe("ref: category");
  expect(authorField.type).toBe("int64");
  expect(authorField.comment).toBe("ref: author");
});

// Nullable handling
test("handles nullable fields correctly", () => {
  const schema = `
    create_table "nullable_test" do |t|
      t.string "required_field", null: false
      t.string "optional_field", null: true
      t.string "default_nullable"
    end
  `;
  
  const models = parseSchema(schema);
  const fields = models[0].fields;
  
  const requiredField = fields.find(f => f.name === "required_field");
  const optionalField = fields.find(f => f.name === "optional_field");
  const defaultField = fields.find(f => f.name === "default_nullable");
  
  expect(requiredField.nullable).toBe(false);
  expect(optionalField.nullable).toBe(true);
  expect(defaultField.nullable).toBe(true);
});

// Constraints and limits
test("handles limits and precision in comments", () => {
  const schema = `
    create_table "constraints_test" do |t|
      t.string "name", limit: 100, comment: "User name"
      t.decimal "price", precision: 10, scale: 2
    end
  `;
  
  const models = parseSchema(schema);
  const fields = models[0].fields;
  
  const nameField = fields.find(f => f.name === "name");
  const priceField = fields.find(f => f.name === "price");
  
  expect(nameField.comment).toBe("User name (limit: 100)");
  expect(priceField.comment).toBe("precision: 10, scale: 2");
});

// Timestamps variations
test("handles timestamps with different null constraints", () => {
  const schema = `
    create_table "timestamp_test" do |t|
      t.timestamps null: false
    end
  `;
  
  const models = parseSchema(schema);
  const fields = models[0].fields;
  
  const createdAt = fields.find(f => f.name === "created_at");
  const updatedAt = fields.find(f => f.name === "updated_at");
  
  expect(createdAt.nullable).toBe(false);
  expect(updatedAt.nullable).toBe(false);
});

// Edge cases
test("handles custom id types and id: false", () => {
  const schema1 = `
    create_table "posts", id: :uuid do |t|
      t.string "title"
    end
  `;
  
  const schema2 = `
    create_table "logs", id: false do |t|
      t.string "message"
    end
  `;
  
  const models1 = parseSchema(schema1);
  const models2 = parseSchema(schema2);
  
  expect(models1[0].fields[0].type).toBe("string"); // uuid -> string
  expect(models2[0].fields.some(f => f.name === "id")).toBe(false);
});

// Singularization and naming
test("handles table name conversion", () => {
  const schema = `
    create_table "user_profiles" do |t|
      t.string "name"
    end
    
    create_table "categories" do |t|
      t.string "name"
    end
  `;
  
  const models = parseSchema(schema);
  const names = models.map(m => m.name).sort();
  
  expect(names).toEqual(["Category", "UserProfile"]);
});

console.log("\n🎉 All tests completed!");
