import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from "@dnd-kit/core"
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import { Flex } from "@chakra-ui/react"
import { useState, useEffect } from "react"

import type { TaskPublic } from "@/client"
import KanbanColumn from "./KanbanColumn"
import TaskTableRow from "../Tasks/TaskTableRow"

// Define our fixed columns
const COLUMNS = [
  { id: "todo", title: "Todo" },
  { id: "in_progress", title: "In Progress" },
  { id: "done", title: "Completed" },
  { id: "re_opened", title: "Re-opened" },
]

// Helper to find container
const findContainer = (id: string, items: Record<string, string[]>) => {
  if (id in items) {
    return id
  }

  return Object.keys(items).find((key) => items[key].includes(id))
}

interface KanbanBoardProps {
  tasks: TaskPublic[]
  onTaskMove: (taskId: string, newStatus: string, newIndex: number) => void
}

export default function KanbanBoard({ tasks, onTaskMove }: KanbanBoardProps) {
  // Map tasks to { [status]: [taskId1, taskId2] }
  const [items, setItems] = useState<Record<string, string[]>>({})
  const [activeId, setActiveId] = useState<string | null>(null)

  // Initialize items from props
  useEffect(() => {
    const newItems: Record<string, string[]> = {}
    
    // Initialize empty arrays for all fixed columns
    COLUMNS.forEach(col => newItems[col.id] = [])

    tasks.forEach(t => {
       // Normalize status to lowercase to match column IDs, fallback to 'todo'
       const status = t.status?.toLowerCase() || "todo"
       // Use status if it's a valid column, otherwise force to 'todo' or a 'misc' if needed. 
       // For now, let's assume valid statuses. If valid status is not in COLUMNS, maybe put in todo?
       const targetCol = COLUMNS.find(c => c.id === status) ? status : "todo"
       
       newItems[targetCol].push(t.id)
    })
    
    setItems(newItems)
  }, [tasks]) 

  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 5, // Prevent accidental drags
        }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    const overId = over?.id

    if (overId == null || active.id in items) {
      return
    }

    const overContainer = findContainer(overId as string, items)
    const activeContainer = findContainer(active.id as string, items)

    if (!overContainer || !activeContainer) {
      return
    }

    if (activeContainer !== overContainer) {
      setItems((prev) => {
        const activeItems = prev[activeContainer]
        const overItems = prev[overContainer]
        const overIndex = overItems.indexOf(overId as string)
        const activeIndex = activeItems.indexOf(active.id as string)

        let newIndex: number

        if (overId in prev) {
          newIndex = overItems.length + 1
        } else {
          const isBelowOverItem =
            over &&
            active.rect.current.translated &&
            active.rect.current.translated.top >
              over.rect.top + over.rect.height

          const modifier = isBelowOverItem ? 1 : 0
          newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1
        }

        return {
          ...prev,
          [activeContainer]: [
            ...prev[activeContainer].filter((item) => item !== active.id),
          ],
          [overContainer]: [
            ...prev[overContainer].slice(0, newIndex),
            items[activeContainer][activeIndex],
            ...prev[overContainer].slice(newIndex, prev[overContainer].length),
          ],
        }
      })
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    const activeContainer = findContainer(active.id as string, items)
    const overContainer = over ? findContainer(over.id as string, items) : null

    if (
        activeContainer &&
        overContainer &&
        (activeContainer !== overContainer || (over && active.id !== over.id))
    ) {
        
        const activeIndex = items[activeContainer].indexOf(active.id as string)
        if (!over) return 
        const overIndex = items[overContainer].indexOf(over.id as string)
        
        let newItems = { ...items }

        if (activeContainer === overContainer) {
            newItems[activeContainer] = arrayMove(newItems[activeContainer], activeIndex, overIndex)
        } else {
             newItems[activeContainer] = newItems[activeContainer].filter((id) => id !== active.id)
             newItems[overContainer] = [
                ...newItems[overContainer].slice(0, overIndex),
                active.id as string,
                ...newItems[overContainer].slice(overIndex, newItems[overContainer].length)
             ]
        }
        
        setItems(newItems)
        
        // Trigger callback with new Status (which is the container ID)
        onTaskMove(active.id as string, overContainer, overIndex)
    }

    setActiveId(null)
  }
  
  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  }
  
  const activeTask = tasks.find(t => t.id === activeId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <Flex direction="column" gap={4} h="full" pb={4} w="full">
         {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
             tasks={items[col.id]?.map(id => tasks.find(t => t.id === id)!).filter(Boolean) || []}
          />
        ))}

        <DragOverlay dropAnimation={dropAnimation}>
            {activeTask ? <TaskTableRow task={activeTask} isOverlay /> : null}
        </DragOverlay>

      </Flex>
    </DndContext>
  )
}
