import {
  Container,
  Flex,
  Heading,
  Box,
  Text,
  Spinner,
  Button,
  VStack,
  HStack,
} from "@chakra-ui/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { IoPeopleOutline, IoAdd } from "react-icons/io5"

import { ProjectsService, TasksService, WorkspacesService } from "@/client" 
import KanbanBoard from "@/components/Projects/KanbanBoard"
import AddTask from "@/components/Tasks/AddTask"

import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toaster } from "@/components/ui/toaster"

export const Route = createFileRoute("/_layout/projects/$projectId")({
  component: ProjectDetails,
})

function ProjectMembersDialog({ projectId, workspaceId }: { projectId: string, workspaceId: string }) {
    const queryClient = useQueryClient()
    const [selectedUserId, setSelectedUserId] = useState("")

    const { data: members, isLoading: isLoadingMembers } = useQuery({
        queryKey: ["project-members", projectId],
        queryFn: () => ProjectsService.readProjectMembers({ id: projectId }),
    })

    const { data: workspaceMembers } = useQuery({
        queryKey: ["workspace-members", workspaceId],
        queryFn: () => WorkspacesService.readWorkspaceMembers({ id: workspaceId, limit: 100 }),
        enabled: !!workspaceId
    })

    const addMemberMutation = useMutation({
        mutationFn: (userId: string) => ProjectsService.addProjectMember({ 
            id: projectId, 
            requestBody: { user_id: userId, role: "member" } 
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-members", projectId] })
            toaster.create({ title: "Member added", type: "success" })
            setSelectedUserId("")
        },
        onError: (err: any) => {
             const errorDetail = err.body?.detail || err.message || "Failed to add member"
             toaster.create({ title: "Failed to add member", description: errorDetail, type: "error" })
        }
    })

    // Filter out existing members
    const availableMembers = workspaceMembers?.data.filter(
        (wm: any) => !members?.data.some((pm: any) => pm.id === wm.id)
    ) || []

    return (
        <DialogRoot size="md" placement="center">
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" ml={4}>
                    <IoPeopleOutline /> Members
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Project Members</DialogTitle>
                    <DialogCloseTrigger />
                </DialogHeader>
                <DialogBody pb={6}>
                    <VStack align="stretch" gap={4}>
                         {/* Add Member Section */}
                         <Box>
                            <Text fontSize="sm" fontWeight="medium" mb={2}>Add Member</Text>
                            <HStack>
                                {/* Native select for simplicity if UI select is complex */}
                                <select 
                                    style={{ 
                                        width: '100%', 
                                        padding: '8px', 
                                        borderRadius: '6px', 
                                        border: '1px solid #E2E8F0',
                                        outline: 'none' 
                                    }}
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                >
                                    <option value="">Select user...</option>
                                    {availableMembers.map((user: any) => (
                                        <option key={user.id} value={user.id}>
                                            {user.full_name || user.email}
                                        </option>
                                    ))}
                                </select>
                                <Button 
                                    size="sm" 
                                    disabled={!selectedUserId} 
                                    loading={addMemberMutation.isPending}
                                    onClick={() => addMemberMutation.mutate(selectedUserId)}
                                >
                                    <IoAdd /> Add
                                </Button>
                            </HStack>
                         </Box>

                         <Text fontSize="sm" fontWeight="medium">Current Members ({members?.count || 0})</Text>
                         {isLoadingMembers ? <Spinner size="sm" /> : (
                             <VStack align="stretch" gap={2} maxH="300px" overflowY="auto">
                                 {members?.data.map((member: any) => (
                                     <HStack key={member.id} justify="space-between" p={2} bg="bg.muted" rounded="md">
                                         <Text fontSize="sm">{member.full_name || member.email}</Text>
                                         <Text fontSize="xs" color="gray.500">{member.role}</Text>
                                     </HStack>
                                 ))}
                             </VStack>
                         )}
                    </VStack>
                </DialogBody>
            </DialogContent>
        </DialogRoot>
    )
}

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
          <HStack>
              <Heading size="lg">{project.name}</Heading>
              {project && <ProjectMembersDialog projectId={projectId} workspaceId={project.workspace_id} />}
          </HStack>
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
