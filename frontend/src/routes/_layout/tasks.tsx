
import {
  Container,
  Heading,
  Table,
  Box,
  Badge,
  Flex,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { TasksService, type TaskPublicWithProject } from "@/client"
import AddTask from "@/components/Tasks/AddTask"
import TaskDetails from "@/components/Tasks/TaskDetails"

import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout/tasks")({
  component: MyTasks,
})


function MyTasks() {
  const { user } = useAuth()
  const [selectedTask, setSelectedTask] = useState<TaskPublicWithProject | null>(null)
  
  const { data: tasksData, isLoading, isError } = useQuery({
    queryKey: ["tasks", { assigneeId: user?.id }],
    queryFn: () => TasksService.readTasks({ assigneeId: user?.id, limit: 100 }),
    enabled: !!user?.id,
  })

  // Cast to correct type since we updated the service/backend
  const tasks = (tasksData?.data || []) as unknown as TaskPublicWithProject[]

  if (isLoading) {
      return <Container p={4}>Loading tasks...</Container>
  }
  
  if (isError) {
      return <Container p={4}>Error loading tasks.</Container>
  }

  return (
    <Container maxW="full">
      <Heading size="lg" pt={12} pb={8}>
        My Tasks
      </Heading>
      <Box overflowX="auto" bg="white" rounded="md" borderWidth="1px">
        <Table.Root size="sm" variant="outline" striped>
            <Table.Header>
                <Table.Row>
                    <Table.ColumnHeader>Title</Table.ColumnHeader>
                    <Table.ColumnHeader>Project</Table.ColumnHeader>
                    <Table.ColumnHeader>Status</Table.ColumnHeader>
                    <Table.ColumnHeader>Priority</Table.ColumnHeader>
                    <Table.ColumnHeader>Due Date</Table.ColumnHeader>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {tasks.length === 0 && (
                     <Table.Row>
                        <Table.Cell colSpan={5} textAlign="center">No tasks assigned to you yet.</Table.Cell>
                     </Table.Row>
                )}
                {tasks.map((task) => (
                    <Table.Row 
                        key={task.id} 
                        cursor="pointer" 
                        _hover={{ bg: "gray.50" }}
                        onClick={() => setSelectedTask(task)}
                    >
                        <Table.Cell fontWeight="medium">{task.title}</Table.Cell>
                        <Table.Cell>
                            <Flex align="center" gap={2}>
                                {task.project_color && (
                                    <Box w={2} h={2} rounded="full" bg={task.project_color} />
                                )}
                                {task.project_name || "-"}
                            </Flex>
                        </Table.Cell>
                        <Table.Cell>
                                <Badge variant="subtle">{task.status}</Badge>
                        </Table.Cell>
                        <Table.Cell>
                            <Badge colorPalette={task.priority === 'high' ? 'red' : 'green'}>{task.priority}</Badge>
                        </Table.Cell>
                        <Table.Cell>{task.due_date ? new Date(task.due_date).toLocaleDateString() : "-"}</Table.Cell>
                    </Table.Row>
                ))}
            </Table.Body>
        </Table.Root>
      </Box>
      <Box mt={4}>
          <AddTask />
      </Box>

      {selectedTask && (
        <TaskDetails 
            task={selectedTask} 
            isOpen={!!selectedTask} 
            onOpenChange={(e) => !e.open && setSelectedTask(null)}
        />
      )}
    </Container>
  )
}
