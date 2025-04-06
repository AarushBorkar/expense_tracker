"use client"

import { useEffect, useState } from "react"
import { CalendarIcon, DollarSign, Filter, TrendingUp, Wallet } from "lucide-react"
import { format } from "date-fns"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart as RPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExpenseChart } from "@/components/expense-chart"
import { DateRangePicker } from "@/components/date-range-picker"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatCurrency } from "@/lib/currency"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658"]

export default function DashboardPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalExpenses: 0,
    monthlyExpenses: 0,
    totalIncome: 0,
    monthlyIncome: 0,
    categories: 0,
    paymentMethods: 0,
    savings: 0,
    monthlySavings: 0,
  })
  const [expenseData, setExpenseData] = useState([])
  const [recentExpenses, setRecentExpenses] = useState([])
  const [monthlyTrend, setMonthlyTrend] = useState([])
  const [predictions, setPredictions] = useState([])
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  })
  const [chartType, setChartType] = useState("bar")
  const [timeRange, setTimeRange] = useState("6")

  useEffect(() => {
    if (!user) return

    const fetchDashboardData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // Format month and year for API request
        const month = dateRange.from ? dateRange.from.getMonth() + 1 : new Date().getMonth() + 1
        const year = dateRange.from ? dateRange.from.getFullYear() : new Date().getFullYear()

        const response = await fetch(`/api/dashboard?month=${month}&year=${year}&timeRange=${timeRange}`)

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data")
        }

        const data = await response.json()

        setStats({
          totalExpenses: data.stats.totalExpenses || 0,
          monthlyExpenses: data.stats.monthlyExpenses || 0,
          totalIncome: data.stats.totalIncome || 0,
          monthlyIncome: data.stats.monthlyIncome || 0,
          categories: data.stats.categories || 0,
          paymentMethods: data.stats.paymentMethods || 0,
          savings: data.stats.savings || 0,
          monthlySavings: data.stats.monthlySavings || 0,
        })

        setExpenseData(data.expensesByCategory || [])
        setRecentExpenses(data.recentExpenses || [])
        setMonthlyTrend(data.monthlyTrend || [])
        setPredictions(data.predictions || [])
      } catch (error: any) {
        console.error("Dashboard error:", error)
        setError(error.message || "Failed to load dashboard data. Please try again.")
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()

    // Set up interval to refresh data every minute
    const intervalId = setInterval(fetchDashboardData, 60000)

    // Clean up interval on component unmount
    return () => clearInterval(intervalId)
  }, [user, toast, dateRange, timeRange])

  // Format monthly trend data for chart
  const formattedMonthlyTrend = monthlyTrend.map((item: any) => ({
    name: format(new Date(item.year, item.month - 1, 1), "MMM yyyy"),
    expenses: Number.parseFloat(item.expenses || 0),
    income: Number.parseFloat(item.income || 0),
    savings: Number.parseFloat(item.income || 0) - Number.parseFloat(item.expenses || 0),
  }))

  // Calculate month-over-month change
  const calculateMoMChange = (current: number, previous: number) => {
    if (previous === 0) return 100
    return ((current - previous) / previous) * 100
  }

  // Get month-over-month changes
  const getMonthlyChanges = () => {
    if (formattedMonthlyTrend.length < 2) return { expenses: 0, income: 0, savings: 0 }

    const currentMonth = formattedMonthlyTrend[formattedMonthlyTrend.length - 1]
    const previousMonth = formattedMonthlyTrend[formattedMonthlyTrend.length - 2]

    return {
      expenses: calculateMoMChange(currentMonth.expenses, previousMonth.expenses),
      income: calculateMoMChange(currentMonth.income, previousMonth.income),
      savings: calculateMoMChange(currentMonth.savings, previousMonth.savings),
    }
  }

  const monthlyChanges = getMonthlyChanges()

  // Remove or comment out this helper function
  // const formatCurrency = (value: number | undefined | null) => {
  //   if (value === undefined || value === null) return "$0.00"
  //   return `$${Number(value).toFixed(2)}`
  // }

  if (!user) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please login to view your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/login">Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <DateRangePicker date={dateRange} setDate={setDateRange} />
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
            <span className="sr-only">Filter</span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{formatCurrency(stats.totalExpenses)}</div>
                    <p className="text-xs text-muted-foreground">All time expenses</p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{formatCurrency(stats.monthlyExpenses)}</div>
                    <div className="flex items-center mt-1">
                      <span className={`text-xs ${monthlyChanges.expenses > 0 ? "text-red-500" : "text-green-500"}`}>
                        {monthlyChanges.expenses > 0 ? "↑" : "↓"} {Math.abs(monthlyChanges.expenses).toFixed(1)}%
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">vs last month</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{formatCurrency(stats.monthlyIncome)}</div>
                    <div className="flex items-center mt-1">
                      <span className={`text-xs ${monthlyChanges.income > 0 ? "text-green-500" : "text-red-500"}`}>
                        {monthlyChanges.income > 0 ? "↑" : "↓"} {Math.abs(monthlyChanges.income).toFixed(1)}%
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">vs last month</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Savings</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div
                      className={`text-2xl font-bold ${stats.monthlySavings < 0 ? "text-red-500" : "text-green-500"}`}
                    >
                      {formatCurrency(stats.monthlySavings)}
                    </div>
                    <div className="flex items-center mt-1">
                      <span className={`text-xs ${monthlyChanges.savings > 0 ? "text-green-500" : "text-red-500"}`}>
                        {monthlyChanges.savings > 0 ? "↑" : "↓"} {Math.abs(monthlyChanges.savings).toFixed(1)}%
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">vs last month</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Expense Overview</CardTitle>
                <CardDescription>
                  Breakdown by category for {format(dateRange.from || new Date(), "MMMM yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                {isLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <Skeleton className="h-[250px] w-[250px] rounded-full" />
                  </div>
                ) : expenseData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No expense data available for this period
                  </div>
                ) : (
                  <ExpenseChart data={expenseData} />
                )}
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Expenses</CardTitle>
                <CardDescription>Your most recent expenses</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-[150px]" />
                          <Skeleton className="h-3 w-[100px]" />
                        </div>
                        <Skeleton className="h-4 w-[60px]" />
                      </div>
                    ))}
                  </div>
                ) : recentExpenses.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">No recent expenses found</div>
                ) : (
                  <div className="space-y-8">
                    {recentExpenses.map((expense: any) => (
                      <div key={expense.id} className="flex items-center">
                        <div className="mr-4 space-y-1">
                          <p className="text-sm font-medium leading-none">{expense.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(expense.date), "MMM dd, yyyy")} • {expense.category_name}
                          </p>
                        </div>
                        <div className="ml-auto font-medium">{formatCurrency(Number.parseFloat(expense.amount))}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Monthly Expense Trend</CardTitle>
                  <CardDescription>Your expense trend over time</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Time Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Months</SelectItem>
                      <SelectItem value="6">6 Months</SelectItem>
                      <SelectItem value="12">12 Months</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={chartType} onValueChange={setChartType}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Chart Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">Bar</SelectItem>
                      <SelectItem value="line">Line</SelectItem>
                      <SelectItem value="area">Area</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="h-[350px]">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Skeleton className="h-[300px] w-full" />
                  </div>
                ) : formattedMonthlyTrend.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No trend data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === "bar" ? (
                      <BarChart data={formattedMonthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [`$${Number(value).toFixed(2)}`, ""]}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Legend />
                        <Bar dataKey="expenses" name="Expenses" fill="#8884d8" />
                        <Bar dataKey="income" name="Income" fill="#82ca9d" />
                        <Bar dataKey="savings" name="Savings" fill="#ffc658" />
                      </BarChart>
                    ) : chartType === "line" ? (
                      <LineChart data={formattedMonthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [`$${Number(value).toFixed(2)}`, ""]}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="expenses"
                          name="Expenses"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                        />
                        <Line type="monotone" dataKey="income" name="Income" stroke="#82ca9d" />
                        <Line type="monotone" dataKey="savings" name="Savings" stroke="#ffc658" />
                      </LineChart>
                    ) : (
                      <AreaChart data={formattedMonthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [`$${Number(value).toFixed(2)}`, ""]}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="expenses"
                          name="Expenses"
                          stackId="1"
                          stroke="#8884d8"
                          fill="#8884d8"
                        />
                        <Area
                          type="monotone"
                          dataKey="income"
                          name="Income"
                          stackId="2"
                          stroke="#82ca9d"
                          fill="#82ca9d"
                        />
                        <Area
                          type="monotone"
                          dataKey="savings"
                          name="Savings"
                          stackId="3"
                          stroke="#ffc658"
                          fill="#ffc658"
                        />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>Expenses by category</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Skeleton className="h-[200px] w-[200px] rounded-full" />
                  </div>
                ) : expenseData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No category data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RPieChart>
                      <Pie
                        data={expenseData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {expenseData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`$${Number(value).toFixed(2)}`, "Amount"]}
                        labelFormatter={(name) => `Category: ${name}`}
                      />
                      <Legend />
                    </RPieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Income vs Expenses</CardTitle>
                <CardDescription>Monthly comparison</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Skeleton className="h-[300px] w-full" />
                  </div>
                ) : formattedMonthlyTrend.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No trend data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={formattedMonthlyTrend}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [`$${Number(value).toFixed(2)}`, ""]}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Legend />
                      <Bar dataKey="income" name="Income" fill="#82ca9d" />
                      <Bar dataKey="expenses" name="Expenses" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Savings Trend</CardTitle>
                <CardDescription>Monthly savings over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Skeleton className="h-[300px] w-full" />
                  </div>
                ) : formattedMonthlyTrend.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No trend data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={formattedMonthlyTrend}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [`$${Number(value).toFixed(2)}`, ""]}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Area type="monotone" dataKey="savings" name="Savings" stroke="#ffc658" fill="#ffc658" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expense Predictions</CardTitle>
              <CardDescription>Predicted expenses for next month based on your spending patterns</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-4 w-[60px]" />
                    </div>
                  ))}
                </div>
              ) : predictions.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Not enough data to make predictions. Continue tracking your expenses.
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Predicted Expenses by Category</h3>
                      <div className="space-y-4">
                        {predictions.map((prediction: any, index: number) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div
                                className="w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <span>{prediction.name}</span>
                            </div>
                            <span className="font-medium">
                              {formatCurrency(Number.parseFloat(prediction.average_amount))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-4">Visualization</h3>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={predictions}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={100} />
                            <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, "Predicted Amount"]} />
                            <Bar dataKey="average_amount" name="Predicted Amount">
                              {predictions.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Prediction Insights</h3>
                    <p className="text-sm text-muted-foreground">
                      These predictions are based on your spending patterns over the last 3 months. The more data you
                      add, the more accurate these predictions will become. Use these insights to plan your budget for
                      the upcoming month.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

