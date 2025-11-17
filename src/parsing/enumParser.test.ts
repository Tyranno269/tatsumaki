import { describe, test, expect } from "vitest";

import { parseRailsEnums, getModelNameFromPath } from "./enumParser.js";

describe("parseRailsEnums", () => {
  test("parses hash format enum", () => {
    const content = `
class Company < ApplicationRecord
  enum :company_status, { disabled: 0, enabled: 1, suspended: 9 }
end
    `;

    const result = parseRailsEnums(content, "Company");

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      fieldName: "company_status",
      values: ["disabled", "enabled", "suspended"],
      modelName: "Company",
    });
  });

  test("parses array format enum", () => {
    const content = `
class Company < ApplicationRecord
  enum :status, [ :active, :archived ]
end
    `;

    const result = parseRailsEnums(content, "Company");

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      fieldName: "status",
      values: ["active", "archived"],
      modelName: "Company",
    });
  });

  test("parses %i format enum", () => {
    const content = `
class Company < ApplicationRecord
  enum :online_status, %i(online offline)
end
    `;

    const result = parseRailsEnums(content, "Company");

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      fieldName: "online_status",
      values: ["online", "offline"],
      modelName: "Company",
    });
  });

  test("parses keyword argument format enum", () => {
    const content = `
class Company < ApplicationRecord
  enum :round_status, series_a: 0, series_b: 1, series_c: 2, ipo: 3, acquired: 4
end
    `;

    const result = parseRailsEnums(content, "Company");

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      fieldName: "round_status",
      values: ["series_a", "series_b", "series_c", "ipo", "acquired"],
      modelName: "Company",
    });
  });

  test("parses enum with do block", () => {
    const content = `
class Bug < ApplicationRecord
  enum :status, {unassigned: 0, assigned: 1, resolved: 2, closed: 3} do
    event :assign do
      transition :unassigned => :assigned
    end
  end
end
    `;

    const result = parseRailsEnums(content, "Bug");

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      fieldName: "status",
      values: ["unassigned", "assigned", "resolved", "closed"],
      modelName: "Bug",
    });
  });

  test("parses multiple enums in one model", () => {
    const content = `
class Company < ApplicationRecord
  enum :company_status, { disabled: 0, enabled: 1 }
  enum :status, [ :active, :archived ]
end
    `;

    const result = parseRailsEnums(content, "Company");

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      fieldName: "company_status",
      values: ["disabled", "enabled"],
      modelName: "Company",
    });
    expect(result[1]).toEqual({
      fieldName: "status",
      values: ["active", "archived"],
      modelName: "Company",
    });
  });
});

describe("getModelNameFromPath", () => {
  test("extracts model name from file path", () => {
    expect(getModelNameFromPath("app/models/company.rb")).toBe("Company");
    expect(getModelNameFromPath("app/models/user_profile.rb")).toBe("UserProfile");
    expect(getModelNameFromPath("/full/path/app/models/blog_post.rb")).toBe("BlogPost");
  });
});
