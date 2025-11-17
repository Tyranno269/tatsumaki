import { describe, test, expect, vi } from "vitest";

import { parseRelevantRailsEnums } from "./modelFinder.js";

// Mock dependencies
vi.mock("fs", () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
}));

vi.mock("fast-glob", () => ({
  default: vi.fn(),
}));

vi.mock("../parsing/enumParser.js", () => ({
  parseRailsEnums: vi.fn(),
  getModelNameFromPath: vi.fn(),
}));

describe("parseRelevantRailsEnums", () => {
  test("filters models based on table names", async () => {
    const { readFileSync, existsSync } = await import("fs");
    const fg = (await import("fast-glob")).default;
    const { parseRailsEnums, getModelNameFromPath } = await import("../parsing/enumParser.js");

    // Setup mocks
    vi.mocked(fg).mockResolvedValue([
      "/project/app/models/company.rb",
      "/project/app/models/prefecture.rb", // This should be filtered out
      "/project/app/models/user.rb",
    ]);

    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue("mock content");

    // Mock the imported functions
    (getModelNameFromPath as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
      if (path.includes("company.rb")) return "Company";
      if (path.includes("prefecture.rb")) return "Prefecture";
      if (path.includes("user.rb")) return "User";
      return "";
    });

    (parseRailsEnums as ReturnType<typeof vi.fn>).mockImplementation(
      (content: string, modelName: string) => {
        if (modelName === "Company")
          return [{ fieldName: "status", values: ["active"], modelName: "Company" }];
        if (modelName === "User")
          return [{ fieldName: "region", values: ["kanto"], modelName: "User" }];
        return [];
      },
    );

    // Only companies and users tables exist in schema.rb
    const tableNames = ["companies", "users"];

    const result = await parseRelevantRailsEnums("/project", tableNames);

    // Should only parse Company and User models, not Prefecture
    expect(parseRailsEnums).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
    expect(result[0].modelName).toBe("Company");
    expect(result[1].modelName).toBe("User");
  });

  test("handles empty table names", async () => {
    const result = await parseRelevantRailsEnums("/project", []);
    expect(result).toHaveLength(0);
  });
});
