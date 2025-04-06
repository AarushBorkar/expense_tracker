"use client"

import { useEffect, useState } from "react"
import { Edit, Plus, Trash } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { BudgetForm } from "@/components/budget-form"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth"
import { formatCurrency } from "@/lib/currency"

export default function BudgetsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [budgets, setBudgets] = useState([])
  const [expenses, setExpenses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState<any>(null)

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth)
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ]

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  useEffect(() => {
    if (!user) return

    const fetchBudgets = async () => {
      setIsLoading(true)
      try {
        // Fetch budgets for the selected month and year
        const response = await fetch(`/api/budgets?month=${selectedMonth}&year=${selectedYear}`)

        if (!response.ok) {
          throw new Error("Failed to fetch budgets")
        }

        const data = await response.json()
        setBudgets(data)

        // Fetch expenses for the same period to calculate progress
        const fromDate = new Date(selectedYear, selectedMonth - 1, 1)
        const toDate = new Date(selectedYear, selectedMonth, 0)

        const fromDateStr = format(fromDate, "yyyy-MM-dd")
        const toDateStr = format(toDate, "yyyy-MM-dd")

        const expensesResponse = await fetch(`/api/expenses?fromDate=${fromDateStr}&toDate=${toDateStr}`)

        if (expensesResponse.ok) {
          const expensesData = await expensesResponse.json()
          setExpenses(expensesData)
        }
      } catch (error) {
        console.error("Error fetching budgets:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load budgets. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchBudgets()
  }, [user, toast, selectedMonth, selectedYear])

  const handleAddBudget = async (budget: any) => {
    try {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...budget,
          month: selectedMonth,
          year: selectedYear,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add budget")
      }

      const newBudget = await response.json()
      setBudgets([...budgets, newBudget])
      setShowForm(false)
      toast({
        title: "Budget added",
        description: "Your budget has been added successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add budget. Please try again.",
      })
    }
  }

  const handleEditBudget = (budget: any) => {
    setEditingBudget(budget)
    setShowForm(true)
  }

  const handleUpdateBudget = async (updatedBudget: any) => {
    try {
      const response = await fetch(`/api/budgets/${updatedBudget.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedBudget),
      })

      if (!response.ok) {
        throw new Error("Failed to update budget")
      }

      const updated = await response.json()
      setBudgets(budgets.map((budget) => (budget.id === updated.id ? updated : budget)))
      setShowForm(false)
      setEditingBudget(null)
      toast({
        title: "Budget updated",
        description: "Your budget has been updated successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update budget. Please try again.",
      })
    }
  }

  const handleDeleteBudget = async (id: number) => {
    try {
      const response = await fetch(`/api/budgets/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete budget")
      }

      setBudgets(budgets.filter((budget) => budget.id !== id))
      toast({
        title: "Budget deleted",
        description: "Your budget has been deleted successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete budget. Please try again.",
      })
    }
  }

  // Calculate budget progress
  const calculateProgress = (categoryId: number, budgetAmount: number) => {
    const categoryExpenses = expenses.filter((expense: any) => expense.category_id === categoryId)
    const totalSpent = categoryExpenses.reduce((sum: number, expense: any) => sum + Number(expense.amount), 0)
    const percentage = (totalSpent / budgetAmount) * 100
    return {
      spent: totalSpent,
      percentage: Math.min(percentage, 100), // Cap at 100% for progress bar
      isOverBudget: percentage > 100,
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please login to view your budgets</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Budgets</h2>
        <div className="flex items-center space-x-2">
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(Number(value))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              setEditingBudget(null)
              setShowForm(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Budget
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingBudget ? "Edit Budget" : "Add Budget"}</CardTitle>
            <CardDescription>
              {editingBudget ? "Update your budget details" : "Enter your budget details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BudgetForm
              budget={editingBudget}
              onSubmit={editingBudget ? handleUpdateBudget : handleAddBudget}
              onCancel={() => {
                setShowForm(false)
                setEditingBudget(null)
              }}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Budget List</CardTitle>
          <CardDescription>
            Manage your budgets for {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-4">Loading budget data...</div>
          ) : budgets.length === 0 ? (
            <div className="flex justify-center p-4">No budgets found. Add your first budget!</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Budget Amount</TableHead>
                  <TableHead>Spent</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.map((budget: any) => {
                  const progress = calculateProgress(budget.category_id, Number(budget.amount))
                  const remaining = Number(budget.amount) - progress.spent
                  return (
                    <TableRow key={budget.id}>
                      <TableCell className="font-medium">{budget.category_name}</TableCell>
                      <TableCell>{formatCurrency(Number(budget.amount))}</TableCell>
                      <TableCell>{formatCurrency(progress.spent)}</TableCell>
                      <TableCell
                        className={
                          remaining < 0
                            ? "text-red-500 font-medium"
                            : remaining < Number(budget.amount) * 0.1
                              ? "text-amber-500 font-medium"
                              : ""
                        }
                      >
                        {formatCurrency(remaining)}
                      </TableCell>
                      <TableCell>
                        <div className="w-full">
                          <Progress value={progress.percentage} className={progress.isOverBudget ? "bg-red-200" : ""} />
                          <p className="text-xs mt-1">
                            {progress.percentage.toFixed(0)}% {progress.isOverBudget && "(Over budget)"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                              >
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="19" r="1" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEditBudget(budget)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteBudget(budget.id)}>
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

