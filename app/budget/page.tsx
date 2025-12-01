import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { BudgetOverview } from "@/components/budget-overview"
import { BudgetCategories } from "@/components/budget-categories"
import { MonthlyComparison } from "@/components/monthly-comparison"

export default function BudgetPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 lg:pl-64">
        <Header title="Budget" />
        <main className="p-4 sm:p-6 lg:p-8">
          <BudgetOverview />
          <div className="mt-6 grid gap-4 sm:gap-6 lg:grid-cols-3 lg:mt-8">
            <div className="lg:col-span-2">
              <BudgetCategories />
            </div>
            <div>
              <MonthlyComparison />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
