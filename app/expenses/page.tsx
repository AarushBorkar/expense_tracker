"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Edit, Filter, Plus, Trash } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DateRangePicker } from "@/components/date-range-picker"
import { ExpenseForm } from "@/components/expense-form"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth"
import { formatCurrency } from "@/lib/currency"

export default function ExpensesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [expenses, setExpenses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  })
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchExpenses = async () => {
      setIsLoading(true)
      try {
        // Format dates for API request
        const fromDateStr = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : ""
        const toDateStr = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : ""

        let url = "/api/expenses"
        const params = new URLSearchParams()

        if (fromDateStr) params.append("fromDate", fromDateStr)
        if (toDateStr) params.append("toDate", toDateStr)
        if (selectedCategory) params.append("categoryId", selectedCategory)
        if (selectedPaymentMethod) params.append("paymentMethodId", selectedPaymentMethod)

        if (params.toString()) {
          url += `?${params.toString()}`
        }

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error("Failed to fetch expenses")
        }

        const data = await response.json()
        setExpenses(data)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load expenses. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchExpenses()
  }, [user, toast, dateRange, selectedCategory, selectedPaymentMethod])

  const handleAddExpense = async (expense: any) => {
    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expense),
      })

      if (!response.ok) {
        throw new Error("Failed to add expense")
      }

      const newExpense = await response.json()
      setExpenses([newExpense, ...expenses])
      setShowForm(false)
      toast({
        title: "Expense added",
        description: "Your expense has been added successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add expense. Please try again.",
      })
    }
  }

  const handleEditExpense = (expense: any) => {
    setEditingExpense(expense)
    setShowForm(true)
  }

  const handleUpdateExpense = async (updatedExpense: any) => {
    try {
      const response = await fetch(`/api/expenses/${updatedExpense.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedExpense),
      })

      if (!response.ok) {
        throw new Error("Failed to update expense")
      }

      const updated = await response.json()
      setExpenses(expenses.map((exp) => (exp.id === updated.id ? updated : exp)))
      setShowForm(false)
      setEditingExpense(null)
      toast({
        title: "Expense updated",
        description: "Your expense has been updated successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update expense. Please try again.",
      })
    }
  }

  const handleDeleteExpense = async (id: number) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete expense")
      }

      setExpenses(expenses.filter((exp) => exp.id !== id))
      toast({
        title: "Expense deleted",
        description: "Your expense has been deleted successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete expense. Please try again.",
      })
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please login to view your expenses</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Expenses</h2>
        <div className="flex items-center space-x-2">
          <DateRangePicker date={dateRange} setDate={setDateRange} />
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
            <span className="sr-only">Filter</span>
          </Button>
          <Button
            onClick={() => {
              setEditingExpense(null)
              setShowForm(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Expense
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingExpense ? "Edit Expense" : "Add Expense"}</CardTitle>
            <CardDescription>
              {editingExpense ? "Update your expense details" : "Enter your expense details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseForm
              expense={editingExpense}
              onSubmit={editingExpense ? handleUpdateExpense : handleAddExpense}
              onCancel={() => {
                setShowForm(false)
                setEditingExpense(null)
              }}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Expense List</CardTitle>
          <CardDescription>Manage your expenses</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-4">Loading expense data...</div>
          ) : expenses.length === 0 ? (
            <div className="flex justify-center p-4">No expenses found. Add your first expense!</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense: any) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell>{expense.category_name || "Uncategorized"}</TableCell>
                    <TableCell>{format(new Date(expense.date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{expense.payment_method_name || "Not specified"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number.parseFloat(expense.amount))}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <Filter className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditExpense(expense)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteExpense(expense.id)}>
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

