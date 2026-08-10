import { notFound } from "next/navigation";

/**
 * Bármely nem létező /admin/* útvonal az admin shellen belüli, márkázott
 * "nem található" nézetre fut ki a nyers 404 oldal helyett.
 */
export default function AdminCatchAllPage() {
  notFound();
}
