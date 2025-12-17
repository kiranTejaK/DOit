import { Badge, Box, Flex, Text } from "@chakra-ui/react"
import type { TaskPublic } from "../../client"
import TaskDetails from "./TaskDetails"

interface TaskCardProps {
    task: TaskPublic
    isOverlay?: boolean
}

export default function TaskCard({ task, isOverlay = false }: TaskCardProps) {
     return (
        <TaskDetails task={task}>
            <Box 
                bg="white" 
                p={3} 
                rounded="md" 
                shadow={isOverlay ? "lg" : "sm"} 
                borderWidth="1px"
                borderColor={isOverlay ? "teal.500" : "gray.200"} 
                cursor={isOverlay ? "grabbing" : "grab"}
                _hover={{ borderColor: "teal.500", shadow: "md" }}
                transition="all 0.2s"
                opacity={1}
            >
                <Text fontWeight="medium" mb={1} truncate>{task.title}</Text>
                {task.description && (
                    <Text fontSize="sm" color="gray.500" lineClamp={2} mb={2}>{task.description}</Text>
                )}
                <Flex gap={2}>
                     <Badge size="sm" colorPalette={task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'yellow' : 'blue'}>
                         {task.priority || "Normal"}
                     </Badge>
                     {task.due_date && (
                        <Badge size="sm" variant="outline" colorPalette="gray">
                            {new Date(task.due_date).toLocaleDateString()}
                        </Badge>
                     )}
                </Flex>
            </Box>
        </TaskDetails>
    )
}
