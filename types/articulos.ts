import type {
  Articulo,
  Compra,
  CompraItem,
} from "@/lib/generated/prisma/client";

export type ArticuloWithRelations = Articulo & {
  // Future: pedidoItems, compraItems
};

export type CompraWithItems = Compra & {
  items: (CompraItem & {
    articulo: Pick<Articulo, "id" | "nombre" | "categoria" | "presentacion">;
  })[];
};

export type MovementEntry = {
  fecha: Date;
  tipo: "entrada" | "salida";
  cantidad: number;
  referencia: string;
  referenciaId: string;
  responsable: string;
  stockResultante?: number;
};
