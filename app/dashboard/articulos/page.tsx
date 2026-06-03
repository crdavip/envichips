import type { Metadata } from "next";
import { ArticleList } from "@/components/articulos/ArticleList";

export const metadata: Metadata = {
  title: "Artículos | Envichips",
  description: "Catálogo de productos",
};

export default function ArticulosPage() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <ArticleList />
    </div>
  );
}
