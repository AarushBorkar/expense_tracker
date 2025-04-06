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
import { IncomeForm } from "@/components/income-form"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth"
import { formatCurrency } from "@/lib/currency"

export default function IncomePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [income, setIncome] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingIncome, setEditingIncome] = useState<any>(null)
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  })
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchIncome = async () => {
      setIsLoading(true)
      try {
        // Format dates for API request
        const fromDateStr = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : ""
        const toDateStr = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : ""

        let url = "/api/income"
        const params = new URLSearchParams()

        if (fromDateStr) params.append("fromDate", fromDateStr)
        if (toDateStr) params.append("toDate", toDateStr)
        if (selectedCategory) params.append("categoryId", selectedCategory)

        if (params.toString()) {
          url += `?${params.toString()}`
        }

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error("Failed to fetch income")
        }

        const data = await response.json()
        setIncome(data)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load income data. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchIncome()
  }, [user, toast, dateRange, selectedCategory])

  const handleAddIncome = async (incomeData: any) => {
    try {
      const response = await fetch("/api/income", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(incomeData),
      })

      if (!response.ok) {
        throw new Error("Failed to add income")
      }

      const newIncome = await response.json()
      setIncome([newIncome, ...income])
      setShowForm(false)
      toast({
        title: "Income added",
        description: "Your income has been added successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add income. Please try again.",
      })
    }
  }

  const handleEditIncome = (income: any) => {
    setEditingIncome(income)
    setShowForm(true)
  }

  const handleUpdateIncome = async (updatedIncome: any) => {
    try {
      const response = await fetch(`/api/income/${updatedIncome.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedIncome),
      })

      if (!response.ok) {
        throw new Error("Failed to update income")
      }

      const updated = await response.json()
      setIncome(income.map((inc) => (inc.id === updated.id ? updated : inc)))
      setShowForm(false)
      setEditingIncome(null)
      toast({
        title: "Income updated",
        description: "Your income has been updated successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update income. Please try again.",
      })
    }
  }

  const handleDeleteIncome = async (id: number) => {
    try {
      const response = await fetch(`/api/income/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete income")
      }

      setIncome(income.filter((inc) => inc.id !== id))
      toast({
        title: "Income deleted",
        description: "Your income has been deleted successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete income. Please try again.",
      })
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please login to view your income</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Income</h2>
        <div className="flex items-center space-x-2">
          <DateRangePicker date={dateRange} setDate={setDateRange} />
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
            <span className="sr-only">Filter</span>
          </Button>
          <Button
            onClick={() => {
              setEditingIncome(null)
              setShowForm(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Income
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingIncome ? "Edit Income" : "Add Income"}</CardTitle>
            <CardDescription>
              {editingIncome ? "Update your income details" : "Enter your income details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IncomeForm
              income={editingIncome}
              onSubmit={editingIncome ? handleUpdateIncome : handleAddIncome}
              onCancel={() => {
                setShowForm(false)
                setEditingIncome(null)
              }}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Income List</CardTitle>
          <CardDescription>Manage your income</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-4">Loading income data...</div>
          ) : income.length === 0 ? (
            <div className="flex justify-center p-4">No income records found. Add your first income!</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {income.map((inc: any) => (
                  <TableRow key={inc.id}>
                    <TableCell className="font-medium">{inc.description}</TableCell>
                    <TableCell>{inc.category_name || "Uncategorized"}</TableCell>
                    <TableCell>{format(new Date(inc.date), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number.parseFloat(inc.amount))}</TableCell>
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
                          <DropdownMenuItem onClick={() => handleEditIncome(inc)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteIncome(inc.id)}>
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

