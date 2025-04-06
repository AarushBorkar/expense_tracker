"use client"

import { useEffect, useState } from "react"
import { Edit, Plus, Trash, Target, CheckCircle } from "lucide-react"
import { format, differenceInDays } from "date-fns"

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { GoalForm } from "@/components/goal-form"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth"
import { formatCurrency } from "@/lib/currency"

export default function GoalsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [goals, setGoals] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("active")

  useEffect(() => {
    if (!user) return

    const fetchGoals = async () => {
      setIsLoading(true)
      try {
        const isCompleted = activeTab === "completed" ? "true" : "false"
        const response = await fetch(`/api/goals?isCompleted=${isCompleted}`)

        if (!response.ok) {
          throw new Error("Failed to fetch goals")
        }

        const data = await response.json()
        setGoals(data)
      } catch (error) {
        console.error("Error fetching goals:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load goals. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchGoals()
  }, [user, toast, activeTab])

  const handleAddGoal = async (goal: any) => {
    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(goal),
      })

      if (!response.ok) {
        throw new Error("Failed to add goal")
      }

      const newGoal = await response.json()
      setGoals([...goals, newGoal])
      setShowForm(false)
      toast({
        title: "Goal added",
        description: "Your financial goal has been added successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add goal. Please try again.",
      })
    }
  }

  const handleEditGoal = (goal: any) => {
    setEditingGoal(goal)
    setShowForm(true)
  }

  const handleUpdateGoal = async (updatedGoal: any) => {
    try {
      const response = await fetch(`/api/goals/${updatedGoal.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedGoal),
      })

      if (!response.ok) {
        throw new Error("Failed to update goal")
      }

      const updated = await response.json()

      // If the goal's completion status changed, we need to refresh the list
      if (Boolean(updated.is_completed) !== (activeTab === "completed")) {
        setGoals(goals.filter((g) => g.id !== updated.id))
      } else {
        setGoals(goals.map((goal) => (goal.id === updated.id ? updated : goal)))
      }

      setShowForm(false)
      setEditingGoal(null)
      toast({
        title: "Goal updated",
        description: "Your financial goal has been updated successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update goal. Please try again.",
      })
    }
  }

  const handleDeleteGoal = async (id: number) => {
    try {
      const response = await fetch(`/api/goals/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete goal")
      }

      setGoals(goals.filter((goal) => goal.id !== id))
      toast({
        title: "Goal deleted",
        description: "Your financial goal has been deleted successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete goal. Please try again.",
      })
    }
  }

  // Calculate days remaining and progress
  const calculateGoalMetrics = (goal: any) => {
    const targetDate = new Date(goal.target_date)
    const daysRemaining = differenceInDays(targetDate, new Date())
    const progress = Math.min(100, (Number(goal.current_amount) / Number(goal.target_amount)) * 100)

    return {
      daysRemaining,
      progress,
      isOverdue: daysRemaining < 0,
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please login to view your financial goals</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Financial Goals</h2>
        <Button
          onClick={() => {
            setEditingGoal(null)
            setShowForm(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Goal
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingGoal ? "Edit Goal" : "Add Financial Goal"}</CardTitle>
            <CardDescription>
              {editingGoal ? "Update your financial goal details" : "Set a new financial goal to track your progress"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GoalForm
              goal={editingGoal}
              onSubmit={editingGoal ? handleUpdateGoal : handleAddGoal}
              onCancel={() => {
                setShowForm(false)
                setEditingGoal(null)
              }}
            />
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="active" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active Goals</TabsTrigger>
          <TabsTrigger value="completed">Completed Goals</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-4">Loading goals...</div>
          ) : goals.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No active goals found</h3>
              <p className="text-muted-foreground mt-2">
                Create your first financial goal to start tracking your progress!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal) => {
                const { progress, daysRemaining, isOverdue } = calculateGoalMetrics(goal)
                return (
                  <Card key={goal.id} className="overflow-hidden">
                    <Progress value={progress} className="rounded-none h-2" />
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{goal.title}</CardTitle>
                          <CardDescription>
                            {goal.category_name ? `Category: ${goal.category_name}` : "No category"}
                          </CardDescription>
                        </div>
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
                            <DropdownMenuItem onClick={() => handleEditGoal(goal)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteGoal(goal.id)}>
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Target:</span>
                            <span className="text-sm">{formatCurrency(goal.target_amount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Current:</span>
                            <span className="text-sm">{formatCurrency(goal.current_amount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Remaining:</span>
                            <span className="text-sm">
                              {formatCurrency(Number(goal.target_amount) - Number(goal.current_amount))}
                            </span>
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex justify-between items-center">
                            <div className="text-sm">
                              <span className="font-medium">Progress: </span>
                              <span>{progress.toFixed(1)}%</span>
                            </div>
                            <div className={`text-sm ${isOverdue ? "text-red-500" : ""}`}>
                              {isOverdue ? (
                                <span>Overdue by {Math.abs(daysRemaining)} days</span>
                              ) : (
                                <span>{daysRemaining} days left</span>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Target date: {format(new Date(goal.target_date), "MMM dd, yyyy")}
                          </div>
                        </div>
                        {goal.description && (
                          <div className="pt-2 border-t">
                            <p className="text-sm text-muted-foreground">{goal.description}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
        <TabsContent value="completed" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-4">Loading completed goals...</div>
          ) : goals.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No completed goals yet</h3>
              <p className="text-muted-foreground mt-2">Your completed financial goals will appear here</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal) => (
                <Card key={goal.id} className="overflow-hidden">
                  <div className="h-2 bg-green-500" />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          {goal.title}
                        </CardTitle>
                        <CardDescription>
                          {goal.category_name ? `Category: ${goal.category_name}` : "No category"}
                        </CardDescription>
                      </div>
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
                          <DropdownMenuItem onClick={() => handleEditGoal(goal)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteGoal(goal.id)}>
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Target:</span>
                          <span className="text-sm">{formatCurrency(goal.target_amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Saved:</span>
                          <span className="text-sm">{formatCurrency(goal.current_amount)}</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="text-xs text-muted-foreground">
                          Completed on: {format(new Date(goal.updated_at), "MMM dd, yyyy")}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Target date: {format(new Date(goal.target_date), "MMM dd, yyyy")}
                        </div>
                      </div>
                      {goal.description && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">{goal.description}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

