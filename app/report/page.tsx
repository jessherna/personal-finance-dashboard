import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { SavingsGoalsList } from "@/components/savings-goals-list"
import { SavingsOverview } from "@/components/savings-overview"
import { SavingsHistory } from "@/components/savings-history"

export default function ReportPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 lg:pl-64">
        <Header title="Report" />
        <main className="p-4 sm:p-6 lg:p-8">
          <SavingsOverview />
          <div className="mt-6 grid gap-4 sm:gap-6 lg:grid-cols-3 lg:mt-8">
            <div className="lg:col-span-2">
              <SavingsGoalsList />
            </div>
            <div>
              <SavingsHistory />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
