import { describe, it, expect } from "vitest";
import { createArticuloSchema, updateArticuloSchema } from "./articulos";

describe("createArticuloSchema", () => {
  it("accepts valid full input", () => {
    const result = createArticuloSchema.safeParse({
      nombre: "Papas Limón",
      categoria: "PAPA",
      presentacion: "G50",
      costo: 1000,
      precio: 2000,
      stockMinimo: 5,
    });
    expect(result.success).toBe(true);
  });

  it("rejects when precio <= costo", () => {
    const result = createArticuloSchema.safeParse({
      nombre: "Papas Limón",
      categoria: "PAPA",
      presentacion: "G50",
      costo: 2000,
      precio: 1000,
      stockMinimo: 0,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const precioError = result.error.issues.find((i) => i.path[0] === "precio");
      expect(precioError?.message).toBe("El precio debe ser mayor al costo");
    }
  });

  it("rejects missing required fields", () => {
    const result = createArticuloSchema.safeParse({
      nombre: "Papas Limón",
      // missing categoria, presentacion, costo, precio
    });
    expect(result.success).toBe(false);
  });
});

describe("updateArticuloSchema", () => {
  it("accepts partial input with only nombre", () => {
    const result = updateArticuloSchema.safeParse({
      nombre: "Papas Nuevas",
    });
    expect(result.success).toBe(true);
  });

  it("accepts partial input with only stockActual", () => {
    const result = updateArticuloSchema.safeParse({
      stockActual: 50,
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (no changes)", () => {
    const result = updateArticuloSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects negative stockActual", () => {
    const result = updateArticuloSchema.safeParse({
      stockActual: -5,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const stockError = result.error.issues.find((i) => i.path[0] === "stockActual");
      expect(stockError?.message).toBe("El stock no puede ser negativo");
    }
  });

  it("validates precio > costo when BOTH are present", () => {
    const result = updateArticuloSchema.safeParse({
      costo: 2000,
      precio: 1000,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const precioError = result.error.issues.find((i) => i.path[0] === "precio");
      expect(precioError?.message).toBe("El precio debe ser mayor al costo");
    }
  });

  it("skips precio>costo validation when only precio is present", () => {
    const result = updateArticuloSchema.safeParse({
      precio: 1000,
    });
    expect(result.success).toBe(true);
  });

  it("skips precio>costo validation when only costo is present", () => {
    const result = updateArticuloSchema.safeParse({
      costo: 2000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid precio>costo when both present", () => {
    const result = updateArticuloSchema.safeParse({
      costo: 1000,
      precio: 2000,
    });
    expect(result.success).toBe(true);
  });
});
