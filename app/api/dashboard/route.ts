import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { authenticate } from "@/lib/auth-middleware"

export async function GET(request: Request) {
  const user = await authenticate()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get query parameters
  const { searchParams } = new URL(request.url)
  const month = searchParams.get("month") || new Date().getMonth() + 1
  const year = searchParams.get("year") || new Date().getFullYear()
  const timeRange = Number.parseInt(searchParams.get("timeRange") || "6")

  try {
    // Get total expenses
    const [totalExpensesResult] = await db.query("SELECT SUM(amount) as total FROM expenses WHERE user_id = ?", [
      user.id,
    ])
    const totalExpenses = (totalExpensesResult as any[])[0].total || 0

    // Get monthly expenses
    const [monthlyExpensesResult] = await db.query(
      "SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?",
      [user.id, month, year],
    )
    const monthlyExpenses = (monthlyExpensesResult as any[])[0].total || 0

    // Get total income
    const [totalIncomeResult] = await db.query("SELECT SUM(amount) as total FROM income WHERE user_id = ?", [user.id])
    const totalIncome = (totalIncomeResult as any[])[0].total || 0

    // Get monthly income
    const [monthlyIncomeResult] = await db.query(
      "SELECT SUM(amount) as total FROM income WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?",
      [user.id, month, year],
    )
    const monthlyIncome = (monthlyIncomeResult as any[])[0].total || 0

    // Get category counts
    const [categoriesResult] = await db.query(
      "SELECT COUNT(*) as count FROM categories WHERE user_id = ? AND type = 'expense'",
      [user.id],
    )
    const categoriesCount = (categoriesResult as any[])[0].count

    // Get payment method counts
    const [paymentMethodsResult] = await db.query("SELECT COUNT(*) as count FROM payment_methods WHERE user_id = ?", [
      user.id,
    ])
    const paymentMethodsCount = (paymentMethodsResult as any[])[0].count

    // Get expenses by category for the month
    const [expensesByCategory] = await db.query(
      `SELECT c.name, SUM(e.amount) as value
       FROM expenses e
       JOIN categories c ON e.category_id = c.id
       WHERE e.user_id = ? AND MONTH(e.date) = ? AND YEAR(e.date) = ?
       GROUP BY c.name
       ORDER BY value DESC`,
      [user.id, month, year],
    )

    // Get recent expenses
    const [recentExpenses] = await db.query(
      `SELECT e.*, c.name as category_name, pm.name as payment_method_name
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       LEFT JOIN payment_methods pm ON e.payment_method_id = pm.id
       WHERE e.user_id = ?
       ORDER BY e.date DESC
       LIMIT 5`,
      [user.id],
    )

    // Get monthly expense and income trend for the past X months
    const [monthlyTrend] = await db.query(
      `SELECT 
         YEAR(date) as year,
         MONTH(date) as month,
         'expenses' as type,
         SUM(amount) as total
       FROM expenses
       WHERE user_id = ? 
       AND date >= DATE_SUB(LAST_DAY(CURRENT_DATE), INTERVAL ? MONTH)
       GROUP BY YEAR(date), MONTH(date)
       
       UNION ALL
       
       SELECT 
         YEAR(date) as year,
         MONTH(date) as month,
         'income' as type,
         SUM(amount) as total
       FROM income
       WHERE user_id = ? 
       AND date >= DATE_SUB(LAST_DAY(CURRENT_DATE), INTERVAL ? MONTH)
       GROUP BY YEAR(date), MONTH(date)
       
       ORDER BY year, month`,
      [user.id, timeRange, user.id, timeRange],
    )

    // Process the monthly trend data to combine expenses and income for each month
    const processedMonthlyTrend: any[] = []
    const monthsMap = new Map()
    ;(monthlyTrend as any[]).forEach((item) => {
      const key = `${item.year}-${item.month}`
      if (!monthsMap.has(key)) {
        monthsMap.set(key, {
          year: item.year,
          month: item.month,
          expenses: 0,
          income: 0,
        })
      }

      if (item.type === "expenses") {
        monthsMap.get(key).expenses = Number.parseFloat(item.total)
      } else if (item.type === "income") {
        monthsMap.get(key).income = Number.parseFloat(item.total)
      }
    })

    // Convert map to array and sort by date
    monthsMap.forEach((value) => {
      processedMonthlyTrend.push(value)
    })

    processedMonthlyTrend.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return a.month - b.month
    })

    // Get expense predictions for next month
    const [expensePredictions] = await db.query(
      `SELECT 
         c.name, 
         AVG(e.amount) as average_amount,
         COUNT(*) as frequency
       FROM expenses e
       JOIN categories c ON e.category_id = c.id
       WHERE e.user_id = ? 
       AND e.date >= DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH)
       GROUP BY c.name
       ORDER BY average_amount DESC
       LIMIT 5`,
      [user.id],
    )

    return NextResponse.json({
      stats: {
        totalExpenses,
        monthlyExpenses,
        totalIncome,
        monthlyIncome,
        categories: categoriesCount,
        paymentMethods: paymentMethodsCount,
        savings: totalIncome - totalExpenses,
        monthlySavings: monthlyIncome - monthlyExpenses,
      },
      expensesByCategory,
      recentExpenses,
      monthlyTrend: processedMonthlyTrend,
      predictions: expensePredictions,
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

