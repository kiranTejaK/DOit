import {
  Container,
  Flex,
  Heading,
  Box,
  Text,
  Spinner,
} from "@chakra-ui/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { ProjectsService, TasksService } from "@/client" 
// import AddSection from "@/components/Sections/AddSection" // Unused
import KanbanBoard from "@/components/Projects/KanbanBoard"
import AddTask from "@/components/Tasks/AddTask"

export const Route = createFileRoute("/_layout/projects/$projectId")({
  component: ProjectDetails,
})

function ProjectDetails() {
  const { projectId } = Route.useParams()
  const queryClient = useQueryClient()

  // Fetch Project Details
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ["projects", projectId],
    queryFn: () => ProjectsService.readProject({ id: projectId }),
  })

  // Fetch Tasks
  const { data: tasksData, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["tasks", { projectId }],
    queryFn: () => TasksService.readTasks({ projectId: projectId, limit: 1000 }),
  })
  
  const tasks = tasksData?.data || []

  // Mutation to update Task Status
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string, status: string }) =>
      TasksService.updateTask({ id: taskId, requestBody: { status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", { projectId }] })
    },
    onError: (error) => {
      console.error("Failed to update task:", error)
    },
  })

  const handleTaskMove = (taskId: string, newStatus: string, _newIndex: number) => {
    updateTaskMutation.mutate({
      taskId,
      status: newStatus,
    })
  }

  if (isLoadingProject || isLoadingTasks) {
    return (
        <Flex justify="center" align="center" h="100vh">
            <Spinner size="xl" />
        </Flex>
    )
  }

  if (!project) return <Box p={4}>Project not found.</Box>

  return (
    <Container maxW="full" h="calc(100vh - 100px)">
      <Flex direction="column" h="full">
        <Flex justify="space-between" align="center" pt={4} pb={4}>
          <Heading size="lg">{project.name}</Heading>
          <AddTask projectId={projectId} /> 
        </Flex>
        
        {/* Kanban Board Container */}
        {tasks.length === 0 ? (
          <Box p={8} textAlign="center" bg="bg.muted" rounded="md">
            <Text mb={4} color="gray.500">No tasks in this project yet.</Text>
            <AddTask projectId={projectId} />
          </Box>
      ) : (
        <Box flex="1" overflowX="auto" pb={4}>
            <KanbanBoard 
                tasks={tasks} 
                onTaskMove={handleTaskMove}
            />
        </Box>
      )}
      </Flex>
    </Container>
  )
}
