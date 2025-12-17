import { Badge, Box, Flex, Text, Spinner } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { type TaskPublic, UsersService } from "@/client"
import TaskDetails from "./TaskDetails"

interface TaskTableRowProps {
  task: TaskPublic
  isOverlay?: boolean
}

export default function TaskTableRow({ task, isOverlay }: TaskTableRowProps) {
  
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
        bg={isOverlay ? "white" : "white"} 
        p={3} 
        rounded="md" 
        shadow={isOverlay ? "lg" : "sm"} 
        borderWidth="1px" 
        borderColor={isOverlay ? "blue.400" : "gray.200"}
        alignItems="center"
        gap={4}
        cursor="grab"
        _hover={{ shadow: "md" }}
    >
        {/* Task Name */}
        <Box flex="2">
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
