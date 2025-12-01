import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { MetricCard } from "@/components/metric-card"
import { RecentTransactions } from "@/components/recent-transactions"
import { SpendingChart } from "@/components/spending-chart"
import { BudgetChart } from "@/components/budget-chart"
import { SavingsGoals } from "@/components/savings-goals"
import { RecurringBillsKPI } from "@/components/recurring-bills-kpi"
import { mockDashboardMetrics } from "@/lib/data/dashboard"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 lg:pl-64">
        <Header title="Analytics" />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:mb-8">
            {mockDashboardMetrics.map((metric, index) => (
              <MetricCard key={index} {...metric} />
            ))}
          </div>

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            <div className="space-y-4 sm:space-y-6">
              <RecentTransactions />
              <BudgetChart />
            </div>
            <div className="space-y-4 sm:space-y-6">
              <SpendingChart />
              <SavingsGoals />
              <RecurringBillsKPI />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
