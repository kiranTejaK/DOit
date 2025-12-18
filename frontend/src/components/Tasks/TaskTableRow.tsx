import { Badge, Box, Flex, Text, Spinner, IconButton } from "@chakra-ui/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { type TaskPublic, UsersService, TasksService } from "@/client"
import { FiCircle, FiCheckCircle } from "react-icons/fi"
import TaskDetails from "./TaskDetails"

interface TaskTableRowProps {
  task: TaskPublic
  isOverlay?: boolean
}

export default function TaskTableRow({ task, isOverlay }: TaskTableRowProps) {
  const queryClient = useQueryClient()
  
  const updateStatusMutation = useMutation({
      mutationFn: (status: string) => TasksService.updateTask({ id: task.id, requestBody: { status } }),
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["tasks"] })
          queryClient.invalidateQueries({ queryKey: ["projects"] })
      }
  })

  const handleToggleStatus = (e: React.MouseEvent) => {
      e.stopPropagation()
      const newStatus = task.status === 'done' ? 'todo' : 'done'
      updateStatusMutation.mutate(newStatus)
  }
  
  const priorityColors: Record<string, string> = {
      low: "blue",
      medium: "yellow",
      high: "red"
  }

  const { data: assignee, isLoading: isLoadingAssignee } = useQuery({
      queryKey: ["user", task.assignee_id],
      queryFn: () => UsersService.readUserById({ userId: task.assignee_id! }),
      enabled: !!task.assignee_id,
      staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })

  const content = (
    <Flex 
        width="full" 
        bg={isOverlay ? "bg.sub" : "bg.sub"} 
        p={3} 
        rounded="md" 
        shadow={isOverlay ? "lg" : "sm"} 
        borderWidth="1px" 
        borderColor={isOverlay ? "ui.main" : "border.main"}
        alignItems="center"
        gap={4}
        cursor="grab"
        _hover={{ shadow: "md" }}
    >
        {/* Task Name & Completion */}
        <Box flex="2" display="flex" alignItems="center" gap={3}>
             <IconButton 
                aria-label="Mark as complete" 
                variant="ghost" 
                size="xs" 
                rounded="full"
                colorPalette={task.status === 'done' ? 'green' : 'gray'}
                _hover={{ bg: "bg.muted", color: "green.500" }}
                onClick={handleToggleStatus}
                loading={updateStatusMutation.isPending}
             >
                {task.status === 'done' ? <FiCheckCircle /> : <FiCircle />}
             </IconButton>
             <Text fontWeight="medium" lineClamp={1}>{task.title}</Text>
        </Box>

        {/* Assigned To */}
        <Box flex="1">
             {task.assignee_id ? (
                 isLoadingAssignee ? (
                     <Spinner size="xs" />
                 ) : (
                    <Text fontSize="sm">{assignee?.full_name || assignee?.email || "Unknown User"}</Text> 
                 )
             ) : (
                 <Text fontSize="sm" color="gray.400">Unassigned</Text>
             )}
        </Box>

        {/* Priority */}
        <Box flex="1">
            <Badge size="sm" variant="subtle" colorPalette={priorityColors[task.priority] || "gray"}>
                {task.priority || "None"}
            </Badge>
        </Box>

        {/* Due Date */}
        <Box flex="1">
             <Text fontSize="sm" color={task.due_date ? "inherit" : "gray.400"}>
                 {task.due_date ? new Date(task.due_date).toLocaleDateString() : "-"}
             </Text>
        </Box>
    </Flex>
  )

  if (isOverlay) {
    return content
  }

  return (
    <TaskDetails task={task}>
      {content}
    </TaskDetails>
  )
}
