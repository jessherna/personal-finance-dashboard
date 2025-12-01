import { Card, CardContent } from "@/components/ui/card"
import { mockTransactionStats } from "@/lib/data/transactions"

export function TransactionStats() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {mockTransactionStats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className={`text-sm font-medium ${stat.iconColor}`}>{stat.change} from last month</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
