import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Box, Flex, Heading, Badge } from "@chakra-ui/react"

import type { TaskPublic } from "../../client"
import TaskTableRow from "../Tasks/TaskTableRow"

interface KanbanColumnProps {
  id: string
  title: string
  tasks: TaskPublic[]
}

export default function KanbanColumn({ id, title, tasks }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: id,
  })

  return (
    <Box
      ref={setNodeRef}
      minH="auto"
      w="full"
      bg="bg.muted"
      p={3}
      rounded="md"
      borderWidth="1px"
      borderColor="border.main"
    >
      <Flex justify="space-between" mb={2}>
        <Heading size="sm">
          {title} <Badge ml={2}>{tasks.length}</Badge>
        </Heading>
      </Flex>

      {/* Table Header */}
      <Flex w="full" px={3} py={2} mb={2} borderBottomWidth="1px" borderColor="border.main" color="gray.500" fontSize="xs" fontWeight="bold">
          <Box flex="2">TASK NAME</Box>
          <Box flex="1">ASSIGNED TO</Box>
          <Box flex="1">PRIORITY</Box>
          <Box flex="1">DUE DATE</Box>
      </Flex>

      <SortableContext
        id={id}
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <Flex direction="column" gap={2} pb={2} minH="50px">
          {tasks.map((task) => (
            <SortableTaskItem key={task.id} task={task} />
          ))}
          {/* Add spacer or empty box to ensure drop area exists if empty? */}
           {tasks.length === 0 && <Box minW="100px" h="50px" borderStyle="dashed" borderWidth="1px" borderColor="gray.300" rounded="md" display="flex" alignItems="center" justifyContent="center" color="gray.400">Empty</Box>}
        </Flex>
      </SortableContext>
    </Box>
  )
}

export function SortableTaskItem({ task }: { task: TaskPublic }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  return (
    <Box ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskTableRow task={task} />
    </Box>
  )
}
