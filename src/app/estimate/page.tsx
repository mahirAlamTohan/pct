import type { Metadata } from "next"

import { EstimatePage } from "@/components/estimate/estimate-page"

export const metadata: Metadata = {
  title: "Your Order Estimate",
  description:
    "Build a client-side price estimate from the product catalog. Nothing is ordered or paid for on this page.",
  alternates: { canonical: "/estimate" },
  robots: { index: false, follow: true },
}

export default function EstimateRoute() {
  return <EstimatePage />
}
